<?php

function lb_get_pdo() {
    $host = getenv('LB_DB_HOST');
    $name = getenv('LB_DB_NAME');
    $user = getenv('LB_DB_USER');
    $pass = getenv('LB_DB_PASS');
    $charset = 'utf8mb4';

    $host = $host ? $host : '127.0.0.1';
    $name = $name ? $name : '';
    $user = $user ? $user : '';
    $pass = $pass ? $pass : '';

    if ($name === '' || $user === '') {
        throw new RuntimeException('Database configuration missing.');
    }

    $dsn = "mysql:host={$host};dbname={$name};charset={$charset}";
    return new PDO($dsn, $user, $pass, array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ));
}
