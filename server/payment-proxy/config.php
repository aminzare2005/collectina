<?php

declare(strict_types=1);

/**
 * Shared config for Zibal proxy on cPanel.
 *
 * Upload path:
 *   public_html/vlonefarsi/config.php
 */

return [
    // Zibal merchant ID (keep only on this server)
    'merchant' => 'PASTE_YOUR_ZIBAL_MERCHANT_ID',

    // Must match ZIBAL_PROXY_SECRET in Vercel / Liara
    'proxy_secret' => 'PASTE_A_LONG_RANDOM_SECRET',

    // Only callbacks on this host are accepted
    'allowed_callback_host' => 'vlonefarsi.ir',

    'zibal_request_url' => 'https://gateway.zibal.ir/v1/request',
    'zibal_verify_url' => 'https://gateway.zibal.ir/v1/verify',
];
