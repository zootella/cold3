# Media Pipeline Documentation

## Current Status

**Delivery pipeline:** Working. CloudFront + S3 with signature verification. See `vhs.cjs`, `vhsSign()`.

**Upload pipeline:** Working. Smoke tested local and deployed (small, medium, and 3 GB files).
- `UppyDemo.vue` wired to Lambda via `@uppy/aws-s3` multipart callbacks
- Password-protected: user enters password, page hashes with PBKDF2, Worker validates before issuing permission envelope
- Lambda CORS headers set via `originApex()` on both success and error responses
- Filename validation: alphanumeric, dots, hyphens only (spaces rejected — sanitization not yet implemented)

---

## Key Files

- **Upload pipeline**
  - `net23/src/upload.js` — Upload Lambda: `uploadLambda`, `uploadLambdaOpen`, `uploadLambdaShut`, `uploadHandleBelow`
- **Nuxt Worker endpoints**
  - `site/server/api/media.js` — combined media endpoint with actions: `MediaDeliverySign.` (generates signed delivery URL via `vhsSign`), `MediaUploadPermission.` (validates password hash, seals permission envelope), and `MediaUploadHash.` (receives browser hashes, opens hash envelope from Lambda)
- **Infrastructure**
  - `net23/serverless.yml` — S3, CloudFront, Lambda, IAM, CORS
  - `net23/persephone/persephone.js` — `bucketDynamicImport()`: S3 SDK loading
  - `net23/vhs.cjs` — CloudFront Function: delivery signature verification
- **Shared libraries (icarus)**
  - `icarus/level2.js` — `checkForwardedSecure()`, `checkOriginValid()`, `openEnvelope()`
  - `icarus/level3.js` — `vhsSign()`: delivery signature creation
  - `icarus/level1.js` — `hashFile()`, `hashStream()`, `uppyDynamicImport()`
- **Frontend**
  - `site/components/snippet1/UppyDemo.vue` — Upload UI with password gate, Uppy Dashboard, and `@uppy/aws-s3` multipart callbacks
  - `site/components/snippet1/VhsDemo.vue` — Delivery demo

---

## Completed Steps

**Step 1: AWS SDK S3 Modules ✓** — `bucketDynamicImport()` in persephone.js.

**Step 2: Upload Lambda ✓** — `upload.js` with 6 actions (`UploadCreate.`, `UploadSign.`, `UploadComplete.`, `UploadAbort.`, `UploadList.`, `UploadHash.`). Page-direct pattern with `checkOriginValid`, envelope type `'UploadPermission.'`, CORS via `originApex()`.

**Step 3: Smoke Test ✓** — Proved full flow from command line. Script deleted after production code (`UppyDemo.vue`) replicated all tested paths. Recoverable from git if needed.

**Step 4: UppyDemo Wiring ✓** — `@uppy/aws-s3` multipart callbacks in `UppyDemo.vue`. Uses `$fetch` to Lambda (not `fetchLambda`, which is worker-only). Envelope cached in reactive ref, fetched once from Worker via `fetchWorker`. Uppy mounts after password validation.

**Step 5: Password Protection ✓** — `PasswordBox` in `UppyDemo.vue`, PBKDF2 hashing (52 cycles), `hasTextSame` comparison in `media.js`. Wrong password returns `{success: false, reason: 'BadPassword.'}` (not an exception).

---

## How an Upload Works

This section describes how a page upload works end to end. The example is a 250 MB video file that Uppy splits into 50 parts.

**Step 1: Get permission from our Worker.**
The page POSTs to the Nuxt Worker at `/api/media` to request a permission envelope. This is entirely within our application — no Amazon involved. The Worker calls `sealEnvelope('UploadPermission.', ...)` to create an encrypted, signed envelope with an expiration. The page receives `{success: true, permissionEnvelope: "..."}`. This envelope is proof that our Worker authorized this upload session. The page will include it in every subsequent call to the Lambda.

