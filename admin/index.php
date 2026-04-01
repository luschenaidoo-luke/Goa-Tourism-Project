<?php
/**
 * admin/index.php
 * Simple admin panel — login + dashboard to review trip requests.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/db.php';

session_set_cookie_params([
    'lifetime' => SESSION_LIFETIME,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

$error  = '';
$action = $_GET['action'] ?? '';

// ── Handle login POST ─────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === ADMIN_USERNAME && password_verify($password, ADMIN_PASSWORD_HASH)) {
        session_regenerate_id(true);
        $_SESSION['admin']      = true;
        $_SESSION['admin_user'] = $username;
        header('Location: index.php');
        exit;
    } else {
        // Constant-time delay to slow brute-force
        sleep(1);
        $error = 'Invalid username or password.';
    }
}

// ── Handle logout ─────────────────────────────────────────────────────────────
if ($action === 'logout') {
    session_destroy();
    header('Location: index.php');
    exit;
}

// ── Auth gate ─────────────────────────────────────────────────────────────────
$isLoggedIn = !empty($_SESSION['admin']);

// ── Load data (only when logged in) ──────────────────────────────────────────
$trips      = [];
$stats      = [];
$filterStatus = $_GET['status'] ?? 'all';

if ($isLoggedIn) {
    $db = get_db();

    // Mark request as reviewed
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'mark_reviewed') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id > 0) {
            $db->prepare("UPDATE trip_requests SET status = 'reviewed' WHERE id = ?")->execute([$id]);
        }
        header('Location: index.php');
        exit;
    }

    // Stats
    $stats = [
        'total'    => (int)$db->query("SELECT COUNT(*)    FROM trip_requests")->fetchColumn(),
        'pending'  => (int)$db->query("SELECT COUNT(*)    FROM trip_requests WHERE status = 'pending'")->fetchColumn(),
        'reviewed' => (int)$db->query("SELECT COUNT(*)    FROM trip_requests WHERE status = 'reviewed'")->fetchColumn(),
        'today'    => (int)$db->query("SELECT COUNT(*)    FROM trip_requests WHERE date(created_at) = date('now')")->fetchColumn(),
    ];

    // Fetch trip requests
    $sql = "SELECT * FROM trip_requests";
    if ($filterStatus !== 'all') {
        $sql  .= " WHERE status = :status";
        $stmt  = $db->prepare($sql . " ORDER BY created_at DESC");
        $stmt->execute([':status' => $filterStatus]);
    } else {
        $stmt = $db->query($sql . " ORDER BY created_at DESC");
    }
    $trips = $stmt->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin — Goa Tourism</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --orange: #e8560a;
            --dark:   #1a1a2e;
            --card:   #ffffff;
            --bg:     #f4f6fb;
            --border: #e0e4ed;
            --text:   #2d3748;
            --muted:  #718096;
            --green:  #38a169;
            --yellow: #d69e2e;
            --red:    #e53e3e;
        }

        body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

        /* ── Login screen ── */
        .login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
        .login-card { background: var(--card); border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,.1); }
        .login-logo { font-size: 2rem; text-align: center; margin-bottom: .5rem; }
        .login-card h1 { text-align: center; font-size: 1.4rem; margin-bottom: .25rem; }
        .login-card p  { text-align: center; color: var(--muted); font-size: .9rem; margin-bottom: 1.5rem; }

        .form-group { margin-bottom: 1rem; }
        label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .35rem; }
        input[type="text"], input[type="password"] {
            width: 100%; padding: .65rem .9rem; border: 1px solid var(--border);
            border-radius: 8px; font-size: .95rem; outline: none; transition: border-color .2s;
        }
        input:focus { border-color: var(--orange); }
        .btn { display: inline-block; padding: .65rem 1.4rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: .95rem; transition: opacity .2s; }
        .btn-primary { background: var(--orange); color: #fff; width: 100%; }
        .btn-primary:hover { opacity: .88; }
        .btn-sm { padding: .35rem .8rem; font-size: .8rem; }
        .btn-green  { background: var(--green);  color: #fff; }
        .btn-danger { background: var(--red);    color: #fff; }
        .error-msg { background: #fff5f5; border: 1px solid #fed7d7; color: var(--red); border-radius: 8px; padding: .7rem 1rem; margin-bottom: 1rem; font-size: .9rem; }

        /* ── Dashboard ── */
        .topbar { background: var(--dark); color: #fff; padding: .9rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
        .topbar-brand { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; }
        .topbar a { color: #fff; text-decoration: none; font-size: .85rem; opacity: .8; }
        .topbar a:hover { opacity: 1; }

        .container { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card  { background: var(--card); border-radius: 10px; padding: 1.2rem; text-align: center; border: 1px solid var(--border); }
        .stat-card .num { font-size: 2rem; font-weight: 700; color: var(--orange); }
        .stat-card .lbl { font-size: .8rem; color: var(--muted); margin-top: .2rem; }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: .5rem; }
        .section-header h2 { font-size: 1.2rem; }

        .filter-tabs { display: flex; gap: .4rem; }
        .filter-tab { padding: .3rem .8rem; border-radius: 20px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-size: .82rem; transition: all .15s; }
        .filter-tab.active, .filter-tab:hover { background: var(--orange); color: #fff; border-color: var(--orange); }

        table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 10px; overflow: hidden; border: 1px solid var(--border); font-size: .88rem; }
        th { background: #f7f9fc; font-weight: 600; padding: .75rem 1rem; text-align: left; color: var(--muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); }
        td { padding: .7rem 1rem; border-bottom: 1px solid var(--border); vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #fafbff; }

        .badge { display: inline-block; padding: .2rem .6rem; border-radius: 20px; font-size: .75rem; font-weight: 600; }
        .badge-pending  { background: #fef3c7; color: #92400e; }
        .badge-reviewed { background: #d1fae5; color: #065f46; }

        .interests-list { display: flex; flex-wrap: wrap; gap: .3rem; }
        .interest-chip  { background: #e8f0fe; color: #1a56db; border-radius: 4px; padding: .15rem .45rem; font-size: .75rem; }

        .empty-state { text-align: center; padding: 3rem; color: var(--muted); }
        .empty-state svg { opacity: .3; margin-bottom: 1rem; }

        @media (max-width: 768px) {
            table, thead, tbody, th, td, tr { display: block; }
            thead { display: none; }
            td { border: none; padding: .4rem 1rem; }
            td::before { content: attr(data-label) ': '; font-weight: 600; color: var(--muted); }
            tr { border-bottom: 1px solid var(--border); padding: .5rem 0; }
        }
    </style>
</head>
<body>

<?php if (!$isLoggedIn): ?>
<!-- ════════════════════ LOGIN ════════════════════ -->
<div class="login-wrap">
    <div class="login-card">
        <div class="login-logo">🏖️</div>
        <h1>Goa Tourism Admin</h1>
        <p>Sign in to manage trip submissions</p>

        <?php if ($error): ?>
            <div class="error-msg"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="POST" action="index.php?action=login">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required autocomplete="username" placeholder="admin">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="••••••••">
            </div>
            <button type="submit" class="btn btn-primary">Sign In</button>
        </form>

        <p style="margin-top:1.2rem;font-size:.8rem;color:var(--muted);text-align:center;">
            Default password: <code>password</code> — change in <code>config.php</code>
        </p>
    </div>
</div>

<?php else: ?>
<!-- ════════════════════ DASHBOARD ════════════════════ -->
<div class="topbar">
    <div class="topbar-brand">🏖️ Goa Tourism Admin</div>
    <div style="display:flex;gap:1.2rem;align-items:center;">
        <span style="font-size:.85rem;opacity:.7">Logged in as <strong><?= htmlspecialchars($_SESSION['admin_user']) ?></strong></span>
        <a href="index.php?action=logout">Sign out</a>
    </div>
</div>

<div class="container">
    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-card"><div class="num"><?= $stats['total'] ?></div><div class="lbl">Total Requests</div></div>
        <div class="stat-card"><div class="num"><?= $stats['pending'] ?></div><div class="lbl">Pending</div></div>
        <div class="stat-card"><div class="num"><?= $stats['reviewed'] ?></div><div class="lbl">Reviewed</div></div>
        <div class="stat-card"><div class="num"><?= $stats['today'] ?></div><div class="lbl">Today</div></div>
    </div>

    <!-- Trip Requests Table -->
    <div class="section-header">
        <h2>Trip Requests</h2>
        <div class="filter-tabs">
            <?php foreach (['all','pending','reviewed'] as $s): ?>
                <a href="?status=<?= $s ?>" style="text-decoration:none">
                    <button class="filter-tab <?= $filterStatus === $s ? 'active' : '' ?>"><?= ucfirst($s) ?></button>
                </a>
            <?php endforeach; ?>
        </div>
    </div>

    <?php if (empty($trips)): ?>
        <div class="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-.96l7-2.95a1 1 0 01.67 0l7 2.95A1 1 0 0120 6z"/></svg>
            <p>No trip requests found.</p>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Email</th>
                    <th>Dates</th>
                    <th>Travelers</th>
                    <th>Interests</th>
                    <th>Special Requests</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($trips as $t):
                $interests = json_decode($t['interests'], true) ?? [];
            ?>
                <tr>
                    <td data-label="ID"><?= $t['id'] ?></td>
                    <td data-label="Email"><?= htmlspecialchars($t['email']) ?></td>
                    <td data-label="Dates">
                        <?= htmlspecialchars($t['checkin_date']) ?> →<br>
                        <?= htmlspecialchars($t['checkout_date']) ?>
                    </td>
                    <td data-label="Travelers"><?= htmlspecialchars($t['travelers']) ?></td>
                    <td data-label="Interests">
                        <div class="interests-list">
                            <?php foreach ($interests as $i): ?>
                                <span class="interest-chip"><?= htmlspecialchars($i) ?></span>
                            <?php endforeach; ?>
                        </div>
                    </td>
                    <td data-label="Special Requests"><?= htmlspecialchars($t['special_requests'] ?: '—') ?></td>
                    <td data-label="Status">
                        <span class="badge badge-<?= $t['status'] ?>"><?= ucfirst($t['status']) ?></span>
                    </td>
                    <td data-label="Submitted"><?= htmlspecialchars(substr($t['created_at'], 0, 16)) ?></td>
                    <td data-label="Action">
                        <?php if ($t['status'] === 'pending'): ?>
                            <form method="POST" action="index.php?action=mark_reviewed" style="display:inline">
                                <input type="hidden" name="id" value="<?= $t['id'] ?>">
                                <button type="submit" class="btn btn-sm btn-green">✓ Mark Reviewed</button>
                            </form>
                        <?php else: ?>
                            <span style="color:var(--muted);font-size:.8rem">Done</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
<?php endif; ?>

</body>
</html>
