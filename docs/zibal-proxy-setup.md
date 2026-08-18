# راهنمای کامل پرداخت زیبال با سرور واسط (Proxy)

این سند توضیح می‌دهد چرا به proxy نیاز داریم، جریان پرداخت چطور کار می‌کند، چه فایل‌هایی باید روی cPanel بگذاری، و چه env variableهایی باید در اپ تنظیم کنی.

---

## مشکل چیست؟

اپ `collectina` روی Vercel/Liara هاست شده و IP ثابت ندارد.  
درگاه زیبال برای این مرچنت، **IP وایت‌لیست** می‌خواهد.

نتیجه: اگر اپ مستقیم به `gateway.zibal.ir` درخواست بزند، fail می‌شود.

---

## راه‌حل

یک **سرور واسط** روی `fetchme.ir` داریم که IP ثابت و وایت‌لیست‌شده است (`78.157.38.117`).

اپ دیگر مستقیم به زیبال وصل نمی‌شود.  
به جای آن:

1. اپ → `fetchme.ir` (proxy) — فقط برای API
2. proxy → زیبال (از IP ثابت)
3. کاربر برای ورود به درگاه → از **خود `collectina.ir`** redirect می‌شود
4. بعد از پرداخت، کاربر → `collectina.ir` (callback)
5. اپ برای verify → دوباره `fetchme.ir` → زیبال

### سه قانون جداگانه زیبال

| قانون                       | چک می‌شود کجا              | باید چی باشد                                      |
| --------------------------- | -------------------------- | ------------------------------------------------- |
| IP درخواست API              | backend                    | IP ثابت `fetchme.ir`                              |
| callbackUrl                 | backend                    | `https://collectina.ir/...`                       |
| Referer (دامنه ارجاع‌دهنده) | مرورگر هنگام ورود به درگاه | همان دامنه ثبت‌شده در پنل زیبال → `collectina.ir` |

`fetchme.ir` فقط برای API است.  
Referer باید `collectina.ir` باشد، نه `fetchme.ir`.

---

## معماری کلی

```text
[کاربر] → [collectina.ir] ──API──→ [fetchme.ir/proxy] → [gateway.zibal.ir API]
                |
                └── redirect به درگاه (Referer = collectina.ir)
                ↑
                └── callback بعد از پرداخت
```

---

## جریان کامل پرداخت (مرحله به مرحله)

### مرحله ۱ — ثبت سفارش در اپ

کاربر فرم checkout را پر می‌کند و «ثبت سفارش» را می‌زند.

- سفارش در Supabase با status=`pending` ساخته می‌شود
- فرانت‌اند درخواست می‌زند به:
  - `POST /api/payment/request`

### مرحله ۲ — ساخت درخواست پرداخت

Route اپ (`app/api/payment/request/route.ts`):

- مبلغ را به ریال تبدیل می‌کند (`amount * 10`)
- callback را می‌سازد:
  - `https://collectina.ir/api/payment/verify?orderId=...`
- درخواست را می‌فرستد به:
  - `https://fetchme.ir/collectina/zibal-request.php`

### مرحله ۳ — proxy روی cPanel

فایل `zibal-request.php`:

- secret را چک می‌کند (`X-Proxy-Secret`)
- merchant را از `config.php` می‌خواند
- callback را validate می‌کند (باید روی `collectina.ir` باشد)
- درخواست را از IP ثابت به زیبال می‌زند:
  - `POST https://gateway.zibal.ir/v1/request`
- `trackId` را برمی‌گرداند

### مرحله ۴ — هدایت کاربر به درگاه

اگر `result = 100`:

- اپ `trackId` را در order ذخیره می‌کند
- کاربر redirect می‌شود به:
  - `https://collectina.ir/api/payment/start?trackId={trackId}`
- این route یک redirect 302 می‌دهد به:
  - `https://gateway.zibal.ir/start/{trackId}`

Referer هنگام ورود به درگاه = `collectina.ir` ✅

