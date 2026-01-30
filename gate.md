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

**serverless.yml (suspenders):**
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

## Belt and Suspenders Summary

| Layer | What It Does | What It Cannot Do |
|-------|--------------|-------------------|
| **serverless.yml CORS** (suspenders) | Controls browser enforcement via response headers; blocks complex cross-origin requests at preflight | Block simple requests; block/allow based on Origin presence |
| **Application code** (belt) | Inspect Origin header; reject unauthorized requests | N/A - can do everything |

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

The `/upload` endpoint is designed for browser-to-Lambda communication. Pages at `cold3.cc` or `localhost:3000` should be able to call it directly; servers should be blocked. In `serverless.yml`, this endpoint has a `cors:` block with whitelisted `origins:`, which makes API Gateway handle preflight and return appropriate CORS headers. In our application code, `checkOriginValid` in level2.js requires a valid Origin header from the whitelist - this is the "belt" that catches requests the "suspenders" let through. Tests 1-4 verify both layers work correctly.

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

Our `/upload` endpoint is configured to accept requests from pages only. In `serverless.yml`, the `cors:` block lists `origins:` including `https://cold3.cc`, which makes API Gateway automatically handle OPTIONS requests - the Lambda code isn't invoked for preflight. API Gateway checks if the request's Origin header matches a whitelisted origin, and if so, returns that origin in `Access-Control-Allow-Origin`. The browser sees the match and proceeds to send the actual POST. (The POST will then hit the Lambda, where `checkOriginValid` in level2.js verifies the Origin header again - belt and suspenders.)

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

Our API Gateway returns `https://cold3.cc` (the first whitelisted origin from `serverless.yml`) regardless of what origin requested it. A browser at `unknown.com` sees that `https://cold3.cc` doesn't match its own origin, so it refuses to send the POST. The request never reaches our Lambda - the browser stopped it. This is the "suspenders" layer of protection working as intended.

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

Our Lambda receives this request and runs. Icarus' `checkOriginValid` function in level2.js checks for a valid Origin header. Finding none, it throws an error and the request fails with 500. This is the "belt" doing its job - the serverless.yml "suspenders" let the request through, but our application code caught it. Without `checkOriginValid`, this request would have succeeded, allowing any server on the internet to call our upload endpoint.

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

The browser sees the 403 and stops. The actual POST request is never sent - the browser blocked it at preflight. This is the "suspenders" working for server-only endpoints: by omitting CORS configuration entirely, we ensure browsers can't even begin a cross-origin request. Note that our Lambda code never ran here - API Gateway rejected the request before it reached us.

### Test 7

```bash
# Test 7: POST from server (no Origin header)
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
```

**Expected:** `HTTP/2 200` with `{"success":true,"sticker":"..."}`

**What's happening:** No Origin header means this looks like a server-to-server request. `checkOriginOmitted` passes because Origin is absent. Gate action executes and returns success. This is the only path that should succeed for `/message`.

**Result (2026-01-30):**
```
HTTP/2 200
{"success":true,"sticker":"CloudLambda.2026jan30.GI522KF.Fri02:58p45.479s.4nI7LYVUphrKQJ4Ho9vMA"}
```

### Test 8

```bash
# Test 8: POST with Origin header (simulating a page)
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Origin: https://cold3.cc" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
```

**Expected:** `HTTP/2 500`

**What's happening:** The request reaches the Lambda (POST with JSON would normally require preflight, but curl bypasses browser checks). `checkOriginOmitted` in level2 door throws because Origin header is present. Even our own domain is blocked - this endpoint is for servers only.

**Result (2026-01-30):**
```
HTTP/2 500
```

### Test 9

```bash
# Test 9: Simple request with Origin (text/plain skips preflight)
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Origin: https://unknown.com" \
  -H "Content-Type: text/plain" \
  -d '{"action":"Gate."}'
```

**Expected:** `HTTP/2 500`

**What's happening:** This simulates a "simple request" that browsers send without preflight (text/plain content-type). The request reaches the Lambda because there's no preflight to fail. But `checkOriginOmitted` throws because Origin header is present. This proves the level2 door is essential - serverless.yml config alone cannot block simple requests from pages.

**Result (2026-01-30):**
```
HTTP/2 500
```

---

## Summary

| Test | Endpoint | Origin | Serverless Config | Level2 Door | Result |
|------|----------|--------|-------------------|-------------|--------|
| 1 | /upload | cold3.cc (OPTIONS) | Returns matching origin | N/A | Preflight passes |
| 2 | /upload | evil-site.com (OPTIONS) | Returns non-matching origin | N/A | Browser blocks |
| 3 | /upload | (none) | Allows request | `checkOriginValid` rejects | 500 |
| 4 | /upload | cold3.cc | Allows request | `checkOriginValid` passes | 200 ✓ |
| 5 | /message | any (OPTIONS) | No handler, 403 | N/A | Preflight fails |
| 6 | /message | (none) | Allows request | `checkOriginOmitted` passes | 200 ✓ |
| 7 | /message | cold3.cc | Allows request | `checkOriginOmitted` rejects | 500 |
| 8 | /message | evil-site.com | Allows request | `checkOriginOmitted` rejects | 500 |

**Key insight:** Tests 3, 7, and 8 prove that the level2 door checks are essential. Serverless.yml configuration alone cannot block these requests - the Lambda receives them, and only our application code rejects them.
