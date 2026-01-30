# Gate System

A demonstration system for testing CORS and header configuration across the page → worker → lambda architecture.

## Purpose

Written early in serverless development to verify that:
1. CORS blocks/allows requests as expected
2. Headers flow correctly through each layer
3. The worker-to-lambda envelope authentication works

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  /gate page (site/pages/gate.vue)                                           │
│  Renders four test components:                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐                        │
│  │ GateGetLambda       │    │ GatePostLambda      │                        │
│  │ GET → Lambda direct │    │ POST → Lambda direct│                        │
│  │ cors: true (open)   │    │ cors: none (blocked)│                        │
│  │ ✓ Works             │    │ ✗ Blocked by CORS   │                        │
│  └─────────────────────┘    └─────────────────────┘                        │
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐                        │
│  │ GateGetWorker       │    │ GatePostBoth        │                        │
│  │ GET → Worker        │    │ POST → Worker → λ   │                        │
│  │ Same-origin, works  │    │ Worker has no Origin│                        │
│  │ ✓ Works             │    │ ✓ Works (envelope)  │                        │
│  └─────────────────────┘    └─────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Files

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
| `gate-post-lambda.js` | (none) | Blocked - workers only |
| `snippet2.js` | (none) | Blocked - diagnostic endpoint |

## Security Model Demonstrated

1. **Workers have no Origin header** - Server-to-server calls bypass CORS entirely
2. **Pages have Origin headers** - Browsers enforce CORS on cross-origin requests
3. **Envelope authentication** - `gate-post-worker.js` seals an envelope that `gate-post-lambda.js` opens via `doorLambda`

The pattern `checkOriginOmitted()` in `doorLambda` (icarus/level2.js:883) enforces that POST lambdas can only be called by workers, never directly by pages.

## snippet2

A diagnostic Lambda showing:
- Node version and platform (`process.arch`, `process.platform`, `process.version`)
- icarus test results (`runTests()`)
- Module availability via `persephone.js`

Note: Comment says "no longer in service, as GET is blocked now" - the `cors` config was likely removed after initial testing.

## Comparison to /upload

The `/upload` Lambda is the exception to the "no direct page access" rule:
- Has explicit CORS allowing `cold3.cc` and `localhost:3000`
- Needed because pages upload directly to S3 via presigned URLs
- Protected by `permissionEnvelope` instead of relying solely on CORS

## Status

TTD comment in serverless.yml suggests this system may be removed:
> "ttd january, maybe get rid of the 'gate' system of cors testing, instead, test with curl with a section about how to in net23.txt"

The curl testing approach (as done above for the `/upload` CORS refactor) provides more precise verification without requiring deployed test infrastructure.

## CORS Configuration: What It Can and Cannot Do

**Critical insight: serverless.yml CORS configuration does not block requests at the infrastructure level.** It only controls:
1. Whether an OPTIONS handler exists (for preflight)
2. What `Access-Control-Allow-*` headers appear in responses

The request **always reaches the Lambda**. CORS is enforced by browsers, not by API Gateway.

From [AWS Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html):
> "Cross-origin resource sharing (CORS) is a **browser security feature** that restricts cross-origin HTTP requests that are initiated from scripts running in the browser."

