# Gate System

A demonstration system for testing CORS and header configuration across the page → worker → lambda architecture. Written early in serverless development to verify CORS blocks/allows requests as expected, headers flow correctly, and envelope authentication works.

TTD: May be removed in favor of curl testing, which provides more precise verification without deployed test infrastructure.

## Files

### Test Components

The `/gate` page renders four components demonstrating different request patterns:

- **GateGetLambda** - GET → Lambda direct, `cors: true` (open) ✓
- **GatePostLambda** - POST → Lambda direct, no cors (blocked by CORS) ✗
- **GateGetWorker** - GET → Worker, same-origin ✓
- **GatePostBoth** - POST → Worker → Lambda, worker has no Origin header ✓

### Page & Components (site/)

| File | Description |
|------|-------------|
| `pages/gate.vue` | Container page rendering four test components |
| `components/gate/GateGetLambda.vue` | GET directly to Lambda (uses `origin23()`) |
| `components/gate/GatePostLambda.vue` | POST directly to Lambda (blocked by CORS) |
| `components/gate/GateGetWorker.vue` | GET to Worker at `/api/gate/gate-get-worker` |
| `components/gate/GatePostBoth.vue` | POST to Worker, which POSTs to Lambda |

### Workers (site/server/api/gate/)

| File | Description |
|------|-------------|
| `gate-get-worker.js` | Returns request method and headers |
| `gate-post-worker.js` | Calls Lambda with sealed envelope, returns bridge result |

### Lambdas (net23/src/)

| File | serverless.yml | CORS |
|------|----------------|------|
| `gate-get-lambda.js` | `cors: true` | Open to all origins |
| `gate-post-lambda.js` | (none) | Workers only |
| `snippet2.js` | (none) | Diagnostic endpoint |

---

# CORS Configuration Guide

## Key Insight

**serverless.yml CORS configuration does not block requests at the infrastructure level.** It only controls:
1. Whether an OPTIONS handler exists (for preflight)
2. What `Access-Control-Allow-*` headers appear in responses

The request **always reaches the Lambda**. CORS is enforced by browsers, not by API Gateway.

From [AWS Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html):
> "Cross-origin resource sharing (CORS) is a **browser security feature** that restricts cross-origin HTTP requests that are initiated from scripts running in the browser."

