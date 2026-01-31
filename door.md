# doorLambda Refactor Plan

## Current State

### doorLambda in level2.js (lines 784-810)
Currently designed **only for worker-to-lambda** communication:
- Calls `doorLambdaOpen` which checks `checkOriginOmitted` (no browser allowed)
- Calls `doorLambdaCheck` which validates `envelope` (worker's sealed proof of identity)
- Returns JSON with `Content-Type: application/json` header only (no CORS)

### uploadLambda in upload.js (lines 76-144)
A **copy of the door pattern** adapted for page-to-lambda:
- Handles OPTIONS preflight with `handleCorsPreflight`
- Calls `uploadLambdaOpen` which checks `checkOriginValid` (browser must be from allowed domain)
- Validates `permissionEnvelope` instead of `envelope`
- Returns JSON with CORS headers (`Access-Control-Allow-Origin`)

### The DRY Problem
upload.js duplicates these functions from level2.js:
- `uploadLambda` mirrors `doorLambda`
- `uploadLambdaOpen` mirrors `doorLambdaOpen`
- `uploadLambdaShut` mirrors `doorLambdaShut`
- `handleCorsPreflight` is unique to page-facing lambdas

## Proposed API

From diff.diff, the vision is:

```javascript
// Worker-only lambda (message.js, up2.js, up3.js)
export const handler = async (lambdaEvent, lambdaContext) => {
    return await doorLambda('POST', {from: 'Worker.', actions: [...], lambdaEvent, lambdaContext, doorHandleBelow})
}

// Page-facing lambda (upload.js)
export const handler = async (lambdaEvent, lambdaContext) => {
    return await doorLambda('POST', {from: 'Page.', actions: [...], lambdaEvent, lambdaContext, doorHandleBelow})
}
```

The `from:` parameter is **mandatory** with only two allowed values:
- `'Worker.'` - lambda only accepts server-to-server calls (current doorLambda behavior)
- `'Page.'` - lambda accepts direct browser calls (current uploadLambda behavior)

## Security Model Comparison

```
                    from: 'Worker.'              from: 'Page.'
                    ---------------              -------------
OPTIONS         |   (not handled)               return CORS preflight response

POST auth       |   1. https (checkForwardedSecure)
                |   2. origin OMITTED            2. origin VALID (checkOriginValid)
                |   3. envelope (Network23.)     3. (none at door level - handler decides)

POST response   |   JSON, no CORS               JSON with Access-Control-Allow-Origin
```

## Implementation Steps

### Step 1: Add `from` parameter to doorLambda signature
```javascript
export async function doorLambda(method, {
    from,  // NEW: 'Worker.' or 'Page.'
    lambdaEvent, lambdaContext,
    doorHandleBelow,
    actions,
}) {
```

### Step 2: Handle OPTIONS in doorLambda (for Page only)
At the top of doorLambda, before the try block:
```javascript
if (from == 'Page.') {
    let httpMethod = lambdaEvent.httpMethod || lambdaEvent.requestContext?.http?.method
    if (httpMethod == 'OPTIONS') return handleCorsPreflight(lambdaEvent.headers)
}
```

### Step 3: Modify doorLambdaOpen to branch on `from`
```javascript
async function doorLambdaOpen({method, from, lambdaEvent, lambdaContext}) {
    // ... existing decryptKeys and setup ...

    if (from == 'Worker.') {
        checkOriginOmitted(lambdaEvent.headers)  // existing behavior
    } else if (from == 'Page.') {
        checkOriginValid(lambdaEvent.headers)    // new behavior
    } else {
        toss('from must be Worker. or Page.', {from})
    }

    // ... rest of function ...
}
```

### Step 4: Modify doorLambdaCheck to branch on `from`
All four cases explicit for clarity in security-critical code:
```javascript
async function doorLambdaCheck({door, from, actions}) {
    checkActions({action: door.body?.action, actions})

    if (from == 'Worker.') {
        if (door.body?.action == 'Gate.') {
            // Worker + Gate: no envelope, allows curl testing
        } else {
            // Worker + non-Gate: envelope required
            door.letter = await openEnvelope('Network23.', door.body?.envelope)
        }
    } else if (from == 'Page.') {
        if (door.body?.action == 'Gate.') {
            // Page + Gate: no envelope, allows curl testing
        } else {
            // Page + non-Gate: no envelope at door level; handler decides its own auth
            // (e.g., upload.js checks permissionEnvelope in doorHandleBelow)
        }
    }
}
```

### Step 5: Modify doorLambdaShut to add CORS headers for Page
```javascript
async function doorLambdaShut(door, from, response, error) {
    // ... existing setup ...

    let headers = {'Content-Type': 'application/json'}
    if (from == 'Page.') {
        headers['Access-Control-Allow-Origin'] = originApex()
    }

    if (error) {
        r = null
    } else {
        r = {statusCode: 200, headers, body: makeText(response)}
    }

    // ... rest of function ...
}
```

Also update the 500 fallback at the end of doorLambda itself:
```javascript
// Current (no CORS):
return {statusCode: 500, headers: {'Content-Type': 'application/json'}, body: ''}

// Updated (CORS for Page):
let headers = {'Content-Type': 'application/json'}
if (from == 'Page.') {
    headers['Access-Control-Allow-Origin'] = originApex()
}
return {statusCode: 500, headers, body: ''}
```

### Step 6: Move handleCorsPreflight to level2.js
Export it so upload.js can use it during transition, or keep it internal to doorLambda.

### Step 7: Update all lambda handlers
- message.js: add `from: 'Worker.'`
- up2.js: add `from: 'Worker.'`
- up3.js: add `from: 'Worker.'`
- upload.js: switch from `uploadLambda` to `doorLambda` with `from: 'Page.'`

### Step 8: Simplify upload.js
Remove duplicated door functions:
- `uploadLambda` function (replaced by doorLambda)
- `uploadLambdaOpen` function (replaced by doorLambdaOpen)
- `uploadLambdaShut` function (replaced by doorLambdaShut)
- `handleCorsPreflight` (moved to level2.js)

Keep in doorHandleBelow:
- `openEnvelope('UploadPermission.', body.permissionEnvelope)` - this is handler-specific auth, not door-level

## Safety Considerations

1. **Never mix up Worker and Page checks** - a Page-facing lambda with Worker checks would reject all browser requests; a Worker-facing lambda with Page checks would accept unauthorized browser requests

2. **Worker envelope is uniform** - All worker-to-lambda calls use the same `'Network23.'` envelope, enforced at the door level

3. **Page envelope is handler-specific** - doorLambda does NOT enforce envelopes for Page. Individual handlers decide their own auth (e.g., upload.js checks `permissionEnvelope` in its doorHandleBelow)

4. **CORS headers on errors too** - When returning 500 errors for Page lambdas, must include `Access-Control-Allow-Origin` or browser will hide the error

5. **Gate action bypass** - Both Worker and Page allow `Gate.` action without envelope for curl testing. This is intentional but worth documenting.

6. **Test thoroughly** - After refactor, verify:
   - Worker lambdas reject requests with Origin header
   - Worker lambdas reject requests without valid envelope
   - Page lambdas reject requests from wrong origin
   - Page lambdas handle their own envelope requirements in doorHandleBelow
   - OPTIONS preflight works for Page lambdas
   - CORS headers present on all Page lambda responses

## Additional Cleanup Notes

### DRY up httpMethod extraction
The pattern `lambdaEvent.httpMethod || lambdaEvent.requestContext?.http?.method` appears in multiple places. Create a helper function near the other header utilities (checkOriginValid, etc.):
```javascript
function getLambdaMethod(lambdaEvent) {
    return isCloud()
        ? lambdaEvent.requestContext?.http?.method
        : lambdaEvent.httpMethod
}
```

### Add isOriginValid alongside checkOriginValid
Currently upload.js lines 60-62 catch an exception we throw ourselves (messy). Follow the pattern of `checkText`/`hasText`:
- `checkOriginValid(headers)` - throws if invalid (for use in door authentication)
- `isOriginValid(headers)` - returns boolean (for use in handleCorsPreflight where we want to return 403, not throw)

```javascript
export function isOriginValid(headers) {
    if (isLocal()) return true
    let n = headerCount(headers, 'Origin')
    if (n != 1) return false
    let v = headerGet(headers, 'Origin')
    let allowed = 'https://'+Key('domain, public')
    return v == allowed
}
export function checkOriginValid(headers) {
    if (!isOriginValid(headers)) toss('origin not valid', {headers})
}
```

## Files to Modify

1. `icarus/level2.js` - doorLambda, doorLambdaOpen, doorLambdaCheck, doorLambdaShut, add handleCorsPreflight, add getLambdaMethod, add isOriginValid
2. `net23/src/message.js` - add `from: 'Worker.'`
3. `net23/src/up2.js` - add `from: 'Worker.'`
4. `net23/src/up3.js` - add `from: 'Worker.'`
5. `net23/src/upload.js` - switch to doorLambda, delete duplicated functions
