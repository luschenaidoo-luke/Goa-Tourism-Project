#!/usr/bin/env php
<?php
/**
 * setup.php  —  Run ONCE from the command line (or browser) to:
 *   1. Create and seed the SQLite database
 *   2. Print a new ADMIN_PASSWORD_HASH for config.php
 *
 * Usage:
 *   php setup.php
 *   php setup.php --password=mysecretpassword
 */

// Parse CLI args
$password = 'password'; // default
foreach ($argv ?? [] as $arg) {
    if (str_starts_with($arg, '--password=')) {
        $password = substr($arg, strlen('--password='));
    }
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/db.php';

echo "=============================================================\n";
echo "  Goa Tourism — Setup\n";
echo "=============================================================\n\n";

// 1. Create database directory if needed
$dbDir = dirname(DB_PATH);
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0755, true);
    echo "✓ Created database directory: $dbDir\n";
}

// 2. Initialise schema + seed data
echo "→ Initialising database...\n";
init_database();
echo "✓ Database ready: " . DB_PATH . "\n\n";

// 3. Verify tables
$db = get_db();
$tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
echo "  Tables created: " . implode(', ', $tables) . "\n";

$aCount = $db->query("SELECT COUNT(*) FROM attractions")->fetchColumn();
$bCount = $db->query("SELECT COUNT(*) FROM beaches")->fetchColumn();
echo "  Seeded: $aCount attractions, $bCount beaches\n\n";

// 4. Generate password hash
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "=============================================================\n";
echo "  Admin credentials\n";
echo "=============================================================\n";
echo "  Username  : " . ADMIN_USERNAME . "\n";
echo "  Password  : $password\n";
echo "  Hash      : $hash\n\n";
echo "  → Copy the hash above into config.php:\n";
echo "    define('ADMIN_PASSWORD_HASH', '$hash');\n\n";

// 5. Test APP_SECRET
if (APP_SECRET === 'change-this-to-a-random-secret-key') {
    echo "⚠  WARNING: APP_SECRET is still the default.\n";
    echo "   Generate one: php -r \"echo bin2hex(random_bytes(16));\" \n\n";
} else {
    echo "✓ APP_SECRET is set.\n\n";
}

echo "✓ Setup complete! Visit /admin/index.php to log in.\n";
echo "=============================================================\n";