From [Serverless Framework CORS Guide](https://www.serverless.com/blog/cors-api-gateway-survival-guide):
> The configuration enables CORS compliance through response headers, not request blocking.

## Configuring Lambda Endpoints

### `/higher` - Pages from whitelisted domains only

**Goal:** Accept requests only from pages at `https://cold3.cc` or `http://localhost:3000`.

**serverless.yml (configuration):**
```yaml
higher:
  handler: src/higher.handler
  events:
    - http:
        path: /higher
        method: post
        cors:
          origins:
            - https://cold3.cc
            - http://localhost:3000
          headers:
            - Content-Type
          allowCredentials: false
```

**What this achieves:**
| Request Source | Preflight | Reaches Lambda? | Browser Can Read? |
|----------------|-----------|-----------------|-------------------|
| Page at cold3.cc | ✓ passes | Yes | Yes |
| Page at evil-site.com (JSON) | ✗ fails | No | No |
| Page at evil-site.com (text/plain) | skipped | **Yes** | No |
| Server (no Origin) | N/A | **Yes** | N/A |

**Application code required (icarus' level2 door system checks):**
```javascript
function checkOriginWhitelisted(headers) {
  let origin = headerGet(headers, 'Origin')
  if (!origin) throw 'Origin header required'  // Block servers
  let allowed = ['https://cold3.cc', 'http://localhost:3000']
  if (!allowed.includes(origin)) throw 'Origin not whitelisted'
}
```

### `/lower` - Servers only

**Goal:** Accept requests only from servers (workers, curl). Block all page requests.

**serverless.yml:**
```yaml
lower:
  handler: src/lower.handler
  events:
    - http:
        path: /lower
        method: post
        # No cors config - this is correct
```

**What this achieves:**
| Request Source | Preflight | Reaches Lambda? |
|----------------|-----------|-----------------|
| Page (any domain, JSON) | ✗ fails (no OPTIONS) | No |
| Page (any domain, text/plain) | skipped | **Yes** |
| Server (no Origin) | N/A | **Yes** |

**Application code required (level2 door):**
```javascript
function checkOriginOmitted(headers) {
  if (headerCount(headers, 'Origin') > 0) throw 'Origin header must not be present'
}
```

## Defense in Depth Summary

| Layer | What It Does | What It Cannot Do |
|-------|--------------|-------------------|
| **serverless.yml CORS** (configuration) | Controls browser enforcement via response headers; blocks complex cross-origin requests at preflight | Block simple requests; block/allow based on Origin presence |
| **Application code** (code) | Inspect Origin header; reject unauthorized requests | N/A - can do everything |

**The level2 door checks are required. The serverless configuration protections provide defense-in-depth and better browser UX.**

### Our Inline Lambda Authorizer

The door system in `icarus/level2.js` (`doorLambda`, `doorWorker`, `checkOriginOmitted`, `checkOriginValid`) is effectively an inline Lambda authorizer. It runs at the very top of request handling before any business logic.

Compared to a separate [Lambda Authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html):
- **Same security** - Unauthorized requests rejected before business logic
- **Simpler** - One Lambda instead of two
- **Lower latency** - No additional cold start
- **Lower cost** - One invocation per request

## Serverless.yml CORS Reference

From [Serverless Framework documentation](https://www.serverless.com/blog/cors-api-gateway-survival-guide):

```yaml
cors: true                    # Allow all origins

cors:
  origins:                    # Whitelist specific origins
    - https://cold3.cc
    - http://localhost:3000
  headers:
    - Content-Type
  allowCredentials: false     # Cannot use '*' with true

# Omit cors entirely for server-only endpoints
```

---

# Testing CORS Configuration with curl

Use these curl commands to verify CORS configuration is working correctly. Both `/upload` and `/message` support a `Gate.` action that returns `{success: true, sticker: ...}` without requiring envelopes, enabling clean curl testing of the CORS and Origin header security layers.

## Testing `/upload`, a lambda we've configured to talk to pages at our site's domain, only (page only)

The `/upload` endpoint is designed for browser-to-Lambda communication. Pages at `cold3.cc` or `localhost:3000` should be able to call it directly; servers should be blocked. In `serverless.yml`, this endpoint has a `cors:` block with whitelisted `origins:`, which makes API Gateway handle preflight and return appropriate CORS headers. In our application code, `checkOriginValid` in level2.js requires a valid Origin header from the whitelist - this is the second line of defense that catches requests the configuration let through. Tests 1-5 verify both layers work correctly.

### Test 1

```bash
# Test 1: Preflight from whitelisted origin
curl -s -i -X OPTIONS "https://api.net23.cc/upload" \
  -H "Origin: https://cold3.cc" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

```
HTTP/2 200
access-control-allow-origin: https://cold3.cc
access-control-allow-headers: Content-Type
access-control-allow-methods: OPTIONS,POST
```

Tested and verified 2026jan30.

When JavaScript on a page makes a cross-origin request (different scheme, host, or port - in our case the page at `cold3.cc` calling fetch to `api.net23.cc`) that the browser considers "complex" (a POST with JSON, or custom headers, or methods like PUT/DELETE), the browser first sends an OPTIONS request called a "preflight" to ask the server if the desired request that will follow will be allowed. The browser does this automatically at the start of performing page script's fetch() or XMLHttpRequest call - the developer doesn't write this code. Simple requests (GET, or POST with text/plain) skip preflight entirely. Navigation (clicking links, typing URLs) doesn't trigger preflight because there the user is navigating the whole browser to a page (with its own origin in the location bar), not having script on a page at one origin make a request to another one.

Our `/upload` endpoint is configured to accept requests from pages only. In `serverless.yml`, the `cors:` block lists `origins:` including `https://cold3.cc`, which makes API Gateway automatically handle OPTIONS requests - the Lambda code isn't invoked for preflight. API Gateway checks if the request's Origin header matches a whitelisted origin, and if so, returns that origin in `Access-Control-Allow-Origin`. The browser sees the match and proceeds to send the actual POST. (The POST will then hit the Lambda, where `checkOriginValid` in level2.js verifies the Origin header again - defense in depth, configuration then code.)

### Test 2

```bash
# Test 2: Preflight from non-whitelisted origin
curl -s -i -X OPTIONS "https://api.net23.cc/upload" \
  -H "Origin: https://unknown.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

```
HTTP/2 200
access-control-allow-origin: https://cold3.cc
access-control-allow-headers: Content-Type
access-control-allow-methods: OPTIONS,POST
```

Tested and verified 2026jan30.

Now imagine malicious code at a script kiddie's website (like `unknown.com`) attempts the same request. The browser (unmodified - this is a script kiddie, not a fully grown hacker) sends the same OPTIONS preflight as in Test 1. The browser includes its actual origin in the `Origin` header (script cannot spoof this) and waits to see if the server's response grants permission. At this point, API Gateway has responded based purely on the `cors:` config in serverless.yml - none of our Lambda code (upload.js, level2.js, icarus) has run yet. The browser compares the `Access-Control-Allow-Origin` value in the response to its own origin - if they don't match, the browser blocks the actual request from ever being sent. This is CORS enforcement: the browser is the enforcer, not the server.

Our API Gateway returns `https://cold3.cc` (the first whitelisted origin from `serverless.yml`) regardless of what origin requested it. A browser at `unknown.com` sees that `https://cold3.cc` doesn't match its own origin, so it refuses to send the POST. The request never reaches our Lambda - the browser stopped it. This is the configuration layer of protection working as intended - our code never even runs.

### Test 3

```bash
# Test 3: POST from server (no Origin header)
curl -s -i -X POST "https://api.net23.cc/upload" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
```

```
HTTP/2 500
content-type: application/json
content-length: 0
access-control-allow-origin: https://cold3.cc
```

Tested and verified 2026jan30.

When a server (or curl, or any non-browser client) makes a request, there's no Origin header - browsers add that automatically for cross-origin requests, but other clients don't. There's also no preflight, because preflight is a browser behavior. The request goes straight to the endpoint. This is where serverless.yml's CORS configuration provides no protection at all - it only controls what headers appear in the response, it doesn't block incoming requests.

Our Lambda receives this request and runs. Icarus' `checkOriginValid` function in level2.js checks for a valid Origin header. Finding none, it throws an error and the request fails with 500. This is our code doing its job - the configuration let the request through, but our code caught it. Without `checkOriginValid`, this request would have succeeded, allowing any server on the internet to call our upload endpoint.

### Test 4

```bash
# Test 4: POST with non-whitelisted Origin
curl -s -i -X POST "https://api.net23.cc/upload" \
  -H "Origin: https://unknown.com" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
```

```
HTTP/2 500
content-type: application/json
content-length: 0
access-control-allow-origin: https://cold3.cc
```

Tested and verified 2026jan30.

This test covers a scenario that browsers would normally prevent: sending a POST with an Origin header that didn't pass preflight. A real browser at `unknown.com` would be stopped at Test 2 (preflight mismatch). But a "simple request" with `text/plain` content-type skips preflight, and curl or modified browsers can skip it entirely. So we need to verify the Lambda rejects these too.

Test 3 proved `checkOriginValid` requires an Origin header to be present. This test proves it also validates the value against the whitelist. The Origin header is present (`https://unknown.com`) but not in our whitelist, so `checkOriginValid` throws and the request fails with 500. This confirms our application code provides real validation, not just a presence check.

### Test 5

```bash
# Test 5: POST with whitelisted Origin
curl -s -i -X POST "https://api.net23.cc/upload" \
  -H "Origin: https://cold3.cc" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
```

```
HTTP/2 200
content-type: application/json
access-control-allow-origin: https://cold3.cc

{"success":true,"sticker":"CloudLambda.2026jan30.GI522KF.Fri03:30p35.075s.jcXsjePMpWwMaypa5SERO"}
```

Tested and verified 2026jan30.

This test simulates what happens after a successful preflight: the browser sends the actual POST with its Origin header included. Here we use curl with `-H "Origin: https://cold3.cc"` to mimic that browser behavior. In a real scenario, a browser would only reach this point if it already passed preflight (Test 1), but curl lets us test the Lambda directly.

Our Lambda receives the request and `checkOriginValid` in level2.js examines the Origin header. It's present and matches our whitelist there (`https://cold3.cc`), so the check passes. The request proceeds to business logic - in this case the `Gate.` action, which simply returns success with a sticker. This is the only path that should succeed for `/upload`: a request with a valid, whitelisted Origin header.

## Testing `/message`, a lambda we've configured to only talk to a worker (server only)

The `/message` endpoint is the opposite: it's designed for worker-to-Lambda communication only. Our workers (running on Cloudflare) call this endpoint to send emails and SMS messages. Pages should never call it directly - that would bypass our rate limiting and abuse prevention. In `serverless.yml`, this endpoint has **no** `cors:` block at all, which means API Gateway won't handle OPTIONS preflight (returning 403 instead). In our application code, `checkOriginOmitted` in level2.js requires that the Origin header is **absent** - any request with an Origin header (which browsers always add for cross-origin requests) gets rejected. Tests 6-9 verify both layers work correctly.

### Test 6

```bash
# Test 6: Preflight to server-only endpoint
curl -s -i -X OPTIONS "https://api.net23.cc/message" \
  -H "Origin: https://cold3.cc" \
  -H "Access-Control-Request-Method: POST"
```

```
HTTP/2 403
content-type: application/json
x-amzn-errortype: MissingAuthenticationTokenException

{"message":"Missing Authentication Token"}
```

Tested and verified 2026jan30.

When a browser wants to make a complex cross-origin request (like POST with JSON), it sends an OPTIONS preflight first - same as Tests 1 and 2. But unlike `/upload`, the `/message` endpoint has intentionally and meaningfully omitted `cors:` configuration in serverless.yml. This means API Gateway has no OPTIONS handler registered for this path. When the OPTIONS request arrives, API Gateway doesn't know what to do with it and returns 403 "Missing Authentication Token" - a confusing message, but it means "no route configured for OPTIONS on this path."

The browser sees the 403 and stops. The actual POST request is never sent - the browser blocked it at preflight. This is our configuration protecting us before our code even runs: by omitting CORS configuration entirely, we ensure browsers can't even begin a cross-origin request. API Gateway rejected the request before it reached our Lambda.

### Test 7

```bash
# Test 7: POST from server (no Origin header)
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
```

```
HTTP/2 200
content-type: application/json

{"success":true,"sticker":"CloudLambda.2026jan30.GI522KF.Fri03:48p28.550s.ay7afxCmXMVI5lCEDuu3L"}
```

Tested and verified 2026jan30.

When a server (like our Cloudflare worker, or curl) makes a request, it doesn't include an Origin header - that's a browser behavior for cross-origin requests. Servers just send the request directly. There's no preflight either, since preflight is also browser-only. This is exactly how we want legitimate worker-to-Lambda communication to work.

Our Lambda receives the request and `checkOriginOmitted` in level2.js examines the headers. It confirms the Origin header is absent, which means this isn't coming from a browser page. The check passes, business logic runs, and we return success. This is the **only** path that should succeed for `/message`: a request with no Origin header, indicating server-to-server (in our case, worker server to lambda server) communication.

### Test 8

```bash
# Test 8: POST with Origin header (simulating a page)
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Origin: https://cold3.cc" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
```

```
HTTP/2 500
content-type: application/json
content-length: 0
```

Tested and verified 2026jan30.

In a real browser scenario, this request would never happen - Test 6 showed that preflight fails for `/message`, so the browser would stop there. But what if someone uses curl or a modified browser to skip preflight and send a POST directly with an Origin header? This test verifies our code catches that case. Note we're using our own domain (`cold3.cc`) as the Origin - even trusted origins are blocked from this endpoint.

Our Lambda receives the request and `checkOriginOmitted` in level2.js sees an Origin header is present. Regardless of its value, the presence of any Origin header indicates this request came from (or is pretending to come from) a browser page. The check throws and the request fails with 500. This is our code protecting us when configuration couldn't - there's no CORS config to reject this, but our code does.

### Test 9

```bash
# Test 9: Simple request with Origin (text/plain skips preflight)
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Origin: https://unknown.com" \
  -H "Content-Type: text/plain" \
  -d '{"action":"Gate."}'
```

```
HTTP/2 500
content-type: application/json
content-length: 0
```

Tested and verified 2026jan30.

This is the most important test for understanding why code-level checks are essential. A "simple request" - POST with `text/plain` content-type - skips preflight entirely. The browser sends it directly without asking permission first. This means Test 6's protection (no OPTIONS handler → 403) doesn't help here. The request sails right past our configuration layer and reaches the Lambda. A malicious page at `unknown.com` could do exactly this.

Our Lambda receives the request and `checkOriginOmitted` in level2.js sees the Origin header (`https://unknown.com`). The check throws and the request fails with 500. This test proves that configuration alone cannot fully protect a server-only endpoint - simple requests bypass preflight, so our code must be the final line of defense. Without `checkOriginOmitted`, this request would have succeeded, allowing any page on the internet to call our `/message` endpoint.

---

## Summary

| Test | Endpoint | Origin | Serverless Config | Level2 Door | Result |
|------|----------|--------|-------------------|-------------|--------|
| 1 | /upload | cold3.cc (OPTIONS) | Returns matching origin | N/A | Preflight passes |
| 2 | /upload | unknown.com (OPTIONS) | Returns non-matching origin | N/A | Browser blocks |
| 3 | /upload | (none) | Allows request | `checkOriginValid` rejects | 500 |
| 4 | /upload | unknown.com | Allows request | `checkOriginValid` rejects | 500 |
| 5 | /upload | cold3.cc | Allows request | `checkOriginValid` passes | 200 ✓ |
| 6 | /message | any (OPTIONS) | No handler, 403 | N/A | Preflight fails |
| 7 | /message | (none) | Allows request | `checkOriginOmitted` passes | 200 ✓ |
| 8 | /message | cold3.cc | Allows request | `checkOriginOmitted` rejects | 500 |
| 9 | /message | unknown.com (text/plain) | Allows request | `checkOriginOmitted` rejects | 500 |

**Key insight:** Tests 3, 4, 8, and 9 prove that the level2 door checks are essential. Serverless.yml configuration alone cannot block these requests - the Lambda receives them, and only our application code rejects them.

---

# Considering Lambda Function URLs

## What API Gateway Actually Provides

Based on the tests above, API Gateway's CORS configuration provides:

1. **Custom domain routing** - `api.net23.cc/upload` and `api.net23.cc/message` route to different Lambdas through one domain
2. **Automatic OPTIONS handling** - Handles preflight without invoking Lambda (saves invocations and cold starts)
3. **CORS response headers** - Automatically adds `Access-Control-Allow-*` headers
4. **HTTPS termination** - Handles TLS certificates for the custom domain

What it does **not** provide:

- **Security** - As tests 3, 4, 8, and 9 prove, configuration alone doesn't block simple requests or non-browser clients. Our code (`checkOriginValid`, `checkOriginOmitted`) does the real security work.

API Gateway adds monetary cost and response latency. If our code is doing the security work anyway, what are we paying for? Convenience: custom domains, automatic OPTIONS handling, and serverless framework integration.

## Security Equivalence: API Gateway vs Lambda Function URLs

Assuming correct level2 code, is API Gateway's CORS configuration any more secure than Lambda Function URLs?

**No.** For CORS configuration, they're equivalent. The "wall" is the same height.

Both API Gateway and Lambda Function URLs:
- Handle OPTIONS preflight automatically
- Return CORS headers that browsers honor
- Let simple requests (text/plain) through to your code
- Let non-browser requests through to your code

Neither actually blocks requests at the infrastructure level. The "blocking" happens in two places:
1. Browsers refusing to send requests after failed preflight (or refusing to read responses with mismatched headers)
2. Your code rejecting requests that get through

API Gateway's CORS config and Lambda Function URL's CORS config provide the same thing: headers that browsers interpret. The infrastructure itself isn't rejecting requests - it's just putting up signs that browsers respect and attackers ignore.

**However** - API Gateway has optional features Lambda Function URLs don't:
- WAF (Web Application Firewall) - actual request filtering
- Request validation schemas
- Throttling/rate limiting at the gateway level
- Resource policies

If you're not using those features, switching to Lambda Function URLs gives up nothing security-wise. Your code is the security boundary in both cases.

## Why Consider Lambda Function URLs

API Gateway has a **hard 30-second timeout**. For `/upload`, the final step instructs the Lambda to hash the uploaded file. For large files, this can exceed 30 seconds. Lambda Function URLs have no such limit (Lambda itself can run up to 15 minutes).

Lambda Function URLs provide:
- Direct HTTPS endpoints for Lambda functions
- Built-in CORS configuration (similar to API Gateway's `cors:` block)
- Lower latency (one less hop)
- Lower cost (no API Gateway charges)
- No 30-second timeout

The tradeoff: each Lambda gets an AWS-branded URL like `https://abc123.lambda-url.us-east-1.on.aws/` instead of a custom domain. (CloudFront can provide custom domains, but adds complexity back.)

## Switching `/upload` to Lambda Function URL

**What's required:**

1. **Create Function URL for upload Lambda** with CORS configuration:
   ```
   allowOrigins: ["https://cold3.cc", "http://localhost:3000"]
   allowMethods: ["POST"]
   allowHeaders: ["Content-Type"]
   ```

2. **Update page code** - Change fetch URL from `api.net23.cc/upload` to the new AWS URL

3. **Verify event format compatibility** - Lambda Function URLs use a slightly different event format than API Gateway. Headers may be accessed differently. Check if level2.js header parsing needs adjustment.

4. **Keep `checkOriginValid`** - Still essential for the same reasons (simple requests bypass preflight, non-browser clients can send anything)

**What stays the same:**

- All level2 door security checks
- The CORS configuration concepts (just different syntax)
- Automatic OPTIONS handling (Function URLs support this via config)

## Narrow vs Broad Refactor

### Narrow: Just `/upload` to Function URL

**Changes:**
- Create Function URL for upload with CORS config
- Update page code to call AWS URL for upload
- Verify/adjust level2.js for Function URL event format
- Keep API Gateway for everything else

**Resulting system:**
- `/upload` → Lambda Function URL (AWS domain)
- `/message` and others → API Gateway (`api.net23.cc`)
- Two different invocation patterns to maintain
- level2.js must handle two different event formats for headers
- Two CORS configuration approaches
- Mixed mental model: "upload is special, everything else is normal"

### Broad: Everything to Function URLs

**Changes:**
- Create Function URLs for all lambdas
- Configure CORS per-lambda (upload: allow origins, message: no CORS)
- Update page code (new upload URL)
- Update worker code (new message URL)
- Update level2.js for Function URL event format (once)
- Remove API Gateway configuration entirely
- Decide on domains: accept AWS URLs everywhere, or add CloudFront for custom domain

**Resulting system:**
- One invocation pattern everywhere
- level2.js handles one event format
- Consistent CORS approach
- Simpler serverless.yml (no http events)
- No API Gateway costs

### Comparison

| Factor | Narrow | Broad |
|--------|--------|-------|
| Upfront changes | Fewer | More |
| Ongoing complexity | Higher (two patterns) | Lower (one pattern) |
| level2.js | Must handle two event formats | One event format |
| Future lambdas | Choose pattern each time | Consistent pattern |
| If another lambda hits 30s limit | Do this again | Already solved |
| API Gateway costs | Reduced | Eliminated |
| Custom domain | Partial (`api.net23.cc` for some) | Needs CloudFront, or accept AWS URLs |

### Recommendation

The narrow refactor is **fewer immediate changes** but **more ongoing complexity**. Every time you touch level2.js header parsing, you're thinking about two formats.

The broad refactor is **more upfront work** but **cleaner end state**. The main questions are:

1. **Do you need custom domains?** If yes, CloudFront adds complexity back. If AWS URLs are acceptable, broad is simpler.

2. **Are workers easy to update?** Probably yes - just URL constants.

3. **Could other lambdas hit the 30-second limit?** If yes, broad future-proofs you.

If you're OK with AWS domains everywhere, broad is probably less total work over time.

## Mechanical Steps: Switching to Lambda Function URLs

### Step 1: Update serverless.yml

For each function, replace the `events: - http:` block with a `url:` block.

**Before (API Gateway):**
```yaml
functions:
  upload:
    handler: src/upload.handler
    events:
      - http:
          path: /upload
          method: post
          cors:
            origins:
              - https://cold3.cc
              - http://localhost:3000
            headers:
              - Content-Type
            allowCredentials: false
```

**After (Lambda Function URL):**
```yaml
functions:
  upload:
    handler: src/upload.handler
    url:
      authorizer: none
      cors:
        allowedOrigins:
          - https://cold3.cc
          - http://localhost:3000
        allowedMethods:
          - POST
        allowedHeaders:
          - Content-Type
```

For server-only endpoints like `/message`, omit the `cors:` block entirely:
```yaml
functions:
  message:
    handler: src/message.handler
    url:
      authorizer: none
      # no cors = server-only
```

### Step 2: Remove API Gateway custom domain config

Remove or comment out the `serverless-domain-manager` plugin and its `customDomain` configuration, since we're no longer using API Gateway.

### Step 3: Deploy and capture URLs

Run deploy:
```bash
yarn deploy
```

The output will show the new Lambda Function URLs:
```
endpoints:
  upload: https://abc123xyz.lambda-url.us-east-1.on.aws/
  message: https://def456uvw.lambda-url.us-east-1.on.aws/
  up2: https://ghi789rst.lambda-url.us-east-1.on.aws/
  up3: https://jkl012mno.lambda-url.us-east-1.on.aws/
```

These URLs are **stable** - they won't change on future deploys. This is a one-time capture.

### Step 4: Store URLs in .env.keys

Add the URLs to your secrets/config system:
```
LAMBDA_URL_UPLOAD=https://abc123xyz.lambda-url.us-east-1.on.aws/
LAMBDA_URL_MESSAGE=https://def456uvw.lambda-url.us-east-1.on.aws/
LAMBDA_URL_UP2=https://ghi789rst.lambda-url.us-east-1.on.aws/
LAMBDA_URL_UP3=https://jkl012mno.lambda-url.us-east-1.on.aws/
```

### Step 5: Update callers

**Page code** - Update fetch calls to use the new URLs:
```javascript
// Before
fetch(origin23() + '/upload', ...)

// After
fetch(Key('lambda url, upload'), ...)
```

**Worker code** - Update worker-to-lambda calls similarly:
```javascript
// Before
fetch('https://api.net23.cc/message', ...)

// After
fetch(Key('lambda url, message'), ...)
```

### Step 6: Verify level2.js event format compatibility

Lambda Function URLs use a slightly different event format than API Gateway. Test that header parsing in level2.js works correctly. The headers may be in a different location or format in the event object.

### Step 7: Test

Run the curl tests from this document against the new URLs to verify CORS and security work as expected.

### Summary

| Step | One-time or ongoing? |
|------|---------------------|
| Update serverless.yml | One-time |
| Deploy and capture URLs | One-time (URLs stable after) |
| Store URLs in .env.keys | One-time |
| Update page/worker code | One-time |
| Verify level2.js compatibility | One-time |
| Future code deploys | No URL changes needed |

## Built-in CORS vs Code It Ourselves

### Feature Maturity

**Lambda Function URLs:** Generally Available since April 2022 - stable AWS feature, not beta.

**Serverless Framework `url:` support:** Added after AWS launched the feature. The basic functionality is stable, but the `cors:` configuration specifically may have quirks or edge cases. Serverless Framework versions can behave differently.

**The built-in CORS handling:** When you configure `cors:` in the `url:` block, AWS handles OPTIONS requests automatically before your Lambda runs. It's convenient but it's another layer you don't control.

### The Alternative: Handle CORS in level2.js

Instead of relying on Lambda Function URL's built-in CORS, we could use a minimal Function URL config:

```yaml
functions:
  upload:
    handler: src/upload.handler
    url:
      authorizer: none
      # no cors config - we handle it ourselves
```

And handle CORS entirely in level2.js:

```javascript
// At the top of doorLambda, before other processing:
if (method === 'OPTIONS') {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(event.headers),
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  }
}

// And add CORS headers to all responses:
return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': getAllowedOrigin(event.headers),
    ...
  },
  body: JSON.stringify(result)
}
```

### Why Code It Ourselves Is Probably Better

1. **Already in level2.js for security** - Adding CORS handling is a natural extension of what we're already doing there. The door system already inspects headers and makes decisions.

2. **Everything in one place** - No split between "serverless.yml configures preflight" and "level2.js checks Origin". All request handling logic lives in level2.js.

3. **No framework/AWS quirks** - Not depending on serverless framework's `url.cors` syntax being correct or Lambda Function URL CORS behavior matching expectations.

4. **Easier to debug** - If something breaks, it's our code. No question of "is this a serverless framework bug? an AWS behavior change? a config syntax issue?"

5. **Not much code** - Handling OPTIONS and adding response headers is maybe 20 lines.

6. **Full control** - Can implement exactly the behavior we want, like different CORS policies for different actions within the same Lambda.

### Recommendation

Use Lambda Function URLs with minimal config (`url: { authorizer: none }` only, no `cors:` block), and handle all CORS logic in level2.js. This:

- Removes dependency on serverless framework CORS configuration
- Removes dependency on Lambda Function URL CORS feature behavior
- Keeps all request handling logic in one place
- Makes the system more predictable and debuggable
- Aligns with our existing pattern of doing security checks in code, not configuration

## Improving the Door System: Unified Page and Worker Support

### Current State

**doorLambda** in level2.js (lines 774-801) provides a clean pattern for worker-to-lambda communication:

```javascript
// message.js - just 3 lines!
export const handler = async (lambdaEvent, lambdaContext) => {
    return await doorLambda('POST', {actions: ['Gate.', 'Send.'], lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body, action}) {
    // business logic here
}
```

Inside `doorLambdaOpen`, it calls `checkOriginOmitted` - requiring that no Origin header is present, which enforces worker-only access.

**upload.js** can't use doorLambda because it needs page-to-lambda communication (pages must send an Origin header). Instead, it duplicates ~70 lines of code (lines 42-112) that parallel doorLambda's structure:

- `uploadLambda` mirrors `doorLambda`
- `uploadLambdaOpen` mirrors `doorLambdaOpen` but calls `checkOriginValid` instead of `checkOriginOmitted`
- `uploadLambdaShut` mirrors `doorLambdaShut` but adds CORS response headers

The comment in upload.js says: *"Not very DRY, and if we ever have a second page<->lambda endpoint we may reconsider"*

### Proposed Improvement

Extend doorLambda to handle both page-to-lambda and worker-to-lambda patterns with a new required parameter: `caller`.

**New doorLambda signature:**
```javascript
export const handler = async (lambdaEvent, lambdaContext) => {
    return await doorLambda('POST', {
        caller: 'Page.',      // NEW: 'Page.' or 'Worker.'
        actions: ['Gate.', 'UploadCreate.', ...],
        lambdaEvent,
        lambdaContext,
        doorHandleBelow
    })
}
```

**What `caller` controls:**

| caller | Origin check | CORS preflight | CORS response headers |
|--------|--------------|----------------|----------------------|
| `'Page.'` | `checkOriginValid` - required, must match whitelist | Handle OPTIONS, return CORS headers | Add to all responses |
| `'Worker.'` | `checkOriginOmitted` - must be absent | Reject OPTIONS (or 500) | None needed |

### What doorLambda Would Do

1. **Require `caller` parameter** - Must be `'Page.'` or `'Worker.'`. No default. Forces explicit declaration of intent.

2. **Handle CORS preflight for Page callers:**
   ```javascript
   if (caller === 'Page.' && lambdaEvent.httpMethod === 'OPTIONS') {
       return {
           statusCode: 200,
           headers: {
               'Access-Control-Allow-Origin': originApex(),
               'Access-Control-Allow-Methods': 'POST',
               'Access-Control-Allow-Headers': 'Content-Type',
           },
           body: null
       }
   }
   ```

3. **Choose Origin check based on caller:**
   ```javascript
   if (caller === 'Page.') {
       checkOriginValid(lambdaEvent.headers)
   } else if (caller === 'Worker.') {
       checkOriginOmitted(lambdaEvent.headers)
   }
   ```

4. **Add CORS headers to responses for Page callers:**
   ```javascript
   if (caller === 'Page.') {
       headers['Access-Control-Allow-Origin'] = originApex()
   }
   ```

### Benefits

1. **Eliminates duplication** - upload.js shrinks from ~70 lines of custom door code to the same 3-line pattern as message.js

2. **Single door system** - All lambda request handling flows through one well-tested path

3. **Clear declaration of intent** - Each lambda explicitly declares `caller: 'Page.'` or `caller: 'Worker.'`

4. **CORS handling centralized** - All CORS logic in level2.js, not spread across lambda files or configuration

5. **Works with Lambda Function URLs** - No reliance on AWS/serverless CORS configuration

6. **Strict enforcement** - The door rejects requests before business logic runs if caller type doesn't match request characteristics

### Migration Path

1. **Add `caller` parameter to doorLambda** - Required, must be `'Page.'` or `'Worker.'`

2. **Update existing lambdas** - Add `caller: 'Worker.'` to message.js, up2.js, up3.js, etc.

3. **Migrate upload.js** - Replace custom uploadLambda with doorLambda using `caller: 'Page.'`

4. **Remove duplication** - Delete uploadLambda, uploadLambdaOpen, uploadLambdaShut from upload.js

### Example: upload.js After Migration

```javascript
export const handler = async (lambdaEvent, lambdaContext) => {
    return await doorLambda('POST', {
        caller: 'Page.',
        actions: ['Gate.', 'UploadCreate.', 'UploadSign.', 'UploadComplete.', 'UploadAbort.', 'UploadList.', 'UploadHash.'],
        lambdaEvent,
        lambdaContext,
        doorHandleBelow
    })
}
async function doorHandleBelow({door, body, action}) {
    if (action == 'Gate.') {
        return {success: true, sticker: Sticker()}
    } else if (action == 'UploadCreate.') {
        // ...
    }
    // etc.
}
```

Same clean 3-line pattern as message.js, but with `caller: 'Page.'` declaring it accepts page requests.

---

# Important Reminders

## Before Switching to Lambda Function URLs

**Event format compatibility** - Lambda Function URLs use a different event structure than API Gateway. Before switching, verify how headers are accessed in level2.js. The header parsing functions (`headerGet`, `headerCount`, etc.) might need adjustment. Test this early - don't discover it in production.

## Gate. Action Security

The `Gate.` action intentionally bypasses envelope authentication to enable curl testing. This is a test-only backdoor. It must never do anything beyond returning `{success: true, sticker}`. If you add new actions, don't copy the Gate pattern for anything that has side effects.

## The 30-Second Timeout

The driver for considering Lambda Function URLs is the 30-second API Gateway timeout hitting file hashing on large uploads. Before doing the migration work, confirm that file hashing is actually what's timing out. If it's something else (network, S3 operations, etc.), Function URLs might not be the fix.

## Run the Curl Tests After Changes

The 9 tests in this document are your regression suite for CORS and security. Run them after:
- Any changes to level2.js door code
- Any changes to serverless.yml CORS configuration
- Switching to Lambda Function URLs
- Adding new lambdas

## The wrapper.js Cloud Flag

Deployed security depends on `wrapper.cloud` being `true` in production. The `build.js` script sets this in the dist copy (line 56). If you modify the build process, verify this still happens. If `cloud: false` gets deployed, all Origin header checks are bypassed (`isLocal()` returns true).

To verify after deploy:
```bash
# Should return 500 (checkOriginValid rejects missing Origin)
curl -s -i -X POST "https://api.net23.cc/upload" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
```

If this returns 200, something is wrong with the cloud flag.