**مهم:** `trackId` مدت محدودی (معمولاً ~۳۰ دقیقه) اعتبار دارد.  
اگر trackId قدیمی باشد، خطای «تراکنش منقضی شده» می‌گیری — این با «دامنه غیرمجاز» فرق دارد.

### مرحله ۵ — پرداخت توسط کاربر

کاربر در صفحه زیبال پرداخت را انجام می‌دهد (یا cancel می‌کند).

### مرحله ۶ — callback به اپ

زیبال کاربر را برمی‌گرداند به:

```text
https://collectina.ir/api/payment/verify?success=1&trackId=...&orderId=...
```

این redirect مرورگر است؛ نیازی به IP ثابت ندارد.

### مرحله ۷ — verify پرداخت

Route اپ (`app/api/payment/verify/route.ts`):

- اگر `success=1` و `trackId` موجود باشد
- درخواست verify می‌فرستد به:
  - `https://fetchme.ir/collectina/zibal-verify.php`
- proxy دوباره از IP ثابت به زیبال می‌زند:
  - `POST https://gateway.zibal.ir/v1/verify`

### مرحله ۸ — نهایی‌سازی سفارش

اگر verify موفق باشد (`result=100`):

- order → `paid`
- cart کاربر پاک می‌شود
- redirect به `/order-success`

در غیر این صورت:

- redirect به `/order-failed`

---

## فایل‌های PHP (آپلود روی cPanel)

این ۴ فایل را از ریپو بردار و در مسیر زیر بگذار:

| فایل در ریپو                               | مسیر روی cPanel                                                  |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `server/payment-proxy/config.php`          | `public_html/collectina/config.php`                              |
| `server/payment-proxy/helpers.php`         | `public_html/collectina/helpers.php`                             |
| `server/payment-proxy/zibal-request.php`   | `public_html/collectina/zibal-request.php`                       |
| `server/payment-proxy/zibal-verify.php`    | `public_html/collectina/zibal-verify.php`                        |
| `server/payment-proxy/zibal-test-flow.php` | `public_html/collectina/zibal-test-flow.php` (اختیاری — فقط تست) |

URL نهایی endpointها:

```text
https://fetchme.ir/collectina/zibal-request.php
https://fetchme.ir/collectina/zibal-verify.php
https://collectina.ir/api/payment/start?trackId=...
```

---

## کانفیگ cPanel (`config.php`)

فایل `config.php` را باز کن و این دو مقدار را پر کن:

```php
'merchant' => 'YOUR_ZIBAL_MERCHANT_ID',
'proxy_secret' => 'YOUR_LONG_RANDOM_SECRET',
```

نکات:

- `merchant` فقط روی cPanel بماند (دیگر لازم نیست در Vercel باشد)
- `proxy_secret` باید **دقیقاً** با env اپ یکی باشد
- `allowed_callback_host` را `collectina.ir` نگه دار

برای secret یک رشته تصادفی طولانی بساز، مثلاً:

```bash
openssl rand -hex 32
```

---

## کانفیگ اپ (Vercel / Liara)

این env variableها را در پروژه `collectina` تنظیم کن:

```env
NEXT_PUBLIC_APP_URL=https://collectina.ir
ZIBAL_PROXY_URL=https://fetchme.ir/collectina
ZIBAL_PROXY_SECRET=همان-secret-که-در-config.php-گذاشتی
```

### envهایی که دیگر لازم نیستند

اگر قبلاً داشتی، می‌توانی حذف کنی:

```env
ZIBAL_MERCHANT_ID
```

چون merchant فقط روی cPanel نگه داشته می‌شود.

---

## چک‌لیست راه‌اندازی

- [ ] ۴ فایل PHP اصلی روی `public_html/collectina/` آپلود شد
- [ ] (اختیاری) `zibal-test-flow.php` برای تست
- [ ] `config.php` با merchant و secret واقعی پر شد
- [ ] IP سرور `fetchme.ir` در پنل زیبال وایت‌لیست است
- [ ] envهای اپ (`ZIBAL_PROXY_URL`, `ZIBAL_PROXY_SECRET`, `NEXT_PUBLIC_APP_URL`) ست شد
- [ ] deploy جدید اپ انجام شد

