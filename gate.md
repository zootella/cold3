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

**Application code required (belt):**
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

**serverless.yml (suspenders):**
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

**Application code required (belt):**
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

**The belt is required. The suspenders provide defense-in-depth and better browser UX.**

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

## Testing `/upload` (whitelisted pages only)

```bash
# Preflight from whitelisted origin - should return matching origin
curl -s -i -X OPTIONS "https://api.net23.cc/upload" \
  -H "Origin: https://cold3.cc" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  | grep -i "access-control-allow-origin"
# Expected: access-control-allow-origin: https://cold3.cc

# Preflight from non-whitelisted origin - returns first allowed origin (browser will reject mismatch)
curl -s -i -X OPTIONS "https://api.net23.cc/upload" \
  -H "Origin: https://evil-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  | grep -i "access-control-allow-origin"
# Expected: access-control-allow-origin: https://cold3.cc (doesn't match, browser blocks)

# POST from server (no Origin) - reaches Lambda, belt rejects
curl -s -i -X POST "https://api.net23.cc/upload" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
# Expected: HTTP/2 500 (checkOriginValid threw: origin header missing)

# POST with whitelisted Origin - reaches Lambda, belt allows, Gate succeeds
curl -s -i -X POST "https://api.net23.cc/upload" \
  -H "Origin: https://cold3.cc" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
# Expected: HTTP/2 200 {"success":true,"sticker":"..."}
```

## Testing `/message` (servers only)

```bash
# Preflight from any origin - should fail (no OPTIONS handler)
curl -s -i -X OPTIONS "https://api.net23.cc/message" \
  -H "Origin: https://cold3.cc" \
  -H "Access-Control-Request-Method: POST"
# Expected: HTTP/2 403 Missing Authentication Token (no OPTIONS handler configured)

# POST from server (no Origin) - reaches Lambda, belt allows, Gate succeeds
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
# Expected: HTTP/2 200 {"success":true,"sticker":"..."}

# POST with Origin header (simulating page) - reaches Lambda, belt rejects
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Origin: https://cold3.cc" \
  -H "Content-Type: application/json" \
  -d '{"action":"Gate."}'
# Expected: HTTP/2 500 (checkOriginOmitted threw: "origin must not be present")

# Simple request with Origin (text/plain skips preflight) - reaches Lambda, belt rejects
curl -s -i -X POST "https://api.net23.cc/message" \
  -H "Origin: https://evil-site.com" \
  -H "Content-Type: text/plain" \
  -d '{"action":"Gate."}'
# Expected: HTTP/2 500 (checkOriginOmitted threw - proves belt is required)
```

## Key Observations

1. **Preflight controls browser behavior** - API Gateway returns CORS headers; browsers enforce the match
2. **Requests always reach Lambda** - Unless preflight fails for complex requests
3. **Belt catches what suspenders miss** - Simple requests, server requests with/without Origin
4. **200 vs 500 proves security** - Gate. succeeds only when both suspenders and belt allow the request
