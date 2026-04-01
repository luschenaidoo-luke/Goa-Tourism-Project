<?php
/**
 * api/handlers/csrf_token.php
 * GET /api/csrf-token
 * Returns a fresh CSRF token for the frontend to include in POST requests.
 */

require_once __DIR__ . '/../../includes/csrf.php';
require_once __DIR__ . '/../../includes/response.php';

json_success(['token' => csrf_generate()]);
