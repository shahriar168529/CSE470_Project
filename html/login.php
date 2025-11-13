<?php
session_start();
require 'db.php'; // include your PDO database connection

// ---------- LOGIN LOGIC ----------
$login_error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $login_error = "Please enter both username and password.";
    } else {
        try {
            // find user by email OR phone
            $stmt = $pdo->prepare("SELECT id, full_name, password_hash, is_active 
                                   FROM users 
                                   WHERE email = :u OR phone = :u LIMIT 1");
            $stmt->execute([':u' => $username]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password_hash'])) {
                $login_error = "Invalid username or password.";
            } elseif (!$user['is_active']) {
                $login_error = "Your account is disabled. Contact support.";
            } else {
                // success: set session
                session_regenerate_id(true);
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['logged_in'] = true;

                header("Location: dashboard.php");
                exit;
            }
        } catch (Exception $e) {
            $login_error = "Server error. Try again later.";
        }
    }
}
?>

<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>ReWater — Login</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
    body {
        margin: 0;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #16222a, #3a6073);
        font-family: Poppins, Arial;
        color: #fff;
    }
    .box {
        width: 360px;
        background: rgba(255,255,255,0.08);
        padding: 35px;
        border-radius: 14px;
        backdrop-filter: blur(6px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    }
    .logo {
        width: 64px;
        height: 64px;
        border-radius: 10px;
        background: rgba(255,255,255,0.1);
        margin: 0 auto 15px;
        display: grid;
        place-items: center;
        font-size: 28px;
    }
    h2 { text-align:center; margin-bottom:10px; }
    .sub { text-align:center; margin-bottom:20px; opacity:0.85; }
    input {
        width: 100%;
        padding: 12px;
        margin-bottom: 14px;
        border-radius: 8px;
        border: none;
        background: rgba(255,255,255,0.1);
        color: #fff;
        font-size: 15px;
    }
    .btn {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        border: none;
        background: linear-gradient(90deg,#46c2a5,#96c93d);
        color: #062018;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
    }
    .error {
        background: rgba(255,0,0,0.15);
        color: #ffb3b3;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 15px;
        text-align: center;
    }
</style>
</head>
<body>

<div class="box">
    <div class="logo">💧</div>
    <h2>Welcome Back</h2>
    <p class="sub">Log in to continue your eco journey</p>

    <?php if ($login_error): ?>
        <div class="error"><?= htmlspecialchars($login_error) ?></div>
    <?php endif; ?>

    <form method="POST" action="">
        <input type="text" name="username" placeholder="Email or Phone" required>
        <input type="password" name="password" placeholder="Password" required>

        <button class="btn" type="submit">Login</button>
    </form>

</div>

</body>
</html>
