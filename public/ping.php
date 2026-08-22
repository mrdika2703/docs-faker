<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
http_response_code(200);
echo '{"status":"ok","time":'.microtime(true).'}';
