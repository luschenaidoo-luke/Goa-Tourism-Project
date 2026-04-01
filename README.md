# Goa Tourism — PHP/SQLite Backend

Server-side upgrade for the Goa Tourism static website.
Built for the SST (Server Side Technologies) course at CZU Prague.

---

## What's included

| Feature | Details |
|---|---|
| **RESTful API** | PHP endpoints for attractions, beaches, and trip planning |
| **SQLite database** | Zero-configuration, file-based, pre-seeded with Goa data |
| **Trip form handler** | Saves submissions to DB with full server-side validation |
| **Admin dashboard** | Secure login + table view of all trip requests |
| **CSRF protection** | HMAC-based stateless tokens on all POST requests |
| **Rate limiting** | IP-based sliding window (10 req / 60 s by default) |
| **Security headers** | X-Frame-Options, X-Content-Type-Options, etc. via .htaccess |
| **Input sanitisation** | strip_tags, filter_var, prepared statements everywhere |

---

## Project structure

```
goa-tourism/                  ← your existing frontend
├── index.html
├── attractions.html
├── beaches.html
├── culture.html
├── plan.html
├── styles.css
├── main.js                   ← REPLACE with frontend-updates/main.js
├── pictures/
│
├── .htaccess                 ← ADD (from this package)
├── config.php                ← ADD
├── setup.php                 ← ADD (run once, then delete)
│
├── includes/
│   ├── db.php
│   ├── csrf.php
│   ├── rate_limit.php
│   ├── validator.php
│   └── response.php
│
├── api/
│   ├── index.php             ← front controller
│   └── handlers/
│       ├── attractions.php
│       ├── beaches.php
│       ├── trip.php
│       └── csrf_token.php
│
├── admin/
│   └── index.php
│
└── database/                 ← auto-created by setup.php
    └── goa_tourism.db
```

---

## Setup (local / XAMPP / WAMP)

### 1. Copy files
Merge **all files from this package** into your existing Goa Tourism project folder.
Replace `main.js` with the one from `frontend-updates/main.js`.

### 2. Configure
Open `config.php` and set:
```php
define('APP_SECRET', 'your-random-string-here');  // openssl rand -hex 16
```

### 3. Initialise the database
```bash
php setup.php
# or with a custom password:
php setup.php --password=mysecretpassword
```
Copy the printed `ADMIN_PASSWORD_HASH` into `config.php`, then
**delete `setup.php`** from the server.

### 4. Start Apache + PHP
- **XAMPP**: place the project in `htdocs/goa-tourism`, start Apache.
- **WAMP**: place in `www/goa-tourism`, start services.
- **PHP built-in server** (dev only):
  ```bash
  php -S localhost:8000
  ```

### 5. Open the site
```
http://localhost/goa-tourism/
http://localhost/goa-tourism/admin/
```

---

## API reference

### `GET /api/csrf-token`
Returns a CSRF token. Fetch before any POST.

```json
{ "success": true, "token": "..." }
```

---

### `GET /api/attractions`
Optional query params: `?category=fort` · `?search=goa`

```json
{
  "success": true,
  "count": 9,
  "attractions": [
    { "id": 1, "name": "Basilica of Bom Jesus", "location": "Old Goa",
      "description": "...", "category": "church", "rating": 4.8 }
  ]
}
```

---

### `GET /api/beaches`
Optional query params: `?region=north-goa` · `?featured=1`
Also supports `/api/beaches/region/south-goa`

```json
{
  "success": true,
  "count": 5,
  "beaches": [
    { "id": 1, "name": "Baga Beach", "region": "north-goa",
      "tags": ["Water Sports","Nightlife"],
      "activities": ["Parasailing","Jet Skiing"] }
  ]
}
```

---

### `POST /api/trip/create-itinerary`
**Headers:** `Content-Type: application/json`, `X-CSRF-Token: <token>`

**Body:**
```json
{
  "email":           "user@example.com",
  "checkinDate":     "2025-12-01",
  "checkoutDate":    "2025-12-07",
  "travelers":       "3",
  "interests":       ["beaches", "food"],
  "specialRequests": "Vegetarian meals"
}
```

**Success (201):**
```json
{
  "success": true,
  "requestId": 42,
  "message": "Your custom itinerary has been saved!",
  "itinerary": {
    "nights": 6,
    "days": [
      { "day": 1, "title": "Day 1", "activities": ["Visit Palolem Beach", "..."] }
    ]
  }
}
```

**Validation error (422):**
```json
{ "success": false, "error": "Validation failed.", "errors": ["Check-out date must be after check-in date."] }
```

---

## Admin panel

Navigate to `/admin/` and log in with the credentials set in `config.php`.

- View all trip submissions with filters (All / Pending / Reviewed)
- Mark submissions as reviewed
- Dashboard stats: total, pending, reviewed, today

---

## Security checklist

- [x] Prepared statements (SQL injection prevention)
- [x] CSRF tokens on all POST requests
- [x] Rate limiting per IP
- [x] Input sanitisation (`strip_tags`, `filter_var`, length limits)
- [x] Session hardening (`httponly`, `samesite=Strict`, `regenerate_id`)
- [x] `OPTIONS -Indexes` (no directory listing)
- [x] Sensitive files blocked in `.htaccess`
- [x] Security response headers
- [ ] HTTPS — enable on your host (required in production)
- [ ] Change `APP_SECRET` and admin password before deployment

---

## Changing the admin password

```bash
php -r "echo password_hash('yournewpassword', PASSWORD_DEFAULT);"
```
Paste the output into `config.php` as `ADMIN_PASSWORD_HASH`.