**Step 2: Tell Amazon to expect a file.**
The page POSTs `{action: 'UploadCreate.', permissionEnvelope, filename, contentType}` to our Lambda. The Lambda first runs security checks: verifies HTTPS, validates Origin, and decrypts the envelope (confirming it was sealed by us, hasn't expired, and is the right type). It then validates the filename against our alphanumeric regex (`/^[0-9A-Za-z][0-9A-Za-z.\-]*$/`), which only allows letters, numbers, dots, and hyphens — this is a security boundary, because without it a malicious filename like `../../other-folder/evil.txt` could use path traversal to write outside the `uploads/` prefix to an arbitrary location in the bucket.

The Lambda chooses a path in the bucket — `uploads/{timestamp}.{random tag}.{filename}` — and calls the **S3 CreateMultipartUpload API**:

```
→ CreateMultipartUploadCommand {
    Bucket: "vhs-net23-cc",
    Key: "uploads/2026jan27.2257.46437.AbCdEfGhIjKlMnOpQrStU.vacation.mp4",
    ContentType: "video/mp4"
  }

← {
    UploadId: "9r..g773B.u8dF6.rnXltt1WeI9N5_VWMRFnfecAFJECl3vumJcF2i0lR6WqOJkBJSm
               oZpYG84cyspLFLr6HkBnwMt0utDMZYwntWTV7JTSYshTviMpdHx_ghxUTMBXB"
  }
```

We give Amazon our bucket name, the target path we chose, and the content type. Amazon allocates a multipart upload session and returns an `UploadId` — 128 characters, Amazon's internal identifier for this upload session. We don't interpret it; we just pass it back in subsequent calls.

Our Lambda returns `{uploadId, key}` to the page. No file bytes have moved yet. Amazon is just reserving a session.

**Steps 3 and 4: Sign and upload each part.**
Uppy splits the 250 MB file into parts (Uppy chooses the part size; S3 requires at least 5 MB per part except the last). For each part, two things happen:

First, the page asks our Lambda for a presigned URL. The page POSTs `{action: 'UploadSign.', permissionEnvelope, uploadId, key, partNumber: N}` to the Lambda. The Lambda calls the **S3 UploadPart API via getSignedUrl** — this doesn't actually upload anything, it creates a presigned URL:

```
→ UploadPartCommand {
    Bucket: "vhs-net23-cc",
    Key: "uploads/2026jan27.2257.46437.AbCdEfGhIjKlMnOpQrStU.vacation.mp4",
    UploadId: "9r..g773B...ghxUTMBXB",
    PartNumber: 1
  }
  getSignedUrl(client, command, { expiresIn: 3600 })

← "https://vhs-net23-cc.s3.us-east-1.amazonaws.com
    /uploads/2026jan27.2257.46437.AbCdEfGhIjKlMnOpQrStU.vacation.mp4
    ?X-Amz-Algorithm=AWS4-HMAC-SHA256
    &X-Amz-Credential=AKIA3MHJKIKR...
    &X-Amz-Date=20260127T225746Z
    &X-Amz-Expires=3600
    &X-Amz-Signature=48f214cc1340...
    &partNumber=1
    &uploadId=9r..g773B...ghxUTMBXB"
```

The presigned URL is a temporary, self-contained permission slip. It embeds our AWS credentials, an expiration (3600 seconds = 1 hour, chosen by us in `getSignedUrl`), the target path, the upload session ID, and the part number. Anyone with this URL can PUT bytes to that exact location in S3, without having AWS credentials themselves.

Second, the page PUTs the part's bytes directly to that presigned URL. This is the only step where actual file data moves, and it goes straight from the page to Amazon, bypassing our Lambda entirely:

```
→ PUT https://vhs-net23-cc.s3.us-east-1.amazonaws.com/uploads/...?X-Amz-...
  Content-Type: video/mp4
  Body: [5 MB of file bytes for part 1]

← HTTP 200
  ETag: "a3c2b1d4e5f6a7b8c9d0e1f2a3b4c5d6"
```

S3 responds with an `ETag` — for our bucket (no server-side encryption), this is the MD5 hash of that part's bytes. Identical bytes always produce the same ETag. The page saves this ETag.

This sign-then-upload cycle repeats for all 50 parts. As each part completes, Uppy accumulates the ETags in memory:

```
After part  1: [{ PartNumber: 1,  ETag: "a3c2b1d4..." }]
After part  2: [{ PartNumber: 1,  ETag: "a3c2b1d4..." }, { PartNumber: 2,  ETag: "f7e8d9c0..." }]
...
After part 50: [{ PartNumber: 1,  ETag: "a3c2b1d4..." }, ..., { PartNumber: 50, ETag: "b2a1c3d4..." }]
```

The traffic pattern: our Worker is contacted once (step 1, for the permission envelope). Our Lambda is contacted once per part for signing — 50 small JSON round-trips — but never touches file bytes. All 250 MB of data flows directly from the page to S3.

**Step 5: Tell Amazon to assemble the file.**
All 50 parts are uploaded. The page now sends the full array of ETags it accumulated to our Lambda, POSTing `{action: 'UploadComplete.', permissionEnvelope, uploadId, key, parts: [...]}`. The Lambda calls the **S3 CompleteMultipartUpload API**:

```
→ CompleteMultipartUploadCommand {
    Bucket: "vhs-net23-cc",
    Key: "uploads/2026jan27.2257.46437.AbCdEfGhIjKlMnOpQrStU.vacation.mp4",
    UploadId: "9r..g773B...ghxUTMBXB",
    MultipartUpload: {
      Parts: [
        { PartNumber: 1,  ETag: "a3c2b1d4e5f6a7b8c9d0e1f2a3b4c5d6" },
        { PartNumber: 2,  ETag: "f7e8d9c0b1a2d3e4f5a6b7c8d9e0f1a2" },
        ...
        { PartNumber: 50, ETag: "b2a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6" }
      ]
    }
  }

← { }  // success; the object now exists at the Key path in the bucket
```

Amazon verifies that all 50 parts are present and that the ETags match what it received during the uploads, then assembles the parts into the final 250 MB object at the path we chose in step 2. The file is now in the bucket. Our Lambda returns `{success: true, key}`.

The parts array is small even for large files. Each entry is about 60 bytes of JSON. Our 50-part example is around 3 KB. Even a 50 GB file at 10,000 parts (the S3 maximum) would be about 600 KB — easily held in page memory. Uppy accumulates this array as it goes; no need to persist to a database.

If the page dies mid-upload (browser crash, tab closed, network loss), the uploaded parts remain in S3 under that uploadId. They don't disappear — they sit as orphaned fragments, costing storage. That's what `UploadList.` is for: if the page can recover the uploadId (from localStorage or the Worker), it calls ListParts to ask S3 which parts were already received, and resumes from where it left off. If nobody ever completes or aborts the upload, S3 has a lifecycle rule option to auto-expire incomplete multipart uploads after a number of days, which we may want to configure.

**The Amazon APIs called, in order:**
1. `CreateMultipartUpload` — "I'm going to upload a file here, give me a session ID" (once)
2. `getSignedUrl(UploadPartCommand)` — "Give me a presigned URL so the page can PUT part N directly" (once per part, 50 times)
3. S3 PUT (by the page, not our Lambda) — actual bytes flow page → S3 (once per part, 50 times)
4. `CompleteMultipartUpload` — "All parts are uploaded, here are the 50 ETags, assemble the file" (once)

**Not called in the happy path but available:**
- `AbortMultipartUpload` — "Something went wrong, discard all uploaded parts." Important because incomplete multipart uploads cost storage until aborted.
- `ListParts` — "Which parts have been uploaded so far?" Enables resume after a page crash or network interruption.

---

## Future: Resume After Page Refresh

Not implemented yet. The infrastructure is in place — our Lambda already has `UploadList.` and Uppy's `@uppy/aws-s3` plugin has a built-in `listParts` callback for exactly this. S3 keeps uploaded parts under the uploadId even after the page dies, and S3 is the source of truth for ETags, so we don't need to persist those. We'd just save `{uploadId, key}` to localStorage so the page can reconnect to the in-progress session after a refresh.

**Concerns:**
- **Duplicate tabs.** If the user duplicates the tab mid-upload, both tabs would read the same `{uploadId, key}` from localStorage and both might try to continue the upload. Need to coordinate — perhaps a lock via `BroadcastChannel` or `navigator.locks`, or by clearing localStorage when an upload starts so only the original tab owns it.
- **Orphaned parts.** If the user never returns, incomplete multipart uploads cost storage indefinitely. S3 lifecycle rules can auto-expire these after a configurable number of days — a bucket-level setting in serverless.yml.
- **Stale sessions.** The permission envelope expires, so a resumed upload would need a fresh permission envelope from the Worker. The uploadId itself doesn't expire (unless we add a lifecycle rule), but our Lambda checks the permission envelope on every call.

---

## Architecture Decisions

These are settled. Don't re-litigate.

- **Browser → Lambda direct** for uploads (not through Worker) — reduces round-trips
- **Single Lambda with action parameter** — one endpoint, less config
- **Multipart always** (`shouldUseMultipart: () => true`) — one code path for all file sizes
- **Envelope auth from start** — page gets permission envelope from Worker, includes in Lambda requests
- **S3 path format** — `upload/${tag}` during upload phase (content-addressable by pieceHash later)

**Flow:**
```
Browser → POST /upload (UploadCreate.) → Lambda → S3 CreateMultipartUpload → { uploadId, key }
Browser → POST /upload (UploadSign.) → Lambda → presigned URL
Browser → PUT to presigned URL → S3 → ETag
...repeat for each part...
Browser → POST /upload (UploadComplete.) → Lambda → S3 CompleteMultipartUpload → done
```

---

## End-to-End Hashing: Goals

We have two hash functions (`hashFile` for quick tip-only, `hashStream` for full integrity) and two places to run them: in the browser before/during upload, and in the bucket after upload completes. Hashing at both ends enables verification that the bytes the browser sent are identical to the bytes that landed in S3.

### What This Enables

**Corruption detection.** If something goes wrong during upload—Uppy bug, network corruption, S3 multipart assembly error—we can detect it. The browser knows what hash it sent; the server can verify what hash it received. Mismatch means something broke. We can log the error, notify the user, or discard the corrupted file rather than silently storing garbage.

**Deduplication.** If the same file is uploaded twice, we don't need two copies in the bucket. Content-addressable storage (where the S3 key is derived from the hash) handles this naturally—uploading the same bytes targets the same location. S3 just overwrites with identical content.

**Upload short-circuit.** Better than deduplication: if we check whether a hash already exists *before* uploading, we can skip the upload entirely. User drags in a 2 GB video they uploaded last month? "Already got that one"—instant success, zero bytes transferred. This works whether it's the same user re-uploading or a different user uploading identical content.

### The Two Hashing Locations

**Browser-side (before/during upload):**
- Has direct access to the File object
- Can use `hashFile()` for quick tipHash via random access slicing
- Can use `hashStream()` with `file.stream()` for full pieceHash
- Hashing happens before or concurrent with upload
- Result: browser knows what it's sending

**Server-side (after upload lands in bucket):**
- Lambda reads the completed object from S3 as a stream
- Must use `hashStream()` (no random access to S3 objects)
- Computes pieceHash and tipHash from the stored bytes
- Result: server knows what it received

**Verification = comparing these two results.**

### Onramp: Browser-Side Hashing Before Upload

The browser has the file bytes directly via the File object. It can read them two ways: random-access slicing (`file.slice().arrayBuffer()`) for `hashFile()`, or streaming (`file.stream()`) for `hashStream()`. Both are available.

**Current approach (simplified for testing): Sequential hashing, always both.**

```
User drags file into Uppy:
│
├── 1. Await tipHash (fast, random access)
│      └── hashFile({file, size})
│      └── ~10ms for any file size (reads only start/middle/end stripes)
│
├── 2. Await pieceHash (streams whole file)
│      └── hashStream({stream: file.stream(), size})
│      └── Time proportional to file size
│
├── 3. Await Worker check with both hashes
│      └── If duplicate: remove file, skip upload
│      └── If new: continue to upload
│
└── Upload starts only after all three complete
```

See "Future Optimizations" section for parallel hashing and mobile skip approaches to add back later.

**Why concurrent hashing and upload will be safe (when we add it back):**

- Uppy uses `Blob.slice()` to read chunks for multipart upload
- `hashStream()` uses `file.stream()` which creates an independent ReadableStream
- Browser File/Blob APIs have no locking mechanism—multiple concurrent reads are safe by spec
- Blobs are immutable; concurrent readers can't interfere with each other

This was verified by examining Uppy's source (`@uppy/aws-s3` MultipartUploader uses `this.#data.slice(i, end)`) and the Web Streams / File API specs. Concurrent reads may cause minor I/O contention but won't cause errors or data corruption.

### Offramp: Server-Side Verification After Upload

After bytes flow through Uppy, the browser, the internet, and land in S3, they re-enter our control. The Lambda doesn't see bytes during upload—it only orchestrates (presigned URLs, multipart commands). So server-side hashing must happen *after* the file is fully assembled in the bucket.

**Approach: Explicit verification call after Uppy completes.**

The browser calls a new `UploadVerify.` action after Uppy's `upload-success` event. The Lambda reads the completed object from S3, runs `hashStream()`, compares against the expected hash, and returns verified/failed. This happens entirely outside Uppy's flow.

```
Uppy flow (unchanged):
├── createMultipartUpload ──► UploadCreate. ──► S3 CreateMultipartUpload
├── signPart (×N) ──────────► UploadSign. ────► presigned URLs
├── PUT bytes (×N) ─────────────────────────────────────────────► S3
├── completeMultipartUpload ► UploadComplete. ► S3 CompleteMultipartUpload
└── Uppy fires 'upload-success', file is done from Uppy's perspective

Our verification (new, after Uppy):
├── Browser shows "Verifying..."
├── fetchUpload({action: 'UploadVerify.', key, expectedHash})
├── Lambda: GetObject stream ──► hashStream() ──► compare hashes
└── Browser shows result: "Verified ✓" or handles mismatch
```

**Why this works well:**

- **Uppy stays clean.** Completion returns promptly, Uppy moves to the next file in a batch immediately. Our verification is invisible to Uppy.
- **Progress is visible.** Browser controls the verification call, so it can show "Verifying..." UI right away. No mysterious stalls.
- **Parallelism.** Verifications can run alongside ongoing uploads without blocking Uppy's queue.

**Why not inline verification (hashing inside UploadComplete before returning)?** This would block Uppy's upload queue—a file stays "in progress" until `completeMultipartUpload` resolves, so batch uploads would bottleneck waiting for large files to hash. Also, HTTP request/response can't stream progress, so the user would see the progress bar fill and then... nothing, while hashing happens silently.

**Edge cases to consider later (focus on happy path first):**
- *Page disappears mid-upload.* Wifi drops, user closes laptop. Uploaded parts remain in S3 as orphaned fragments (existing concern, not new). S3 lifecycle rules can auto-expire incomplete multipart uploads.
- *Page disappears after upload completes but before verification.* File exists in bucket, but we never confirmed its integrity. Unverified files could accumulate. May need a sweep/audit process, or a way to mark files as verified (metadata? separate prefix?).

### Implementation: Three Hashing Operations

| # | Where | Function | When | Blocking? | Purpose |
|---|-------|----------|------|-----------|---------|
| 1 | Browser | `hashFile()` → tipHash | After file-added, before upload | Await (~10ms) | Quick hash for duplicate check |
| 2 | Browser | `hashStream()` → pieceHash | After tip hash, before upload | Await | Full hash for duplicate check |
| 3 | Lambda | `hashStream()` → both | On `UploadHash.` call after upload | Browser awaits response | Verify what landed in bucket |

**Current simplified flow (sequential, always both hashes):**

```
User drags file → Uppy fires 'file-added'
│
├─► [1] BROWSER TIP HASH
│       await hashFile({file: file.data, size})
│       ~10ms, we wait for this
│
├─► [2] BROWSER PIECE HASH
│       await hashStream({stream: file.data.stream(), size})
│       Streams whole file, we wait for this
│
├─► [3] WORKER CHECK
│       await fetchWorker({action: 'MediaUploadHash.', browserTipHash, browserPieceHash, ...})
│       If duplicate → removeFile(), done
│       If new → continue
│
└─► File ready for upload (createMultipartUpload awaits readyPromise)

User clicks Upload → Uppy does its thing (unchanged):
├── createMultipartUpload
├── signPart ×N
└── completeMultipartUpload

Uppy fires 'upload-success'
│
├─► [4] LAMBDA HASH
│       fetchUpload({action: 'UploadHash.', tag, key, filename})
│       Lambda: GetObject stream → hashStream() → returns both hashes + hashEnvelope
│
├─► [5] FINAL WORKER REPORT
│       fetchWorker({action: 'MediaUploadHash.', ..., hashEnvelope})
│       Worker opens envelope, logs trusted hashes
│
└─► Compare hashes
        Match    → "Verified ✓"
        Mismatch → "Hash mismatch!"
```

**Code locations:**

- `UppyDemo.vue`: `file-added` handler does [1], [2], [3] in `readyPromise`
- `UppyDemo.vue`: `upload-success` handler does [4], [5], comparison
- `upload.js`: `UploadHash.` action does Lambda-side hashing
- `media.js`: `UploadHash.` action handles Worker-side logging (and later, duplicate detection)

### Open Questions (not implementation details yet)

- What's the source of truth for the expected hash? The S3 key itself (if content-addressable)? Object metadata? A separate catalog?
- What happens on mismatch? Delete? Quarantine to a different prefix? Alert? Retry?
- For short-circuit dedup: how do we check existence quickly? HeadObject on the expected key? A hash index/catalog?
- How does tipHash (quick but partial) vs pieceHash (complete but slower) factor in? Use tipHash for fast dedup checks, pieceHash for full verification?

### Current Simplified Implementation

For incremental testing, we start with the simplest hashing approach:

**Browser-side (before upload):**
1. Await tipHash via `hashFile()` (fast, random access)
2. Await pieceHash via `hashStream()` (streams whole file)
3. Await Worker check with both hashes

Upload only starts after all three complete. If Worker returns `{success: false, reason: 'UploadDuplicate.'}`, file is removed from Uppy without uploading.

**Server-side (after upload):**
- Single Lambda call to `UploadHash.` that reads file from S3 and computes both hashes via `hashStream()`

**Key format:** `upload/<tag>` - just the tag, nothing else. Filename and metadata tracked in Worker DB, not bucket path.

### Future Optimizations (add back later)

These optimizations were intentionally removed for simpler initial testing:

1. **Parallel pieceHash with upload:** On desktop, start `hashStream()` for pieceHash when file is added, but don't await - let it run in background while Uppy uploads. Only await it in `upload-success` before verification. Saves time on large files.

2. **Skip pieceHash on mobile:** Use `browserIsBesideAppStore()` to detect mobile devices. Mobile skips pieceHash entirely (CPU/battery concerns), relies on tipHash only for duplicate detection. Lambda still computes both; verification uses only tipHash on mobile.

3. **Fast tipHash-only duplicate check:** Currently we wait for both hashes before checking with Worker. Could check tipHash alone first (before computing pieceHash) for faster short-circuit on duplicates.

### Content-Addressable Storage Design (eventual goal)

The bucket will store files by their pieceHash, not by tag or filename:
- During upload: file lands at `upload/<tag>` (temporary location)
- After verification: file moves to `hash/<pieceHash>` (permanent, content-addressable)
- Uploading identical content = same destination = natural deduplication

The Worker DB tracks metadata separately:
- Original filename, sanitized filename
- File size, content type
- Upload timestamp, uploading user
- pieceHash, tipHash (for lookups)
- Multiple uploads of same file create multiple DB records pointing to same bucket object

This separates concerns: bucket is just a hash-indexed blob store, Worker DB handles all the relational/metadata needs.

### Lambda Timeout Constraint (address soon)

API Gateway has a hard 29-second timeout. Current Lambda timeout is 25 seconds. For the `UploadHash.` action where Lambda streams a file from S3 and hashes it, this limits us to files that can be hashed in ~25 seconds—roughly 5-10GB depending on S3 throughput and Lambda CPU.

**For now:** Accept this limit. Larger files either skip server-side verification or get flagged as "unverified."

**Questions to explore:**

- Should all page↔Lambda communication bypass API Gateway and use Lambda Function URLs instead? Or just the hash verification step?
- What benefit does API Gateway provide that we'd lose? (Request validation? Throttling? Logging? Custom domains?)
- If we wanted moment-by-moment hashing progress from Lambda to page (probably not necessary, but imagine we did)—how would we solve that?
- Would a WebSocket connection between page and Lambda help? For the entire upload session? Just during hashing?
- Lambda Function URLs support response streaming—could we stream hash progress that way?

---

## Next Steps

- **Filename sanitization.** The Lambda rejects filenames with spaces (and other non-alphanumeric characters). Either sanitize client-side in `createMultipartUpload` (e.g. replace spaces with hyphens) or loosen the regex carefully. macOS screenshots triggered this in production.
- **Round Trip.** After upload completes, display the file via the delivery pipeline (`vhsSign`) to prove both pipelines work together.
- **Hash Demo.** Compute `hashStream()` on files in the browser before upload, displaying progress and hashes. Foundation for content-addressable storage.

---

## User Stories

### Hash Demo

As a developer, I can drag a large file into UppyDemo and see the computed hashes displayed on the page. This validates that `hashStream()` from `icarus/level1.js` works in the browser with real files and shows progress during hashing. No backend needed. We'll use Uppy's `file-added` event to trigger hashing, calling `hashStream()` with `file.stream()` and the protocol constants (`hashProtocolPieces`, `hashProtocolTips`). The `onProgress` callback updates the UI as pieces complete. Need to figure out how to best display progress and final hashes (tipHash, pieceHash as base32) in the component.

### Simple Upload ✓

Working. Password-protected upload from UppyDemo through Lambda to S3. Tested local and deployed with files up to 3 GB.

### Round Trip

As a developer, I can upload a file and then see it displayed via the existing delivery pipeline. This connects UppyDemo's upload to VhsDemo's signed URL display, proving both pipelines work together. After upload completes, we know the S3 key and can call `vhsSign()` from `icarus/level3.js` to generate a viewing URL. Need to figure out the UX - whether to show the uploaded image on the same page, navigate somewhere, or display a signed URL the user can copy. The key question is how the uploaded file's path flows from the upload response to the signature request.

### Content-Addressable Upload

As a developer, I can upload a file where the S3 key is derived from the file's hash. The browser computes the hash first using the Hash Demo work, then requests a presigned URL for that specific key. Uploading the same file twice targets the same location, enabling natural deduplication. Need to figure out the S3 key format - just the pieceHash? With file extension? In a folder structure? Also need to handle the async flow where hashing must complete before we can request the presigned URL, which changes how Uppy's upload button behaves.

### Server Verification

As a developer, I can trust that uploaded files match their claimed hash. A Lambda reads the uploaded file from S3 as a stream, runs `hashStream()`, and compares to the expected hash. The hash functions are designed to work in Lambda using Node's stream-to-WHATWG conversion. Need to figure out the trigger mechanism - S3 event notification on upload, or an explicit verification call after upload? Also need to decide where the expected hash comes from (the S3 key itself if content-addressable, or object metadata), and what happens on mismatch (delete? quarantine? alert?).

### Token System for Large Files

As a developer, I can upload large files efficiently without the Worker mediating every request. The Worker issues a short-lived upload token using a pattern similar to `vhsSign()` - HMAC-signed with expiration. The browser then uses this token to request presigned URLs directly from a Lambda endpoint, avoiding Worker round-trips for each multipart piece. Need to figure out what the token contains (user identity? target hash? size limit?), how Uppy's multipart upload works with `@uppy/aws-s3`, and how to batch URL requests efficiently (all at once? in chunks as needed?).

---

## Future Considerations

**Deduplication.** Before uploading, check if a file with that hash already exists in the bucket. The browser computes the hash, sends it to the server, and the server checks S3 (HeadObject or a catalog lookup). If it exists, skip the upload entirely and just return success with the existing key. The tricky part is making this fast - we don't want to add latency to every upload. A catalog/index would help, but adds complexity. For content-addressable storage where the key is the hash, we can just try HeadObject on the expected key.

**Resume.** Interrupted uploads should be resumable without starting over. S3 multipart upload has built-in support for this - each part is uploaded separately and can be retried. Uppy and `@uppy/aws-s3` handle this at the S3 level. Our Fuji piece-hash protocol could add another layer: if we track which pieces (4 MiB chunks) have been uploaded, we could resume even if the S3 multipart session expired. This is more complex and probably only worth it for very large files where re-uploading gigabytes is painful.

**Catalog.** A metadata system to track uploaded files - mapping hashes to original filenames, upload times, file types, who uploaded them, etc. Without this, the bucket is just a pile of content-addressed blobs. Could be a simple JSON file in S3, a DynamoDB table, or records in an existing database. The difficult part is keeping it in sync with the bucket - what if an upload succeeds but the catalog write fails? Probably need the catalog write to happen before we confirm success to the user.

**Access control.** Who can upload, and how much? Currently the delivery pipeline uses signed URLs with expiration. The upload pipeline needs similar controls - not everyone should be able to PUT files to the bucket. Rate limiting prevents abuse (uploading terabytes). Size limits prevent accidents (user tries to upload a 50GB video). These controls could live in the Worker (check user session before issuing upload token), in the Lambda (validate requests), or in S3 bucket policies (max object size). Probably a combination.

**File sizes.** Files might be small (avatar images, kilobytes), medium (photos, megabytes), large (videos, gigabytes), or truly huge (archives, tens of gigabytes). Small files can use simple single-PUT uploads. Large files need S3 multipart upload, which `@uppy/aws-s3` supports. The Token System story addresses the challenge of getting many presigned URLs efficiently for multipart. Truly huge files might hit Lambda timeout limits during verification, or need special handling for the hash computation.

**Batch uploads.** Users might upload a folder with hundreds of small images, totaling gigabytes. Each file needs its own hash, presigned URL, and upload. Uppy handles the UI for multiple files. The challenge is efficiency - hundreds of sequential presigned URL requests would be slow. Batching helps: request URLs for multiple files in one call. Our hash computation could also batch - compute hashes for multiple files concurrently using Web Workers to avoid blocking the UI.

---

## Reference: Delivery Pipeline

Working. Browser requests signed URL from server (`vhsSign()` in level3.js), then fetches media from `vhs.net23.cc`. CloudFront Function (`vhs.cjs`) validates HMAC signature, expiration, referer, path scope.

## Reference: Hashing (Fuji Protocol)

In `icarus/level1.js`. Two functions: `hashFile()` (random access, browser/Node) and `hashStream()` (sequential, works everywhere including Lambda). Two hash types: tipHash (quick check) and pieceHash (full integrity). Enables content-addressable storage and deduplication.

## Reference: Uppy Dynamic Import

`uppyDynamicImport()` in level1.js. Loads Uppy modules only in browser (`import.meta.client` guard) to avoid Cloudflare Workers bundle issues.
