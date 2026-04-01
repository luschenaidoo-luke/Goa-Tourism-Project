<?php
/**
 * includes/csrf.php
 * Stateless HMAC-based CSRF tokens — no session required on the API side.
 *
 * Token format:  base64( timestamp . "." . hmac(secret, timestamp) )
 */

require_once __DIR__ . '/../config.php';

function csrf_generate(): string {
    $timestamp = time();
    $hmac      = hash_hmac('sha256', (string)$timestamp, APP_SECRET);
    return base64_encode($timestamp . '.' . $hmac);
}

function csrf_validate(?string $token): bool {
    if (empty($token)) {
        return false;
    }

    $decoded = base64_decode($token, strict: true);
    if ($decoded === false) {
        return false;
    }

    [$timestamp, $hmac] = explode('.', $decoded, 2) + [null, null];
    if ($timestamp === null || $hmac === null) {
        return false;
    }

    // Check token age
    if ((time() - (int)$timestamp) > CSRF_TOKEN_LIFETIME) {
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    $expected = hash_hmac('sha256', $timestamp, APP_SECRET);
    return hash_equals($expected, $hmac);
}
