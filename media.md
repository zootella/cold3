# Media Pipeline Documentation

This document covers the media file systems in the cold3 serverless stack: how files are uploaded, stored, and served.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DELIVERY PIPELINE (working)                    │
│                                                                         │
│   Browser ──► Nuxt Server ──► vhsSign() ──► Signed URL                  │
│      │                                          │                       │
│      └──────────────────────────────────────────┘                       │
│                              │                                          │
│                              ▼                                          │
│                      vhs.net23.cc (CloudFront)                          │
│                              │                                          │
│                              ▼                                          │
│                     vhs.cjs (CF Function)                               │
│                      verifies signature                                  │
│                              │                                          │
│                              ▼                                          │
│                      vhs-net23-cc (S3)                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           UPLOAD PIPELINE (in progress)                  │
│                                                                         │
│   Browser ──► Uppy (UppyDemo) ──► hashFile/hashStream ──► ???           │
│                                                                         │
│   Components ready:                                                     │
│   - Uppy integrated with dynamic imports for Cloudflare Workers         │
│   - Hash functions work in browser, Lambda, and local Node              │
│   - S3 bucket exists (vhs-net23-cc)                                     │
│                                                                         │
│   Components needed:                                                    │
│   - Upload endpoint (Lambda or signed S3 URLs)                          │
│   - Hash verification on server                                         │
│   - File metadata/catalog system                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Delivery Pipeline

### Infrastructure (serverless.yml)

Located at `net23/serverless.yml`, defines AWS resources for media serving:

**S3 Bucket:**
- Name: `vhs-net23-cc`
- Access: Private (only CloudFront can read)

**CloudFront Distribution:**
- Domain: `vhs.net23.cc`
- Query strings: Forwarded (contains access signatures)
- Cache TTL: 1 day default, 2 days max
- Methods: GET, HEAD only

**Origin Access Identity:**
- CloudFront OAI grants read permission to S3 bucket
- Direct S3 access blocked; all requests go through CloudFront

### Signature Verification (vhs.cjs)

The CloudFront Function at `net23/vhs.cjs` acts as a gatekeeper. It validates:

1. **Request method** - GET only
2. **URI format** - Must start with `/`, not end with `/`
3. **Referer header** - Required, must start with `https://cold3.cc`
4. **Query parameters** - `path`, `tick`, `seed`, `hash`
5. **Path scope** - Requested URI must be within signed path
6. **Expiration** - `tick` timestamp must be in future (max 7 days)
7. **HMAC signature** - Timing-safe comparison against recomputed hash

**Signature format:**
```
path=%2Ffolder%2F&tick=1733865221895&seed=LsX2IlDdSRQ5ioFccXBOL&hash=tZt6Cmo...
```

**Security properties:**
- HMAC-SHA-256 prevents forgery
- Timestamp prevents replay attacks
- Random seed ensures unique signatures
- Timing-safe comparison prevents timing attacks

### Signature Creation (icarus/level3.js)

The `vhsSign()` function creates signatures server-side:

```javascript
import { vhsSign } from 'icarus'

// Grant 2-hour access to root path
let query = await vhsSign('/', 2*Time.hour)
let url = 'https://vhs.net23.cc/banner.png?' + query
```

**Process:**
1. Loads shared secret via `Key('vhs, secret')`
2. Generates random 21-char seed via `Tag()`
3. Computes expiration: `now + duration`
4. Creates message: `path=<encoded>&tick=<timestamp>&seed=<tag>`
5. Signs with HMAC-SHA-256
6. Returns query string with all parameters

### Frontend Demo (VhsDemo.vue)

Component at `site/components/snippet1/VhsDemo.vue` demonstrates the flow:

```vue
<script setup>
const refSource = ref(null)
let response = await fetchWorker('/api/image')
refSource.value = response.source
</script>

<template>
  <img v-if="refSource" :src="refSource" />
</template>
```

The `/api/image` endpoint (at `site/server/api/image.js`) calls `vhsSign()` and returns the signed URL.

---

## Upload Pipeline (In Progress)

### Uppy Integration (UppyDemo.vue)

Component at `site/components/snippet1/UppyDemo.vue` with dynamic imports for Cloudflare Workers compatibility.

