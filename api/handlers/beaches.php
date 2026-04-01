<?php
/**
 * api/handlers/beaches.php
 * GET /api/beaches[?region=north-goa&featured=1]
 * GET /api/beaches/region/{region}   (legacy URL form)
 */

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/rate_limit.php';

check_rate_limit('beaches');

$db = get_db();

$validRegions = ['north-goa', 'south-goa'];

// Support both /api/beaches/region/north-goa and /api/beaches?region=north-goa
$uri  = strtok($_SERVER['REQUEST_URI'], '?');
$path = trim(preg_replace('#^.*?/api/?#', '', $uri), '/');

$region = null;
if (preg_match('#beaches/region/([\w-]+)#', $path, $m)) {
    $region = strtolower($m[1]);
} elseif (isset($_GET['region'])) {
    $region = strtolower(trim($_GET['region']));
}

$featured = isset($_GET['featured']) && $_GET['featured'] === '1';

$where  = [];
$params = [];

if ($region && in_array($region, $validRegions, strict: true)) {
    $where[]            = 'region = :region';
    $params[':region']  = $region;
}

if ($featured) {
    $where[] = 'featured = 1';
}

$sql = 'SELECT * FROM beaches';
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY featured DESC, name ASC';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

// Decode JSON fields so the client receives proper arrays
foreach ($rows as &$row) {
    $row['tags']       = json_decode($row['tags'],       associative: true) ?? [];
    $row['activities'] = json_decode($row['activities'], associative: true) ?? [];
}
unset($row);

json_success(['beaches' => $rows, 'count' => count($rows)]);
