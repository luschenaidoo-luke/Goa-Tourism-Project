<?php
/**
 * api/index.php  —  Front controller for all /api/* routes.
 *
 * URL → file mapping:
 *   GET  /api/attractions              → handlers/attractions.php
 *   GET  /api/beaches                  → handlers/beaches.php
 *   GET  /api/beaches/region/{region}  → handlers/beaches.php
 *   GET  /api/csrf-token               → handlers/csrf_token.php
 *   POST /api/trip/create-itinerary    → handlers/trip.php
 */

require_once __DIR__ . '/../includes/response.php';

send_cors_headers();

// Strip query string, remove leading /api/
$uri    = strtok($_SERVER['REQUEST_URI'], '?');
$path   = trim(preg_replace('#^.*?/api/?#', '', $uri), '/');
$method = $_SERVER['REQUEST_METHOD'];

// ── Route table ───────────────────────────────────────────────────────────────
if ($method === 'GET'  && $path === 'attractions') {
    require __DIR__ . '/handlers/attractions.php';

} elseif ($method === 'GET' && ($path === 'beaches' || preg_match('#^beaches/region/[\w-]+$#', $path))) {
    require __DIR__ . '/handlers/beaches.php';

} elseif ($method === 'GET' && $path === 'csrf-token') {
    require __DIR__ . '/handlers/csrf_token.php';

} elseif ($method === 'POST' && $path === 'trip/create-itinerary') {
    require __DIR__ . '/handlers/trip.php';

} else {
    json_error("Route not found: [$method] /$path", 404);
}
