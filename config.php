<?php
/**
 * Goa Tourism — Application Configuration
 * Edit this file before deploying.
 */

// ── Database ─────────────────────────────────────────────────────────────────
define('DB_PATH', __DIR__ . '/database/goa_tourism.db');

// ── Admin credentials ─────────────────────────────────────────────────────────
// Change these before going live!
// To regenerate the hash: php -r "echo password_hash('yourpassword', PASSWORD_DEFAULT);"
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD_HASH', '$2y$10$QIsAOa1JrOm74aBoNuozseiAtyIDyNKqtbWhY8QuwG5YOueHLGkwO'); // "password"

// ── Security ──────────────────────────────────────────────────────────────────
// Generate a random 32-char string for production:  openssl rand -hex 16
define('APP_SECRET', 'bfb7d5605652463082ce507324e2cb86'); // used for CSRF tokens and other secrets
define('CSRF_TOKEN_LIFETIME', 3600);          // seconds (1 hour)
define('SESSION_LIFETIME',    1800);          // admin session timeout (30 min)

// ── Rate limiting ─────────────────────────────────────────────────────────────
define('RATE_LIMIT_REQUESTS', 10);   // max requests …
define('RATE_LIMIT_WINDOW',   60);   // … per this many seconds

// ── CORS — set to your frontend origin in production ─────────────────────────
define('ALLOWED_ORIGIN', '*');       // e.g. 'https://yoursite.github.io'

// ── Error display (set false in production) ───────────────────────────────────
define('DEBUG_MODE', true);
