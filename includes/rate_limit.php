<?php
/**
 * includes/rate_limit.php
 * Sliding-window rate limiter stored in SQLite.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';

function get_client_ip(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            // X-Forwarded-For can be a comma-separated list; take the first
            return trim(explode(',', $_SERVER[$key])[0]);
        }
    }
    return '0.0.0.0';
}

/**
 * Check rate limit for the current request.
 * Calls json_error() and exits if the limit is exceeded.
 */
function check_rate_limit(string $endpoint): void {
    $db         = get_db();
    $ip         = get_client_ip();
    $now        = time();
    $windowStart = $now - RATE_LIMIT_WINDOW;

    // Delete expired rows for this IP+endpoint
    $db->prepare("DELETE FROM rate_limits WHERE ip_address = ? AND endpoint = ? AND window_start < ?")
       ->execute([$ip, $endpoint, $windowStart]);

    // Count requests in the current window
    $countStmt = $db->prepare("
        SELECT COALESCE(SUM(request_count), 0)
        FROM rate_limits
        WHERE ip_address = ? AND endpoint = ? AND window_start >= ?
    ");
    $countStmt->execute([$ip, $endpoint, $windowStart]);
    $count = (int) $countStmt->fetchColumn();

    if ($count >= RATE_LIMIT_REQUESTS) {
        header('Retry-After: ' . RATE_LIMIT_WINDOW);
        json_error('Too many requests. Please wait before trying again.', 429);
    }

    // Log this request
    $db->prepare("INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start) VALUES (?, ?, 1, ?)")
       ->execute([$ip, $endpoint, $now]);
}
