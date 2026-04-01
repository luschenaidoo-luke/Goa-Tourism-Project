<?php
/**
 * includes/db.php
 * Singleton SQLite connection + schema bootstrap.
 */

require_once __DIR__ . '/../config.php';

function get_db(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            // Enable WAL mode for better concurrent read performance
            $pdo->exec('PRAGMA journal_mode=WAL');
            $pdo->exec('PRAGMA foreign_keys=ON');
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed']));
        }
    }

    return $pdo;
}

/**
 * Create all tables and seed data on first run.
 * Called once from setup.php.
 */
function init_database(): void {
    $db = get_db();

    // ── Schema ────────────────────────────────────────────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS attractions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            location    TEXT    NOT NULL,
            description TEXT    NOT NULL,
            category    TEXT    NOT NULL,   -- church | fort | temple | museum | nature
            rating      REAL    DEFAULT 0,
            image       TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS beaches (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            region      TEXT    NOT NULL,   -- north-goa | south-goa
            description TEXT    NOT NULL,
            tags        TEXT    NOT NULL,   -- JSON array  e.g. '[\"Peaceful\",\"Family-Friendly\"]'
            activities  TEXT    NOT NULL,   -- JSON array  e.g. '[\"Swimming\",\"Kayaking\"]'
            image       TEXT,
            featured    INTEGER DEFAULT 0,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS trip_requests (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            email            TEXT    NOT NULL,
            checkin_date     TEXT    NOT NULL,
            checkout_date    TEXT    NOT NULL,
            travelers        TEXT    NOT NULL,
            interests        TEXT    NOT NULL,  -- JSON array
            special_requests TEXT,
            ip_address       TEXT,
            status           TEXT    DEFAULT 'pending',  -- pending | reviewed
            created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rate_limits (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address    TEXT    NOT NULL,
            endpoint      TEXT    NOT NULL,
            request_count INTEGER DEFAULT 1,
            window_start  INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS admin_sessions (
            token      TEXT    PRIMARY KEY,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_address, endpoint);
        CREATE INDEX IF NOT EXISTS idx_trip_requests_created ON trip_requests(created_at DESC);
    ");

    // ── Seed: Attractions ─────────────────────────────────────────────────────
    $count = $db->query("SELECT COUNT(*) FROM attractions")->fetchColumn();
    if ($count == 0) {
        $attractions = [
            ['Basilica of Bom Jesus',  'Old Goa',  'UNESCO World Heritage Site housing St. Francis Xavier\'s mortal remains.',                              'church',  4.8, 'pictures/churches.png'],
            ['Aguada Fort',            'Candolim', '17th-century Portuguese fort with lighthouse and stunning sea views.',                                   'fort',    4.6, 'pictures/Fort.png'],
            ['Shri Mangeshi Temple',   'Ponda',    'Ancient Hindu temple dedicated to Lord Shiva with beautiful architecture.',                              'temple',  4.7, 'pictures/Temple.png'],
            ['Se Cathedral',           'Old Goa',  'One of Asia\'s largest churches with Portuguese-Gothic architecture.',                                   'church',  4.7, 'pictures/Church.png'],
            ['Chapora Fort',           'Chapora',  'Scenic hilltop fort offering panoramic views of Vagator beach.',                                         'fort',    4.5, 'pictures/forts.png'],
            ['Ancestral Goa',          'Loutolim', 'Open-air museum showcasing traditional Goan rural life and culture.',                                    'museum',  4.4, 'pictures/Ancestral.png'],
            ['Dudhsagar Waterfalls',   'Mollem',   'Spectacular four-tiered waterfall on the Goa–Karnataka border, one of India\'s tallest falls.',          'nature',  4.7, 'pictures/Waterfalls.png'],
            ['Church of Our Lady',     'Panaji',   'Beautiful baroque church overlooking the Mandovi River in the heart of the capital.',                    'church',  4.5, 'pictures/Church.png'],
            ['Reis Magos Fort',        'Reis Magos','One of Goa\'s earliest forts, recently restored and housing a contemporary art gallery.',              'fort',    4.3, 'pictures/Fort.png'],
        ];

        $stmt = $db->prepare("
            INSERT INTO attractions (name, location, description, category, rating, image)
            VALUES (:name, :location, :description, :category, :rating, :image)
        ");
        foreach ($attractions as [$name, $location, $description, $category, $rating, $image]) {
            $stmt->execute(compact('name', 'location', 'description', 'category', 'rating', 'image'));
        }
    }

    // ── Seed: Beaches ─────────────────────────────────────────────────────────
    $count = $db->query("SELECT COUNT(*) FROM beaches")->fetchColumn();
    if ($count == 0) {
        $beaches = [
            ['Baga Beach',     'north-goa', 'One of Goa\'s most popular beaches known for water sports, nightlife and beachside shacks.',     '["Water Sports","Nightlife"]',          '["Parasailing","Jet Skiing"]',    'pictures/Baga.png',    1],
            ['Palolem Beach',  'south-goa', 'Crescent-shaped paradise with calm waters, palm-fringed shores and a relaxed atmosphere.',        '["Peaceful","Family-Friendly"]',        '["Swimming","Kayaking"]',         'pictures/Palolem.png', 1],
            ['Anjuna Beach',   'north-goa', 'Famous for its dramatic red cliffs, flea markets and trance parties.',                           '["Markets","Scenic"]',                 '["Shopping","Photography"]',      'pictures/Anjuna.png',  1],
            ['Keri Beach',     'north-goa', 'Remote and unspoilt hidden gem at the northern tip of Goa, perfect for solitude seekers.',        '["Hidden Gem","Secluded"]',             '["Swimming","Bird Watching"]',    'pictures/Keri.jpg',    0],
            ['Sinquerim Beach','north-goa', 'Quiet and clean beach in the shadow of Aguada Fort, ideal for families and morning walks.',       '["Family-Friendly","Scenic"]',         '["Swimming","Sightseeing"]',      'pictures/Sinquerim.jpg',0],
        ];

        $stmt = $db->prepare("
            INSERT INTO beaches (name, region, description, tags, activities, image, featured)
            VALUES (:name, :region, :description, :tags, :activities, :image, :featured)
        ");
        foreach ($beaches as [$name, $region, $description, $tags, $activities, $image, $featured]) {
            $stmt->execute(compact('name', 'region', 'description', 'tags', 'activities', 'image', 'featured'));
        }
    }
}
