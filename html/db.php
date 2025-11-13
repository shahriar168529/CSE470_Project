<?php
// db.php - PDO connection
// Put this file in same folder as other scripts

$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_NAME = getenv('DB_NAME') ?: 'rewater_db';
$DB_USER = getenv('DB_USER') ?: 'rewater_user';
$DB_PASS = getenv('DB_PASS') ?: 'rewater_pass_here';
$DB_CHAR = 'utf8mb4';

$dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset={$DB_CHAR}";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];
try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
    // In production, log error and display friendly message
    http_response_code(500);
    echo "Database connection failed.";
    exit;
}