**The constraint:** Cloudflare Workers has strict bundle size limits and module restrictions. Large client-only libraries like Uppy can't be statically imported.

**The solution:** `uppyDynamicImport()` in `icarus/level1.js`:

```javascript
export async function uppyDynamicImport() {
    if (import.meta.client && !_uppy) {
        let [uppy_core, uppy_dashboard, uppy_aws_s3] = await Promise.all([
            import('@uppy/core'),
            import('@uppy/dashboard'),
            import('@uppy/aws-s3'),
        ])
        _uppy = {uppy_core, uppy_dashboard, uppy_aws_s3}
    }
    return _uppy
}
```

**Key features:**
- `import.meta.client` guard keeps Uppy out of server bundle entirely
- Dynamic `import()` defers loading until component mounts in browser
- Caches modules to avoid re-importing
- Parallel loading with `Promise.all()`

**Dependencies in site/package.json:**
```json
"@uppy/core": "^5.2.0",
"@uppy/dashboard": "^5.1.0",
"@uppy/aws-s3": "^5.1.0"
```

### File Hashing (Fuji Protocol)

Located in `icarus/level1.js`, the hashing system enables content-addressable storage.

**Protocol specifications:**
```javascript
const hashProtocolPieces = {title: 'Fuji.Pieces.SHA256.4MiB.', size: 4*Size.mb}
const hashProtocolTips   = {title: 'Fuji.Tips.SHA256.4KiB.',   size: 4*Size.kb}
```

**Two hash types:**

| Type | Purpose | Method |
|------|---------|--------|
| **Tip Hash** | Quick integrity check | Hashes start, middle, penultimate, and last 4 KiB stripes |
| **Piece Hash** | Complete integrity | Hashes each 4 MiB piece, then hashes the array of hashes |

**Two functions:**

#### `hashFile({file, size, protocolTips})`
- Requires random file access (File/Blob API)
- Works in: Browser, local Node
- Does NOT work in: Lambda (no random access to streams)
- Returns: `tipHash` only

#### `hashStream({stream, size, protocolPieces, protocolTips, onProgress, signal})`
- Sequential stream processing
- Works in: Browser, local Node, Lambda
- Returns: `pieceHash` and `tipHash`
- Supports progress callbacks and AbortSignal cancellation

**Stream processing uses a "conveyor belt" pattern:**
```javascript
let belt = {}
belt.capacity = Math.min(2 * protocolPieces.size, size)  // Double-buffer
belt.array = new Uint8Array(belt.capacity)  // Single allocation
belt.fill = 0

// As boxes arrive from stream:
// 1. Shovel bytes into belt
// 2. When belt >= 4 MiB, hash that piece
// 3. Slide remaining bytes to front with copyWithin()
```

**Why this matters for uploads:**
- Content-addressable: Same file always produces same hash
- Deduplication: Check if file already exists before uploading
- Integrity verification: Server can verify upload matches claimed hash
- Resume support: Piece-based hashing enables partial upload recovery

