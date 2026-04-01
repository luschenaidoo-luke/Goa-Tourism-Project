<?php
/**
 * includes/response.php
 * Helpers for sending consistent JSON responses with CORS headers.
 */

require_once __DIR__ . '/../config.php';

function send_cors_headers(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

    // Handle pre-flight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_success(array $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode(['success' => true, ...$data]);
    exit;
}

function json_error(string $message, int $code = 400, array $extra = []): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message, ...$extra]);
    exit;
}
