<?php
/**
 * api/handlers/trip.php
 * POST /api/trip/create-itinerary
 *
 * Expects JSON body:
 * {
 *   "email":           "user@example.com",
 *   "checkinDate":     "2025-12-01",
 *   "checkoutDate":    "2025-12-07",
 *   "travelers":       "3",
 *   "interests":       ["beaches", "food"],
 *   "specialRequests": "Vegetarian meals only"
 * }
 *
 * Also expects header:  X-CSRF-Token: <token from /api/csrf-token>
 */

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/csrf.php';
require_once __DIR__ . '/../../includes/rate_limit.php';
require_once __DIR__ . '/../../includes/validator.php';
require_once __DIR__ . '/../../includes/response.php';

// 1. Rate limiting (stricter for form submissions)
check_rate_limit('trip');

// 2. CSRF validation
$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!csrf_validate($csrfToken)) {
    json_error('Invalid or expired security token. Please refresh the page and try again.', 403);
}

// 3. Parse body
$body = get_json_body();
if ($body === null) {
    json_error('Request body must be valid JSON.');
}

// 4. Validate all fields
$errors = [];

$email = sanitise_string($body['email'] ?? '', 254);
if (!validate_email($email)) {
    $errors[] = 'Please provide a valid email address.';
}

$checkinDate  = sanitise_string($body['checkinDate']  ?? '', 10);
$checkoutDate = sanitise_string($body['checkoutDate'] ?? '', 10);

if (!validate_date($checkinDate)) {
    $errors[] = 'Check-in date is invalid.';
}
if (!validate_date($checkoutDate)) {
    $errors[] = 'Check-out date is invalid.';
}
if (validate_date($checkinDate) && validate_date($checkoutDate)) {
    if ($checkoutDate <= $checkinDate) {
        $errors[] = 'Check-out date must be after check-in date.';
    }
    if ($checkinDate < date('Y-m-d')) {
        $errors[] = 'Check-in date cannot be in the past.';
    }
}

$travelers = sanitise_string((string)($body['travelers'] ?? ''), 2);
if (!validate_travelers($travelers)) {
    $errors[] = 'Please select a valid number of travelers.';
}

$interests = is_array($body['interests'] ?? null) ? $body['interests'] : [];
if (!validate_interests($interests)) {
    $errors[] = 'Please select at least one valid travel interest.';
}

$specialRequests = sanitise_string($body['specialRequests'] ?? '', 500);

if (!empty($errors)) {
    json_error('Validation failed.', 422, ['errors' => $errors]);
}

// 5. Persist to database
try {
    $db = get_db();
    $stmt = $db->prepare("
        INSERT INTO trip_requests
               (email, checkin_date, checkout_date, travelers, interests, special_requests, ip_address)
        VALUES (:email, :checkin, :checkout, :travelers, :interests, :special, :ip)
    ");
    $stmt->execute([
        ':email'     => $email,
        ':checkin'   => $checkinDate,
        ':checkout'  => $checkoutDate,
        ':travelers' => $travelers,
        ':interests' => json_encode($interests),
        ':special'   => $specialRequests,
        ':ip'        => get_client_ip(),
    ]);

    $id = $db->lastInsertId();

} catch (PDOException $e) {
    json_error('Failed to save your request. Please try again.', 500);
}

// 6. Build a personalised itinerary summary
$nights   = (new DateTime($checkinDate))->diff(new DateTime($checkoutDate))->days;
$itinerary = build_itinerary($interests, $nights);

json_success([
    'message'   => "Your custom itinerary has been saved! We'll send details to $email.",
    'requestId' => (int)$id,
    'itinerary' => $itinerary,
], 201);


// ── Itinerary builder ─────────────────────────────────────────────────────────

function build_itinerary(array $interests, int $nights): array {
    $suggestions = [
        'beaches'   => ['Visit Palolem Beach (South Goa)', 'Explore Baga Beach nightlife', 'Sunrise at Anjuna Beach'],
        'culture'   => ['Tour the Basilica of Bom Jesus (UNESCO)', 'Visit Se Cathedral in Old Goa', 'Explore Ancestral Goa museum'],
        'adventure' => ['Parasailing at Baga Beach', 'Trekking to Dudhsagar Waterfalls', 'Scuba diving at Grande Island'],
        'food'      => ['Goan seafood thali at a beach shack', 'Fish curry rice at a local tascca', 'Bebinca dessert tasting'],
        'nightlife' => ['Tito\'s Lane in Baga', 'Club Cubana in Arpora', 'Sunset drinks at a Candolim beach shack'],
    ];

    $days = [];
    $pool = [];
    foreach ($interests as $interest) {
        if (isset($suggestions[$interest])) {
            $pool = array_merge($pool, $suggestions[$interest]);
        }
    }
    // Default activities if no interests matched
    if (empty($pool)) {
        $pool = ['Explore Old Goa', 'Relax on the beach', 'Visit a local market'];
    }

    $activitiesPerDay = 2;
    for ($day = 1; $day <= min($nights, 7); $day++) {
        $dayActivities = array_slice($pool, ($day - 1) * $activitiesPerDay, $activitiesPerDay);
        if (empty($dayActivities)) {
            $dayActivities = array_slice($pool, 0, $activitiesPerDay); // wrap around
        }
        $days[] = [
            'day'        => $day,
            'title'      => "Day $day",
            'activities' => $dayActivities,
        ];
    }

    return ['nights' => $nights, 'days' => $days];
}
