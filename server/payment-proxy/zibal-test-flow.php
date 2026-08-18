<?php

declare(strict_types=1);

/**
 * One-click Zibal flow test on cPanel.
 *
 * Upload path:
 *   public_html/vlonefarsi/zibal-test-flow.php
 *
 * Usage:
 *   https://fetchme.ir/vlonefarsi/zibal-test-flow.php
 *
 * Creates a fresh payment request, then redirects the browser to the gateway.
 * Use this only for debugging. trackId values expire quickly.
 */

require __DIR__ . '/helpers.php';

$config = proxy_config();

if (
    ($config['merchant'] ?? '') === 'PASTE_YOUR_ZIBAL_MERCHANT_ID'
) {
    proxy_json_response([
        'ok' => false,
        'message' => 'Configure config.php before running this test.',
    ], 500);
}

$orderId = 'flow-test-' . date('Ymd-His');
$callbackUrl = 'https://' . $config['allowed_callback_host'] . '/api/payment/verify?orderId=' . urlencode($orderId);

$payload = [
    'merchant' => $config['merchant'],
    'amount' => 10000,
    'callbackUrl' => $callbackUrl,
    'description' => 'Zibal flow test - ' . $orderId,
    'orderId' => $orderId,
];

$zibal = proxy_call_zibal((string) $config['zibal_request_url'], $payload);
$data = $zibal['decoded_response'];

if (!is_array($data) || ($data['result'] ?? null) !== 100 || empty($data['trackId'])) {
    proxy_json_response([
        'ok' => false,
        'message' => 'Could not create a fresh Zibal payment.',
        'zibal' => $data,
    ], 400);
}

$trackId = (string) $data['trackId'];
$redirectMode = isset($_GET['mode']) ? (string) $_GET['mode'] : 'gateway';

if ($redirectMode === 'json') {
    proxy_json_response([
        'ok' => true,
        'trackId' => $trackId,
        'orderId' => $orderId,
        'callbackUrl' => $callbackUrl,
        'gateway_url' => 'https://gateway.zibal.ir/start/' . $trackId,
        'app_start_url' => 'https://' . $config['allowed_callback_host'] . '/api/payment/start?trackId=' . $trackId,
        'note' => 'trackId expires quickly. Use a fresh one for each test.',
    ]);
}

if ($redirectMode === 'app') {
    header('Location: https://' . $config['allowed_callback_host'] . '/api/payment/start?trackId=' . $trackId, true, 302);
    exit;
}

header('Location: https://gateway.zibal.ir/start/' . $trackId, true, 302);
exit;
