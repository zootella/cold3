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

### Phase 1: Enhance doorLambda to support Page mode

Build out the `from` parameter in level2.js. After this phase, doorLambda can handle both Worker and Page modes, but upload.js still uses its own uploadLambda (nothing breaks).

**1a. Add helper functions to level2.js**

Add `getLambdaMethod` to DRY up httpMethod extraction:
```javascript
function getLambdaMethod(lambdaEvent) {
    return isCloud()
        ? lambdaEvent.requestContext?.http?.method
        : lambdaEvent.httpMethod
}
```

Add `isOriginValid` alongside `checkOriginValid` (avoids catching our own exception in handleCorsPreflight):
```javascript
export function isOriginValid(headers) {
    if (isLocal()) return true
    let n = headerCount(headers, 'Origin')
    if (n != 1) return false
    let v = headerGet(headers, 'Origin')
    return v == originApex()
}
export function checkOriginValid(headers) {
    if (!isOriginValid(headers)) toss('origin not valid', {headers})
}
```

Add `handleCorsPreflight` (moved from upload.js):
```javascript
function handleCorsPreflight(headers) {
    if (!isOriginValid(headers)) {
        return {statusCode: 403, headers: {}, body: ''}
    }
    return {
        statusCode: 204,
        headers: {
            'Access-Control-Allow-Origin': originApex(),
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': ''+(2*Time.hour/Time.second),
        },
        body: '',
    }
}
```

**1b. Add `from` parameter to doorLambda signature**
```javascript
export async function doorLambda(method, {
    from,  // 'Worker.' or 'Page.'
    lambdaEvent, lambdaContext,
    doorHandleBelow,
    actions,
}) {
```

**1c. Handle OPTIONS in doorLambda (for Page only)**

At the top of doorLambda, before the try block:
```javascript
if (from == 'Page.') {
    if (getLambdaMethod(lambdaEvent) == 'OPTIONS') return handleCorsPreflight(lambdaEvent.headers)
}
```

**1d. Modify doorLambdaOpen to validate `from` and branch origin checks**
```javascript
async function doorLambdaOpen({method, from, lambdaEvent, lambdaContext}) {
    // ... existing decryptKeys and setup ...

    // validate from parameter
    if (from != 'Worker.' && from != 'Page.') toss('from must be Worker. or Page.', {from})

    // ... existing method check ...

    // branch origin check based on from
    if (from == 'Worker.') {
        checkOriginOmitted(lambdaEvent.headers)  // existing behavior
    } else if (from == 'Page.') {
        checkOriginValid(lambdaEvent.headers)
    }

    // ... rest of function ...
}
```

**1e. Modify doorLambdaCheck to branch envelope logic on `from`**

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

**1f. Modify doorLambdaShut to add CORS headers for Page**
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
let headers = {'Content-Type': 'application/json'}
if (from == 'Page.') {
    headers['Access-Control-Allow-Origin'] = originApex()
}
return {statusCode: 500, headers, body: ''}
```

**1g. Update up2.js and up3.js to specify actions** ✓ DONE

Already added `actions: ['Up.']` to both handlers (they already have `from: 'Worker.'`).

**Phase 1 files:**
- `icarus/level2.js` - doorLambda, doorLambdaOpen, doorLambdaCheck, doorLambdaShut, add helpers
- `net23/src/up2.js` - ✓ already has `actions: ['Up.']`
- `net23/src/up3.js` - ✓ already has `actions: ['Up.']`

---

### Phase 2: Migrate upload.js to unified doorLambda

Switch upload.js from its own uploadLambda to the enhanced doorLambda, then remove the duplicated code.

**2a. Update upload.js handler to use doorLambda**
```javascript
export const handler = async (lambdaEvent, lambdaContext) => {
    return await doorLambda('POST', {
        from: 'Page.',
        actions: ['Gate.', 'UploadCreate.', 'UploadSign.', 'UploadComplete.', 'UploadAbort.', 'UploadList.', 'UploadHash.'],
        lambdaEvent,
        lambdaContext,
        doorHandleBelow: uploadHandleBelow,
    })
}
```

**2b. Move permissionEnvelope check into uploadHandleBelow**

The handler-specific auth stays in the handler (not at door level):
```javascript
async function uploadHandleBelow({door, body, action}) {
    if (action == 'Gate.') {
        return {success: true, sticker: Sticker()}
    }

    // handler-specific auth: page must have permission envelope from worker
    door.letter = await openEnvelope('UploadPermission.', body.permissionEnvelope)

    // ... rest of handler ...
}
```

**2c. Remove duplicated functions from upload.js**
- Delete `handleCorsPreflight` (now in level2.js)
- Delete `uploadLambda` (replaced by doorLambda)
- Delete `uploadLambdaOpen` (replaced by doorLambdaOpen)
- Delete `uploadLambdaShut` (replaced by doorLambdaShut)

**2d. Update imports in upload.js**

Remove imports that are no longer needed, keep what's used by uploadHandleBelow.

**Phase 2 files:**
- `net23/src/upload.js` - switch to doorLambda, delete duplicated functions

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

## Files to Modify

**Phase 1:**
1. `icarus/level2.js` - doorLambda, doorLambdaOpen, doorLambdaCheck, doorLambdaShut, add handleCorsPreflight, add getLambdaMethod, add isOriginValid
2. `net23/src/up2.js` - add `actions: ['Up.']`
3. `net23/src/up3.js` - add `actions: ['Up.']`

**Phase 2:**
4. `net23/src/upload.js` - switch to doorLambda, delete duplicated functions
