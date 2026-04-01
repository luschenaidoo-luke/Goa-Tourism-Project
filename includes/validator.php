<?php
/**
 * includes/validator.php
 * Reusable input sanitisation and validation helpers.
 */

function validate_email(string $email): bool {
    return (bool) filter_var(trim($email), FILTER_VALIDATE_EMAIL);
}

function validate_date(string $date): bool {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return false;
    [$y, $m, $d] = explode('-', $date);
    return checkdate((int)$m, (int)$d, (int)$y);
}

function validate_travelers(string $value): bool {
    return in_array($value, ['1', '3', '5', '8'], strict: true);
}

$VALID_INTERESTS = ['adventure', 'culture', 'beaches', 'food', 'nightlife'];

function validate_interests(array $interests): bool {
    global $VALID_INTERESTS;
    if (empty($interests)) return false;
    foreach ($interests as $i) {
        if (!in_array($i, $VALID_INTERESTS, strict: true)) return false;
    }
    return true;
}

/**
 * Sanitise a string: trim + strip HTML tags.
 * max_length prevents absurdly long payloads.
 */
function sanitise_string(string $value, int $max_length = 1000): string {
    return substr(strip_tags(trim($value)), 0, $max_length);
}

/**
 * Get + sanitise the raw JSON body.
 * Returns null if the body is missing or not valid JSON.
 */
function get_json_body(): ?array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return null;
    $data = json_decode($raw, associative: true);
    return is_array($data) ? $data : null;
}