**Environment compatibility:**
```javascript
// Local Node: Convert Node stream to WHATWG ReadableStream
let stream = node.stream.Readable.toWeb(node.fs.createReadStream(path))

// Browser: File objects are already compatible
let stream = file.stream()

// Lambda: S3 provides streams directly
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `net23/serverless.yml` | Infrastructure: S3 bucket, CloudFront, Lambda functions |
| `net23/vhs.cjs` | CloudFront Function: Signature verification |
| `net23/persephone/persephone.js` | `bucketDynamicImport()`: S3 SDK module loading |
| `icarus/level3.js` | `vhsSign()`: Signature creation |
| `icarus/level1.js` | `hashFile()`, `hashStream()`: File hashing |
| `icarus/level1.js` | `uppyDynamicImport()`: Uppy module loading |
| `site/components/snippet1/VhsDemo.vue` | Demo: Signed URL display |
| `site/components/snippet1/UppyDemo.vue` | Demo: File upload UI |
| `site/server/api/image.js` | API: Generates signed URLs |

---

## What's Working

- CloudFront + S3 media serving with signature verification
- VhsDemo proof of concept displaying signed images
- Uppy integrated and rendering in Cloudflare Workers environment
- Hash functions tested across all target environments
- S3 SDK modules loaded via `bucketDynamicImport()` in persephone.js (tested local and deployed)

## Implementation Plan

Incremental steps toward a working upload pipeline.

---

### Hash Demo

As a developer, I can drag a large file into UppyDemo and see the computed hashes displayed on the page. This validates that `hashStream()` from `icarus/level1.js` works in the browser with real files and shows progress during hashing. No backend needed. We'll use Uppy's `file-added` event to trigger hashing, calling `hashStream()` with `file.stream()` and the protocol constants (`hashProtocolPieces`, `hashProtocolTips`). The `onProgress` callback updates the UI as pieces complete. Need to figure out how to best display progress and final hashes (tipHash, pieceHash as base32) in the component.

### Simple Upload

As a developer, I can drag a file into Uppy and have it land in the S3 bucket. The `@uppy/aws-s3` package is already in site dependencies, and the `vhs-net23-cc` bucket exists. We'll need a Lambda in `net23/serverless.yml` that generates presigned PUT URLs, and CORS configuration on the bucket to allow browser uploads. Need to figure out how Uppy's aws-s3 plugin expects to receive the presigned URL (endpoint that returns URL? or inline configuration?), and what minimal IAM permissions the Lambda needs. Skip custom hashing and complex permissions for now - just get bytes from browser to S3.

### Round Trip

As a developer, I can upload a file and then see it displayed via the existing delivery pipeline. This connects UppyDemo's upload to VhsDemo's signed URL display, proving both pipelines work together. After upload completes, we know the S3 key and can call `vhsSign()` from `icarus/level3.js` to generate a viewing URL. Need to figure out the UX - whether to show the uploaded image on the same page, navigate somewhere, or display a signed URL the user can copy. The key question is how the uploaded file's path flows from the upload response to the signature request.

### Content-Addressable Upload

As a developer, I can upload a file where the S3 key is derived from the file's hash. The browser computes the hash first using the Hash Demo work, then requests a presigned URL for that specific key. Uploading the same file twice targets the same location, enabling natural deduplication. Need to figure out the S3 key format - just the pieceHash? With file extension? In a folder structure? Also need to handle the async flow where hashing must complete before we can request the presigned URL, which changes how Uppy's upload button behaves.

### Server Verification

As a developer, I can trust that uploaded files match their claimed hash. A Lambda reads the uploaded file from S3 as a stream, runs `hashStream()`, and compares to the expected hash. The hash functions are designed to work in Lambda using Node's stream-to-WHATWG conversion. Need to figure out the trigger mechanism - S3 event notification on upload, or an explicit verification call after upload? Also need to decide where the expected hash comes from (the S3 key itself if content-addressable, or object metadata), and what happens on mismatch (delete? quarantine? alert?).

### Token System for Large Files

As a developer, I can upload large files efficiently without the Worker mediating every request. The Worker issues a short-lived upload token using a pattern similar to `vhsSign()` - HMAC-signed with expiration. The browser then uses this token to request presigned URLs directly from a Lambda endpoint, avoiding Worker round-trips for each multipart piece. Need to figure out what the token contains (user identity? target hash? size limit?), how Uppy's multipart upload works with `@uppy/aws-s3`, and how to batch URL requests efficiently (all at once? in chunks as needed?).

---

### Future Considerations

**Deduplication.** Before uploading, check if a file with that hash already exists in the bucket. The browser computes the hash, sends it to the server, and the server checks S3 (HeadObject or a catalog lookup). If it exists, skip the upload entirely and just return success with the existing key. The tricky part is making this fast - we don't want to add latency to every upload. A catalog/index would help, but adds complexity. For content-addressable storage where the key is the hash, we can just try HeadObject on the expected key.

**Resume.** Interrupted uploads should be resumable without starting over. S3 multipart upload has built-in support for this - each part is uploaded separately and can be retried. Uppy and `@uppy/aws-s3` handle this at the S3 level. Our Fuji piece-hash protocol could add another layer: if we track which pieces (4 MiB chunks) have been uploaded, we could resume even if the S3 multipart session expired. This is more complex and probably only worth it for very large files where re-uploading gigabytes is painful.

**Catalog.** A metadata system to track uploaded files - mapping hashes to original filenames, upload times, file types, who uploaded them, etc. Without this, the bucket is just a pile of content-addressed blobs. Could be a simple JSON file in S3, a DynamoDB table, or records in an existing database. The difficult part is keeping it in sync with the bucket - what if an upload succeeds but the catalog write fails? Probably need the catalog write to happen before we confirm success to the user.

**Access control.** Who can upload, and how much? Currently the delivery pipeline uses signed URLs with expiration. The upload pipeline needs similar controls - not everyone should be able to PUT files to the bucket. Rate limiting prevents abuse (uploading terabytes). Size limits prevent accidents (user tries to upload a 50GB video). These controls could live in the Worker (check user session before issuing upload token), in the Lambda (validate requests), or in S3 bucket policies (max object size). Probably a combination.

**File sizes.** Files might be small (avatar images, kilobytes), medium (photos, megabytes), large (videos, gigabytes), or truly huge (archives, tens of gigabytes). Small files can use simple single-PUT uploads. Large files need S3 multipart upload, which `@uppy/aws-s3` supports. The Token System story addresses the challenge of getting many presigned URLs efficiently for multipart. Truly huge files might hit Lambda timeout limits during verification, or need special handling for the hash computation.

**Batch uploads.** Users might upload a folder with hundreds of small images, totaling gigabytes. Each file needs its own hash, presigned URL, and upload. Uppy handles the UI for multiple files. The challenge is efficiency - hundreds of sequential presigned URL requests would be slow. Batching helps: request URLs for multiple files in one call. Our hash computation could also batch - compute hashes for multiple files concurrently using Web Workers to avoid blocking the UI.


## Simple Upload: Planning Notes

**Goal:** Small file (avatar-sized image) from browser to S3, validating we've got the module integration and platform requirements right.

### Architecture Choices

These choices fit our serverless stack (Cloudflare Worker + AWS Lambda + Browser), which differs from the common assumption of a single Node/Express server on AWS:

**PUT for S3 uploads (implicit for multipart).** S3 multipart uploads use PUT - each part is PUT to its own presigned URL as raw bytes. There's no POST-based alternative for multipart, so this isn't a choice we made, it's dictated by S3. Downstream implications: CORS must allow PUT method, CORS must expose ETag header (client reads ETag from each part response and sends all ETags to completeMultipartUpload), no form encoding involved.

**Multipart always, one code path.** We set `shouldUseMultipart: () => true` so ALL uploads - even small avatars - go through multipart. This means one server-side implementation that works for 10KB files and 10GB files alike. S3 allows this: the "5MB minimum part size" rule exempts the last part, and for small files the first part IS the last part. No need to maintain two upload paths or test edge cases at the boundary.

**Multipart callbacks, not getUploadParameters.** We implement `createMultipartUpload`, `signPart`, `completeMultipartUpload`, `listParts`, and `abortMultipartUpload`. This is more callbacks than the simple-upload path, but it's the single path we'll use forever. Uppy and S3 handle resume/retry at the part level automatically.

**Browser → Lambda direct for uploads.** Unlike most of our API calls which go Browser → Worker → Lambda, upload operations go Browser → Lambda directly. This avoids Worker round-trip overhead (especially for `signPart` which may be called many times) and aligns with common S3 upload patterns found across the web - most projects using S3 multipart aren't also using Cloudflare Workers. The Lambda endpoints will need CORS configuration to accept browser requests.

*Authentication approach:* For the smoke test, the Lambda endpoints are open (we'll watch carefully and disable quickly). Soon after, we add envelope-style authentication: the browser first requests a short-lived upload token from the Worker (which can check user session, rate limits, etc.), then includes that token in Lambda requests. The Lambda validates the token using our `sealEnvelope`/`openEnvelope` pattern - something we define, Amazon never sees it. This keeps auth logic in the Worker while upload operations go direct to Lambda.

**AWS SDK in Lambda only.** The Worker environment can't run AWS SDK (wrong runtime, bundle size limits). Lambda has IAM credentials automatically via its role. Worker stays thin.

**AWS SDK v3.** Modular packages (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) mean smaller Lambda bundles. Promise-based matches our async patterns.

**The result:** Browser ↔ Lambda (AWS operations) ↔ S3. Browser calls Lambda directly for upload orchestration, then uploads parts directly to S3 via presigned URLs. Worker is not in the upload path (auth token will be obtained from Worker separately, later). Small files work. Large files work. Resume works. One path.

---

**Flow (multipart, browser → Lambda direct):**
```
UppyDemo                              Lambda                          S3
   │                                      │                            │
   │ file selected                        │                            │
   │ user clicks upload                   │                            │
   │                                      │                            │
   │── POST /upload createMultipartUpload ►                            │
   │                                      │── CreateMultipartUpload ───►
   │                                      │◄── uploadId ───────────────│
   │◄──────────── { uploadId, key } ──────│                            │
   │                                      │                            │
   │── POST /upload signPart(part 1) ─────►                            │
   │                                      │── generate presigned URL   │
   │◄──────────── { url } ────────────────│                            │
   │                                                                   │
   │── PUT part 1 directly (presigned URL) ───────────────────────────►
   │◄──────────────────────────────────────────────────── 200 + ETag ──│
   │                                      │                            │
   │   ...repeat signPart + PUT for each part...                       │
   │                                      │                            │
   │── POST /upload complete({ parts }) ──►                            │
   │                                      │── CompleteMultipartUpload ─►
   │◄──────────── success ────────────────│◄── 200 ────────────────────│
