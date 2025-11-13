<?php
session_start();
require 'db.php';  // Make sure db.php is in the same folder

// ---------- REGISTRATION LOGIC ----------
$reg_error = "";
$reg_success = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($_POST['fullName'] ?? '');
    $emailPhone = trim($_POST['emailPhone'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirmPassword'] ?? '';

    if ($fullName === '' || $emailPhone === '' || $password === '') {
        $reg_error = "Please fill all fields.";
    } elseif ($password !== $confirm) {
        $reg_error = "Passwords do not match.";
    } elseif (strlen($password) < 6) {
        $reg_error = "Password must be at least 6 characters.";
    } else {
        try {
            // Check existing user
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :v OR phone = :v LIMIT 1");
            $stmt->execute([':v' => $emailPhone]);
            if ($stmt->fetch()) {
                $reg_error = "An account already exists with this email or phone.";
            } else {
                // Determine if it's email or phone
                $isEmail = filter_var($emailPhone, FILTER_VALIDATE_EMAIL);
                $email = $isEmail ? $emailPhone : null;
                $phone = $isEmail ? null : $emailPhone;

                // Hash password
                $hash = password_hash($password, PASSWORD_BCRYPT);

                // Insert new user
                $ins = $pdo->prepare("INSERT INTO users (full_name, email, phone, password_hash, role)
                                      VALUES (:fn, :em, :ph, :pw, 'customer')");
                $ins->execute([
                    ':fn' => $fullName,
                    ':em' => $email,
                    ':ph' => $phone,
                    ':pw' => $hash
                ]);

                // Auto login (optional)
                $_SESSION['user_id'] = $pdo->lastInsertId();
                $_SESSION['full_name'] = $fullName;
                $_SESSION['logged_in'] = true;

                // On success redirect
                header("Location: login.php?registered=1");
                exit;
            }
        } catch (Exception $e) {
            $reg_error = "Server error. Try again later.";
        }
    }
}
?>

<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>ReWater — Register</title>
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
        width: 380px;
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
    p.sub { text-align:center; margin-bottom:20px; opacity:0.8; }
    input {
        width: 100%;
        padding: 12px;
        margin-bottom: 14px;
        border-radius: 8px;
        border: none;
        background: rgba(255,255,255,0.1);
        color: #fff;
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
    <h2>Create Account</h2>
    <p class="sub">Join ReWater and start refilling sustainably</p>

    <?php if ($reg_error): ?>
        <div class="error"><?= htmlspecialchars($reg_error) ?></div>
    <?php endif; ?>

    <form method="POST" action="">
        <input type="text" name="fullName" placeholder="Full Name" required>
        <input type="text" name="emailPhone" placeholder="Email or Phone" required>
        <input type="password" name="password" placeholder="Password" required>
        <input type="password" name="confirmPassword" placeholder="Confirm Password" required>

        <button class="btn" type="submit">Create Account</button>
    </form>

    <p style="margin-top:15px;text-align:center;">
        Already have an account?
        <a href="login.php" style="color:#e3fff1;text-decoration:underline;">Login</a>
    </p>
</div>

</body>
</html>