From [Serverless Framework CORS Guide](https://www.serverless.com/blog/cors-api-gateway-survival-guide):
> The configuration enables CORS compliance through response headers, not request blocking.

### Testing Evidence

```bash
# Request with unauthorized Origin - reaches Lambda, returns 500 from app code
curl -X POST "https://api.net23.cc/message" -H "Origin: https://evil-site.com"
# HTTP/2 500 (Lambda's checkOriginOmitted threw, not API Gateway block)

# Request without Origin - also reaches Lambda
curl -X POST "https://api.net23.cc/upload" -H "Content-Type: application/json"
# HTTP/2 500 (Lambda's checkOriginValid threw, not API Gateway block)
```

### Hypothetical Scenarios

Consider two Lambda endpoints with different security requirements:

#### `/higher` - Pages from whitelisted domains only, servers blocked

**Goal:** Only accept requests from pages at `https://cold3.cc` or `http://localhost:3000`. Block requests from other pages AND from servers (which have no Origin header).

**serverless.yml alone cannot achieve this.** Here's why:

```yaml
# This config...
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
```

| Request Source | Origin Header | Preflight | Request Reaches Lambda? | Browser Can Read Response? |
|----------------|---------------|-----------|------------------------|---------------------------|
| Page at cold3.cc | `https://cold3.cc` | ✓ passes | **Yes** | Yes |
| Page at evil-site.com | `https://evil-site.com` | ✗ fails* | **Yes** (simple requests) | No |
| Server (curl, worker) | (none) | N/A | **Yes** | N/A |

*Complex requests (JSON content-type) fail preflight. Simple requests (text/plain) skip preflight entirely.

**To truly implement `/higher`, application code must:**
```javascript
// In Lambda handler
function checkOriginWhitelisted(headers) {
  let origin = headerGet(headers, 'Origin')
  if (!origin) throw 'Origin header required'  // Block servers
  let allowed = ['https://cold3.cc', 'http://localhost:3000']
  if (!allowed.includes(origin)) throw 'Origin not whitelisted'  // Block other pages
}
```

#### `/lower` - Servers only, all pages blocked

**Goal:** Only accept requests from servers (workers, curl, etc.). Block ALL requests from pages, regardless of domain.

**serverless.yml alone cannot achieve this either:**

```yaml
# This config...
lower:
  handler: src/lower.handler
  events:
    - http:
        path: /lower
        method: post
        # No cors config - but this doesn't BLOCK requests
```

| Request Source | Origin Header | Preflight | Request Reaches Lambda? |
|----------------|---------------|-----------|------------------------|
| Page (any domain, JSON) | present | ✗ fails (no OPTIONS handler) | No |
| Page (any domain, text/plain) | present | skipped | **Yes** |
| Server | (none) | N/A | **Yes** |

Simple requests from pages still reach the Lambda!

**To truly implement `/lower`, application code must:**
```javascript
// In Lambda handler (this is what doorLambda's checkOriginOmitted does)
function checkOriginOmitted(headers) {
  if (headerCount(headers, 'Origin') > 0) throw 'Origin header must not be present'
}
```

### Summary: Belt and Suspenders

| Layer | What It Does | What It Cannot Do |
|-------|--------------|-------------------|
| **serverless.yml CORS** (suspenders) | Controls browser enforcement via response headers; blocks complex cross-origin requests at preflight | Block simple requests; block/allow based on Origin presence; block servers |
| **Application code** (belt) | Inspect Origin header; throw on unauthorized requests; true infrastructure-level blocking | N/A - can do everything |

For this project:
- **`/upload`**: Uses both layers. CORS config for browser UX (proper preflight, readable responses). `checkOriginValid` in app code as true enforcement.
- **Worker-only lambdas** (`/message`, etc.): CORS config omitted (breaks preflight for complex requests). `checkOriginOmitted` in `doorLambda` as true enforcement.

The belt is required. The suspenders are defense-in-depth for complex requests and better browser UX.

### True Infrastructure-Level Blocking (If Needed)

If you wanted to block requests at the API Gateway level (before they reach Lambda), AWS provides these options:

1. **Lambda Authorizers** - A separate Lambda that runs before your main Lambda, can inspect headers including Origin, and return allow/deny. [AWS Docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)

2. **AWS WAF** - Web Application Firewall rules can block based on headers, IP ranges, etc.

3. **Resource Policies** - Can restrict by AWS account or IP range (not Origin header)

For the `/lower` scenario (servers only), a Lambda authorizer could check:
```javascript
// Lambda authorizer pseudocode
if (event.headers.origin || event.headers.Origin) {
  return { isAuthorized: false }  // Block - has Origin header (browser request)
}
return { isAuthorized: true }  // Allow - no Origin header (server request)
```

For the `/higher` scenario (whitelisted pages only), a Lambda authorizer could check:
```javascript
// Lambda authorizer pseudocode
const origin = event.headers.origin || event.headers.Origin
if (!origin) {
  return { isAuthorized: false }  // Block - no Origin header (server request)
}
const allowed = ['https://cold3.cc', 'http://localhost:3000']
if (!allowed.includes(origin)) {
  return { isAuthorized: false }  // Block - Origin not in whitelist
}
return { isAuthorized: true }  // Allow - Origin is whitelisted
```

However, Lambda authorizers add latency and cost. For this project, application-level checking (the belt) achieves the same security outcome more simply.

**Note:** The door system in `icarus/level2.js` (`doorLambda`, `doorWorker`, `checkOriginOmitted`, `checkOriginValid`) is effectively an inline Lambda authorizer. It runs at the very top of request handling before any business logic, achieving the same security as a separate authorizer Lambda but with:
- **Same security** - Unauthorized requests are rejected before business logic runs
- **Simpler architecture** - One Lambda instead of two; auth logic lives in the shared icarus library
- **Lower latency** - No additional Lambda cold start or invocation overhead
- **Lower cost** - One invocation instead of two per request

### Serverless.yml CORS Options Reference

From [Serverless Framework documentation](https://www.serverless.com/blog/cors-api-gateway-survival-guide):

```yaml
# Simplest - allow all origins
cors: true

# Equivalent to cors: true
cors:
  origins:
    - '*'
  headers:
    - Content-Type
    - X-Amz-Date
    - Authorization
    - X-Api-Key
    - X-Amz-Security-Token
  allowCredentials: false

# Specific origins (what /upload uses)
cors:
  origins:
    - https://cold3.cc
    - http://localhost:3000
  headers:
    - Content-Type
  allowCredentials: false

# No CORS config = no OPTIONS handler, no CORS response headers
# (what /message and other worker-only endpoints use)
```

**Note:** When using `allowCredentials: true`, you cannot use `'*'` for origins - you must specify exact domains.