```

*Later, with authentication:*
```
Browser ──► Worker: "I want to upload" ──► returns upload token (sealEnvelope)
Browser ──► Lambda: all upload operations include token, Lambda validates with openEnvelope
```

---

### Client-side: Uppy Configuration

Configure `@uppy/aws-s3` with multipart callbacks. Browser calls Lambda directly using `origin23()`:

```javascript
import { origin23 } from 'icarus'

uppy.use(AwsS3, {
  shouldUseMultipart: () => true,  // always multipart, even for small files
  // Valid supported config. Default threshold is 100MB but that's conservative.
  // Multipart benefits (retry chunks, parallel upload, resume) apply to smaller files too.
  // Overhead is a few extra round-trips - acceptable for "one road" simplicity.

  async createMultipartUpload(file) {
    const res = await fetch(`${origin23()}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'Create.',
        filename: file.name,
        contentType: file.type
      })
    })
    const { uploadId, key } = await res.json()
    return { uploadId, key }
  },

  async signPart(file, { uploadId, key, partNumber }) {
    const res = await fetch(`${origin23()}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SignPart.', uploadId, key, partNumber })
    })
    const { url } = await res.json()
    return { url }
  },

  async completeMultipartUpload(file, { uploadId, key, parts }) {
    const res = await fetch(`${origin23()}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'Complete.', uploadId, key, parts })
    })
    return await res.json()
  },

  async abortMultipartUpload(file, { uploadId, key }) {
    await fetch(`${origin23()}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'Abort.', uploadId, key })
    })
  },

  async listParts(file, { uploadId, key }) {
    const res = await fetch(`${origin23()}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ListParts.', uploadId, key })
    })
    return await res.json()  // array of { PartNumber, Size, ETag }
  }
})
```

Key details:
- `shouldUseMultipart: () => true` - one path for all file sizes
- Small files become multipart with 1 part (S3 allows this - last part has no minimum size)
- Uppy handles chunking, parallel uploads, retry logic
- `parts` array passed to `completeMultipartUpload` contains `{ PartNumber, ETag }` for each part
- `listParts` enables resume after browser refresh (optional for initial implementation)
- Single Lambda endpoint with `action` parameter keeps things simple
- `origin23()` handles cloud vs local URL switching automatically (later: add `token` parameter to each request for auth)

---

### Server-side: Lambda Multipart Operations

Using AWS SDK v3 packages. These could be separate Lambda functions or actions within one function:

```javascript
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({ region: "us-east-1" })
const BUCKET = 'vhs-net23-cc'

// 1. Initiate multipart upload
async function createMultipartUpload({ filename, contentType }) {
  const key = `uploads/${Date.now()}-${filename}`  // simple key for now
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  const { UploadId } = await s3.send(command)
  return { uploadId: UploadId, key }
}

// 2. Sign a single part for upload
async function signPart({ uploadId, key, partNumber }) {
  const command = new UploadPartCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
  return { url }
}

// 3. Complete the upload
async function completeMultipartUpload({ uploadId, key, parts }) {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map(p => ({ PartNumber: p.PartNumber, ETag: p.ETag }))
    }
  })
  await s3.send(command)
  return { success: true, key }
}

// 4. Abort on cancel
async function abortMultipartUpload({ uploadId, key }) {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
  })
  await s3.send(command)
}

// 5. List parts for resume
async function listParts({ uploadId, key }) {
  const command = new ListPartsCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
  })
  const { Parts } = await s3.send(command)
  return Parts || []
}
```

Key details:
- `CreateMultipartUploadCommand` returns an `UploadId` that identifies this upload session
- `UploadPartCommand` with `getSignedUrl` creates presigned URL for each part
- Client PUTs part data to presigned URL, S3 returns ETag in response header
- `CompleteMultipartUploadCommand` assembles parts into final object
- Lambda needs IAM permissions for all these S3 operations

---

### Decisions made:
- **Browser → Lambda direct** (not through Worker) - reduces round-trips, matches common patterns
- **Single Lambda with action parameter** - one endpoint, less config churn
- **Auth deferred** - smoke test runs open, then add envelope token soon after
- **S3 key format** - timestamp + filename for now (later: hash-based for content-addressable)
- **CORS origins** - both cold3.cc and localhost:3000 for dev

---

## Next Steps

### Step 1: Add AWS SDK S3 Modules ✓

**Completed.** Added S3 packages to net23 as devDependencies (same pattern as SES/SNS - AWS SDK v3 is pre-installed on Lambda, packages just needed for local development):

```json
"@aws-sdk/client-s3": "^3.975.0",
"@aws-sdk/s3-request-presigner": "^3.975.0",
```

Added `bucketDynamicImport()` in `persephone.js`:

```javascript
export async function bucketDynamicImport() {
	if (!_bucket) {
		let [clientS3, presigner] = await Promise.all([
			import('@aws-sdk/client-s3'),
			import('@aws-sdk/s3-request-presigner'),
		])
		_bucket = {clientS3, presigner}
	}
	return _bucket
}
```

Test verifies all multipart commands load: `S3Client`, `CreateMultipartUploadCommand`, `UploadPartCommand`, `CompleteMultipartUploadCommand`, `AbortMultipartUploadCommand`, `ListPartsCommand`, plus `getSignedUrl` from presigner. Tested local and deployed.

### Step 2: Create Upload Lambda Endpoint

Create the `/upload` Lambda that handles multipart S3 operations. Browser calls this directly (not through Worker; but soon, submitting a signed envelope of access permissions that it got in a previous call to Worker).

**2a. Lambda handler code** - New file `net23/src/upload.js`:
- Follow existing Lambda patterns (`doorLambda` wrapper, async handler)
- Single endpoint with `action` parameter: `create`, `sign-part`, `complete`, `abort`, `list-parts`
- Use `bucketDynamicImport()` from persephone.js to get S3 client and commands
- Bucket name: `vhs-net23-cc`
- S3 key format: `uploads/${timestamp}-${filename}`

**2b. serverless.yml changes:**
- Add function definition for upload-lambda
- Add HTTP POST route `/upload`
- Add IAM permissions for S3 multipart operations:
  - `s3:PutObject`, `s3:GetObject` on `arn:aws:s3:::vhs-net23-cc/*`
  - `s3:ListBucket` on `arn:aws:s3:::vhs-net23-cc` (needed for ListParts)
- Add CORS on the endpoint (AllowedOrigins from .env variables)

**2c. CORS environment variables** - Add to `net23/.env`:
```
ACCESS_ORIGIN_APEX_CLOUD=https://cold3.cc
ACCESS_ORIGIN_APEX_LOCAL=http://localhost:3000
# comment right in .env about how this mirrors isCloud() t/f for originApex()
```
These match `originApex()` values from icarus (cloud and local). Both allowed because:
- Production: browser on cold3.cc calls Lambda deployed
- Development: browser on localhost:3000 calls Lambda (local or deployed)

**2d. S3 bucket CORS** - Add `CorsConfiguration` to VHSBucket resource:
- AllowedOrigins: `${env:ACCESS_ORIGIN_APEX_CLOUD}`, `${env:ACCESS_ORIGIN_APEX_LOCAL}`
- AllowedMethods: PUT
- AllowedHeaders: content-type, etc.
- ExposeHeaders: ETag (client must read this from part upload responses)

**Security note:** CORS with localhost is safe because CORS isn't the security boundary—it only affects browser same-origin policy (attackers bypass it with curl). Real security comes from envelope authentication added later: Lambda will require a valid envelope (using `sealEnvelope`) that only code with `.env.keys` can create. Developers have keys locally; production Worker has keys and issues envelopes based on user permissions. An attacker with the open source code but without `.env.keys` cannot forge valid envelopes.

**Done when:** Lambda deploys, and a manual curl/fetch test to the endpoint returns a response (even an error response confirms the Lambda is reachable and CORS is working).

---

### Step 2.5: Page-Direct Endpoint (Not Using Door)

The door system (`doorLambda` in `icarus/level2.js`) is purpose-built for server-to-server communication: Worker → Lambda. It explicitly blocks page requests because the Network 23 API is "exclusively for server to server communication; no pages allowed."

The `/upload` endpoint is different: pages call it directly. We must not use `doorLambda`, and instead handle things ourselves.

#### What Door Provides (and what we need)

**doorLambdaOpen (setup phase):**
| Door does | Upload needs? | Notes |
|-----------|---------------|-------|
| `decryptKeys('lambda', sources)` | ✓ Yes | Need to call `Key()` for bucket name, region |
| `door.task = Task({...})` | ✓ Yes | Logging, performance tracking |
| Save `lambdaEvent`, `lambdaContext` | Maybe | Useful for debugging |
| `checkForwardedSecure(headers)` | ✓ Yes | Pages should still use HTTPS |
| `checkOriginOmitted(headers)` | ✗ No | **This blocks pages** - they always have Origin |
| Parse body with `makeObject()` | ✓ Yes | Need to parse JSON body |

**doorLambdaCheck (validation phase):**
| Door does | Upload needs? | Notes |
|-----------|---------------|-------|
| `openEnvelope('Network23.', ...)` | Different | We'll use a different envelope type for page auth |
| `checkActions({action, actions})` | ✓ Yes | Already works - validates action format and allowed list |

**doorLambdaShut (cleanup phase):**
| Door does | Upload needs? | Notes |
|-----------|---------------|-------|
| `door.task.finish()` | ✓ Yes | End timing |
| `logAlert()` on error | ✓ Yes | Staff notification |
| Format response for Lambda | ✓ Yes | `{statusCode, headers, body}` |
| `awaitDoorPromises()` | ✓ Yes | Ensure logging completes before Lambda exits |
| Return `null` on error | Different | See below |

#### Error Response Strategy (Critical Difference)

Door returns `null` on errors, which becomes a 500. The Worker catches this, logs it, returns 500 to the page, and the page's `fetchWorker` throws. Staff sees the error in Datadog; the page sees nothing sensitive.

For page-direct calls, we must be careful what we return:
- **On success:** Return the data (uploadId, key, url, etc.)
- **On expected errors** (bad input, validation failure): Return `{error: 'brief message'}` with 400
- **On unexpected errors** (S3 failure, code bug): Log to Datadog, return generic `{error: 'upload failed'}` with 500

Never leak: stack traces, internal variable names, secret values, S3 error details that reveal bucket structure.

#### What We'll Implement

The upload Lambda will have its own lightweight door-like wrapper:

```
1. Setup (like doorLambdaOpen, minus origin check):
   - decryptKeys()
   - Task creation
   - Body parsing
   - checkForwardedSecure()

2. Validation:
   - checkActions() - already done in current code via doorLambda
   - Envelope check (later, with page-appropriate envelope type)

3. Handler:
   - The S3 operations (already written)

4. Cleanup (like doorLambdaShut, with page-safe errors):
   - task.finish()
   - On error: logAlert(), return sanitized error
   - On success: return data
   - awaitDoorPromises()
```

#### Why Not Modify Door?

Door is correctly opinionated for its use case. Adding flags or modes would make it complex and error-prone. Better to have two clear patterns:
- `doorLambda` for Worker → Lambda (authenticated, trusted, can speak freely)
- A simpler pattern for Page → Lambda (untrusted, must sanitize everything)

The upload Lambda is currently the only page-direct endpoint. If we add more, we could factor out a `doorLambdaPage` helper, but for now inline code is clearer.
