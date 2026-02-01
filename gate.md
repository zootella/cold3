
# Notes

## [Section A] CORS Discussion

**serverless.yml CORS configuration does not block requests at the infrastructure level.** It only controls:
1. Whether an OPTIONS handler exists (for preflight)
2. What `Access-Control-Allow-*` headers appear in responses

The request **always reaches the Lambda**. CORS is enforced by browsers, not by API Gateway.

From [AWS Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html):
> "Cross-origin resource sharing (CORS) is a **browser security feature** that restricts cross-origin HTTP requests that are initiated from scripts running in the browser."

From [Serverless Framework CORS Guide](https://www.serverless.com/blog/cors-api-gateway-survival-guide):
> The configuration enables CORS compliance through response headers, not request blocking.

## [Section B] Configuring Lambda Endpoints

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

## [Section C] Defense in Depth Summary

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

## [Section D] Built-in CORS vs Code It Ourselves

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

# [Section E] Why Can't We Have Both? (new notes post implementation; just got this from a teammate, we'll discuss soon)

Consider two lambdas, peter for pages, and sam for servers:

```yaml
functions:
  peter: # example lambda configured for only pages to talk to it
    handler: src/peter.handler  # path to the exported handler function
    timeout: 25  # seconds before Lambda times out (up to 900 for Function URLs)
    url:  # creates a Function URL for this Lambda
      cors:  # AWS handles preflight and adds Access-Control-* headers
        allowedOrigins:  # browsers from these origins can call this endpoint
          - http://localhost:3000
          - https://oursite.com
        allowedHeaders:  # headers the browser is allowed to send
          - Content-Type
        allowedMethods:  # HTTP methods the browser is allowed to use
          - POST
  sam: # example lambda configured for server to server communication only
    handler: src/sam.handler
    timeout: 25
    url: true  # creates Function URL with no CORS (no preflight response, no headers)
```

**peter** has explicit CORS configuration. AWS will handle OPTIONS preflight requests and return `Access-Control-Allow-Origin` only if the request's Origin header matches one of your two allowed origins. Browsers from other origins will fail the preflight and never make the real request. Your handler receives POST requests from allowed origins.

**sam** has `url: true` with no CORS config. AWS won't respond to OPTIONS preflights and won't add any `Access-Control-*` headers to responses. Browsers will block on preflight failure. But requests still reach your Lambda, so handler code must still look for and reject on an Origin header that indicates a browser is trying to call.

The plan is this: Start by implementing CORS handling entirely in your handler code: respond to OPTIONS preflights, validate Origin headers, and set response headers. Test with curl to confirm everything works. This gives you a working baseline and ensures you understand exactly what's happening at each step.

Then add the url.cors configuration in serverless.yml on top of the working code. This creates two layers of protection. AWS now intercepts OPTIONS preflights and responds from config—your preflight handling code becomes unreachable but remains as documentation of intent. For actual requests, your origin-checking code still runs, providing a secondary gate even though browsers already passed the config check. When you set response headers, AWS overwrites them with config values, which is fine since both layers express the same policy.

The result is belt and suspenders. The YAML config is the enforced policy at the infrastructure level. The JavaScript code is a fallback that would catch anything if the config were ever misconfigured or removed. Both layers agreeing means no conflicts—just redundancy. The only cost is maintaining two expressions of the same policy, which is worth it for the confidence that your endpoints behave correctly regardless of which layer is doing the work.

# [Section F] Code Review Notes (February 2025)

Team decided to not configure CORS in serverless.yml. OPTIONS, preflight, everything happens in and relies upon the implementation in `icarus/level2.js` around `doorLambda`. Here are notes from a code review of that implementation.

# Review Recommendations

## Recommendation 1: Add `Vary: Origin`

### What `Vary` Does

The `Vary` HTTP header tells caches: "This response depends on certain request headers. Only serve this cached response if those headers match."

```
Vary: Origin
```

Means: "The response you're caching was generated based on the `Origin` request header. Don't serve this cached response to a request with a different `Origin`."

### When It Matters

Consider a caching layer (CDN, proxy, browser cache) between client and server:

```
Request 1: Origin: https://cold3.cc
Response:  Access-Control-Allow-Origin: https://cold3.cc  <- cached

Request 2: Origin: https://evil.com
Response:  (served from cache) Access-Control-Allow-Origin: https://cold3.cc  <- WRONG!
```

The browser receiving response 2 sees the Origin doesn't match `Access-Control-Allow-Origin` and blocks the response. But this is still bad - the cache is serving incorrect responses.

### Does It Actually Matter For Our Setup?

Thinking about this more carefully:

1. **We only have one allowed origin** - `originApex()` returns a single value. There's no scenario where different valid origins get different `Access-Control-Allow-Origin` values.

2. **Lambda Function URLs don't cache by default** - There's no CloudFront distribution in front of these endpoints.

3. **POST responses typically aren't cached** - Browsers and caches generally don't cache POST responses.

4. **Invalid origins get rejected, not served differently** - A request from `evil.com` throws an error, it doesn't get a response with different CORS headers.

### What Does MDN Say?

From [MDN's CORS documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSMissingAllowOrigin):

> "If `Access-Control-Allow-Origin` is set to `*` or **a static origin** for a particular resource, then configure the server to always send `Access-Control-Allow-Origin` in responses for the resource — for non-CORS requests as well as CORS requests — and **do not use `Vary`**."

> "In other words, if the CORS response is always the same regardless of the `Origin` request header, `Vary: Origin` **should not be set**."

`Vary: Origin` is for when you have **multiple allowed origins in an allowlist** and you echo back whichever one matched, so the response genuinely differs based on the Origin header.

### Our Setup

- We have ONE allowed origin (`originApex()`)
- The `Access-Control-Allow-Origin` value is always the same static value
- The response doesn't dynamically vary based on which origin from a list matched

### Decision: Don't Add `Vary: Origin`

MDN explicitly says not to use it when the CORS response is static. Our single-origin setup means the response is always the same. No change needed.

---

## Recommendation 2: Remove `OPTIONS` from `Access-Control-Allow-Methods`

### What `Access-Control-Allow-Methods` Means

From the Fetch specification:

> `Access-Control-Allow-Methods` indicates which methods are supported by the response's URL for the purposes of the CORS protocol.

The key phrase is "for the purposes of the CORS protocol" - meaning the **actual request** that follows the preflight, not the preflight itself.

### The Preflight Flow

```
1. Browser wants to POST with Content-Type: application/json
2. Browser sends OPTIONS preflight: "Can I POST with these headers?"
3. Server responds: "Yes, POST is allowed, Content-Type header is allowed"
4. Browser sends actual POST request
```

The `Access-Control-Allow-Methods` in step 3 tells the browser what methods are allowed for step 4. The browser already knows OPTIONS works - it just successfully sent an OPTIONS request!

### Does Including OPTIONS Cause Problems?

No. The browser simply ignores methods it doesn't care about. It's looking for `POST` in the list, sees it, and proceeds.

### Why Remove It?

1. **Accuracy** - It's technically incorrect per the spec's intent
2. **Clarity** - Future developers might wonder "do we support OPTIONS as an actual API method?"
3. **Cleanliness** - Minor, but why include unnecessary information?

### What Do Trusted Sources Do?

- **MDN** (Mozilla Developer Network) examples include OPTIONS: `Access-Control-Allow-Methods: POST, GET, OPTIONS`
- **AWS API Gateway** documentation shows: `"Access-Control-Allow-Methods": "OPTIONS,POST,GET"`

Both authoritative sources include OPTIONS in their examples.

### Decision: Keep OPTIONS

Since MDN and AWS - the two most relevant authorities (web standards and our infrastructure) - both include OPTIONS in their examples, we leave our code matching that pattern. No change needed.

---

## Summary

| Recommendation | Decision |
|----------------|----------|
| Add `Vary: Origin` | **Don't add** - MDN says not to use for static single-origin setups |
| Remove `OPTIONS` from methods | **Keep as-is** - matches MDN and AWS examples |

Both initial recommendations were reconsidered after checking authoritative sources. The CORS implementation in `icarus/level2.js` is correct as-is. No changes needed.
