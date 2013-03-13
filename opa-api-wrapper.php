<?php
// Quick and dirty cross-domain workaround for api.phillyaddress.com server.
$request = $_SERVER['REQUEST_URI'];
$request = str_replace('/opa-api-wrapper.php', 'http://api.phillyaddress.com/', $request);
if (!function_exists('curl_init')){
    die('Sorry cURL is not installed!');
}
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $request);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$output = curl_exec($ch);
curl_close($ch);
echo $output;

