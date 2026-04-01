<?php
/**
 * api/handlers/attractions.php
 * GET /api/attractions[?category=fort&search=goa]
 */

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/rate_limit.php';

check_rate_limit('attractions');

$db = get_db();

// Optional query filters
$category = isset($_GET['category']) ? strtolower(trim($_GET['category'])) : null;
$search   = isset($_GET['search'])   ? trim($_GET['search'])                : null;

$validCategories = ['church', 'fort', 'temple', 'museum', 'nature'];

$where  = [];
$params = [];

if ($category && in_array($category, $validCategories, strict: true)) {
    $where[]  = 'category = :category';
    $params[':category'] = $category;
}

if ($search) {
    $where[]  = '(name LIKE :search OR description LIKE :search OR location LIKE :search)';
    $params[':search'] = '%' . $search . '%';
}

$sql = 'SELECT * FROM attractions';
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY rating DESC';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

json_success(['attractions' => $rows, 'count' => count($rows)]);