---

## تست نهایی

### 0) تست سریع با trackId تازه (روی cPanel)

```text
https://fetchme.ir/collectina/zibal-test-flow.php?mode=app
```

این یک پرداخت تازه می‌سازد و از مسیر `collectina.ir/api/payment/start` به درگاه می‌فرستد.

فقط JSON بخواهی:

```text
https://fetchme.ir/collectina/zibal-test-flow.php?mode=json
```

### 1) تست request از طریق اپ

- یک سفارش test بزن
- باید به درگاه زیبال redirect شوی
- اگر error گرفتی، لاگ Vercel/Liara را چک کن

### 2) تست verify

- پرداخت test را کامل کن
- باید به `/order-success` برگردی
- status سفارش باید `paid` شود

---

## خطاهای رایج

### `result: 106` — callbackUrl نامعتبر

علت: callback روی دامنه دیگری ست شده.  
راه‌حل: callback باید `https://collectina.ir/...` باشد.

### «دامنه غیرمجاز» هنگام ورود به درگاه

علت‌های محتمل:

1. **دامنه ثبت‌شده در پنل زیبال** با `NEXT_PUBLIC_APP_URL` یکی نیست  
   (مثلاً پنل `collectina.ir` ولی اپ روی `www.collectina.ir` یا `xxx.vercel.app`)
2. کاربر از URL دیگری checkout می‌زند (preview deploy)
3. redirect مستقیم به `gateway.zibal.ir` بدون عبور از `collectina.ir/api/payment/start`

راه‌حل:

- در پنل زیبال، دامنه ثبت‌شده را با `NEXT_PUBLIC_APP_URL` sync کن
- مطمئن شو deploy production روی `https://collectina.ir` است
- redeploy اپ با route جدید `/api/payment/start`

### «تراکنش منقضی شده»

علت: `trackId` قدیمی است (معمولاً بیش از ~۳۰ دقیقه).  
راه‌حل: checkout جدید بزن یا `zibal-test-flow.php` را اجرا کن.

### `401 Unauthorized proxy request`

علت: `ZIBAL_PROXY_SECRET` در اپ با `config.php` یکی نیست.  
راه‌حل: secret را sync کن و redeploy بزن.

### `Proxy config is not configured on the server`

علت: `config.php` هنوز placeholder دارد.  
راه‌حل: merchant و secret واقعی را در cPanel ست کن.

### request موفق، verify fail

علت: verify هنوز مستقیم به زیibal می‌زند یا proxy verify آپلود نشده.  
راه‌حل: `zibal-verify.php` را آپلود کن و env اپ را چک کن.

---

## امنیت

- endpointهای PHP فقط با header `X-Proxy-Secret` قبول می‌کنند
- merchant ID فقط روی cPanel است
- callback فقط برای host `collectina.ir` پذیرفته می‌شود
- secret را public نکن (نه در git، نه در frontend)

---

## فایل‌های تغییر یافته در اپ

- `app/api/payment/start/route.ts` — redirect به درگاه از دامنه collectina.ir
- `lib/zibal-proxy.ts` — helper برای صدا زدن proxy
- `app/api/payment/verify/route.ts` — verify از طریق proxy

---

## خلاصه

| عملیات        | از کجا اجرا می‌شود | به کجا می‌رود                    |
| ------------- | ------------------ | -------------------------------- |
| request       | collectina.ir      | fetchme.ir → zibal               |
| ورود به درگاه | مرورگر             | collectina.ir → gateway.zibal.ir |
| پرداخت کاربر  | مرورگر             | gateway.zibal.ir                 |
| callback      | مرورگر             | collectina.ir                    |
| verify        | collectina.ir      | fetchme.ir → zibal               |

با این setup، محدودیت IP ثابت زیبال رعایت می‌شود و callback هم روی دامنه اصلی اپ (`collectina.ir`) می‌ماند.
