<?php

// Modify server variables to prevent Laravel from stripping '/api' prefix
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

// Forward Vercel requests to Laravel's public/index.php
require __DIR__ . '/../public/index.php';
