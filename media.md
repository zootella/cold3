# Media Pipeline Documentation

## Current Status

**Delivery pipeline:** Working. CloudFront + S3 with signature verification. See `vhs.cjs`, `vhsSign()`.

**Upload pipeline:** Backend ready, needs frontend wiring.
- Upload Lambda deployed at `/upload` with 5 actions: `UploadCreate.`, `UploadSign.`, `UploadComplete.`, `UploadAbort.`, `UploadList.`
- Envelope auth enabled (`openEnvelope('Net23Upload.', ...)`)
- Origin validation (`checkOriginValid()` - cold3.cc and localhost:3000)
- S3 bucket CORS configured (PUT, exposes ETag)

---

## Next Step: Wire UppyDemo.vue to Lambda

Add `@uppy/aws-s3` plugin to `site/components/snippet1/UppyDemo.vue` so dragging a file into Uppy uploads it to S3 via the Lambda.

**Read these files first:**
- `site/components/snippet1/UppyDemo.vue` — the file you'll edit. Currently initializes Uppy with Dashboard only. `uppyDynamicImport()` already loads `@uppy/aws-s3` but the component doesn't use it yet.
- `smoke-upload.js` (project root) — **working reference implementation.** This Node script does the exact upload flow you need to replicate in the browser: gets an envelope from the Worker, then calls the Lambda with `UploadCreate.`, `UploadSign.`, PUTs bytes to S3, and calls `UploadComplete.`. Translate this sequence into Uppy's `@uppy/aws-s3` multipart callbacks.
- `net23/src/upload.js` — the Lambda endpoint. See `uploadHandleBelow()` for what each action expects and returns. Every request must include `envelope` and `action`.
- `site/server/api/media.js` — the Worker endpoint. Action `MediaDemonstrationUpload.` returns `{success: true, envelope}`. The component should call this via `fetchWorker('/api/media', {body: {action: 'MediaDemonstrationUpload.'}})` before starting the upload.
- `origin23()` from `icarus/level2.js` — returns the Lambda base URL (localhost:4000/prod locally, api.net23.cc in cloud). Each callback POSTs to `${origin23()}/upload`.

**Key points:**
- Use `shouldUseMultipart: () => true` — one code path for all file sizes
- Each callback POSTs to `${origin23()}/upload` with action: `UploadCreate.`, `UploadSign.`, `UploadComplete.`, `UploadAbort.`, or `UploadList.`
- Must include `envelope` in every request (get from Worker before upload starts)
- Envelope and S3 signed URLs both expire after `Limit.mediaUpload` (6 hours)

**Then smoke test:** select file → UploadCreate. → UploadSign. → PUT to S3 → UploadComplete. → file appears in bucket.

---

## Key Files

- **Upload pipeline**
  - `net23/src/upload.js` — Upload Lambda: `uploadLambda`, `uploadLambdaOpen`, `uploadLambdaShut`, `uploadHandleBelow`
  - `smoke-upload.js` (project root) — Node smoke test script: proves the full upload pipeline end to end from the command line
- **Nuxt Worker endpoints**
  - `site/server/api/media.js` — combined media endpoint with actions: `MediaDemonstrationSign.` (generates signed delivery URL via `vhsSign`) and `MediaDemonstrationUpload.` (seals envelope for upload smoke test)
- **Infrastructure**
  - `net23/serverless.yml` — S3, CloudFront, Lambda, IAM, CORS
  - `net23/persephone/persephone.js` — `bucketDynamicImport()`: S3 SDK loading
  - `net23/vhs.cjs` — CloudFront Function: delivery signature verification
- **Shared libraries (icarus)**
  - `icarus/level2.js` — `checkForwardedSecure()`, `checkOriginValid()`, `openEnvelope()`
  - `icarus/level3.js` — `vhsSign()`: delivery signature creation
  - `icarus/level1.js` — `hashFile()`, `hashStream()`, `uppyDynamicImport()`
- **Frontend**
  - `site/components/snippet1/UppyDemo.vue` — Upload UI (wire to Lambda next)
  - `site/components/snippet1/VhsDemo.vue` — Delivery demo

---

## Completed Steps

**Step 1: AWS SDK S3 Modules ✓** — Added packages to net23, created `bucketDynamicImport()` in persephone.js.

**Step 2: Upload Lambda ✓** — Created `upload.js` with 5 actions. Added serverless.yml config (function, IAM, CORS). Deployed.

**Step 2.5: Page-Direct Pattern ✓** — Can't use `doorLambda` (blocks pages). Created `uploadLambda`/`uploadLambdaOpen`/`uploadLambdaShut` with `checkOriginValid` (opposite of door's `checkOriginOmitted`). Envelope type: `'Net23Upload.'`.

**Step 3: Smoke Test ✓** — Created `upload.js` at project root and `site/server/api/upload.js` Worker endpoint. Proved the full upload pipeline works end to end with `node upload`. Added filename validation in Lambda (alphanumeric, dots, hyphens only).

---

## How an Upload Works

This section describes how a page upload works end to end. The example is a 250 MB video file that Uppy splits into 50 parts. We proved this flow with our smoke test script (`upload.js` at project root), which plays the role of the page.

**Step 1: Get permission from our Worker.**
The page POSTs to the Nuxt Worker at `/api/upload` to request an upload envelope. This is entirely within our application — no Amazon involved. The Worker calls `sealEnvelope('Net23Upload.', ...)` to create an encrypted, signed envelope with an expiration. The page receives `{success: true, envelope: "..."}`. This envelope is proof that our Worker authorized this upload session. The page will include it in every subsequent call to the Lambda.

**Step 2: Tell Amazon to expect a file.**
The page POSTs `{action: 'UploadCreate.', envelope, filename, contentType}` to our Lambda. The Lambda first runs security checks: verifies HTTPS, validates Origin, and decrypts the envelope (confirming it was sealed by us, hasn't expired, and is the right type). It then validates the filename against our alphanumeric regex (`/^[0-9A-Za-z][0-9A-Za-z.\-]*$/`), which only allows letters, numbers, dots, and hyphens — this is a security boundary, because without it a malicious filename like `../../other-folder/evil.txt` could use path traversal to write outside the `uploads/` prefix to an arbitrary location in the bucket.

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

First, the page asks our Lambda for a presigned URL. The page POSTs `{action: 'UploadSign.', envelope, uploadId, key, partNumber: N}` to the Lambda. The Lambda calls the **S3 UploadPart API via getSignedUrl** — this doesn't actually upload anything, it creates a presigned URL:

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

The traffic pattern: our Worker is contacted once (step 1, for the envelope). Our Lambda is contacted once per part for signing — 50 small JSON round-trips — but never touches file bytes. All 250 MB of data flows directly from the page to S3.

**Step 5: Tell Amazon to assemble the file.**
All 50 parts are uploaded. The page now sends the full array of ETags it accumulated to our Lambda, POSTing `{action: 'UploadComplete.', envelope, uploadId, key, parts: [...]}`. The Lambda calls the **S3 CompleteMultipartUpload API**:

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

```txt
hi claude, ok, interesting. so we need to save an array of all the etags, to be able to send back this complete list? for a really big file, like a hour of 4k video, how big is this? and we'll need to figure out where we keep this as we're going along, probably just in the memory of the page? or do we need ot persist this to supabase through the worker or something, i wonder

ok and let's say the page dies between steps 4 and 5. does the file disappear? is some fragment left?
```

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
- **Stale sessions.** The envelope expires, so a resumed upload would need a fresh envelope from the Worker. The uploadId itself doesn't expire (unless we add a lifecycle rule), but our Lambda checks the envelope on every call.

---

## Architecture Decisions

These are settled. Don't re-litigate.

- **Browser → Lambda direct** for uploads (not through Worker) — reduces round-trips
- **Single Lambda with action parameter** — one endpoint, less config
- **Multipart always** (`shouldUseMultipart: () => true`) — one code path for all file sizes
- **Envelope auth from start** — page gets envelope from Worker, includes in Lambda requests
- **S3 path format** — `uploads/${timestamp}.${tag}.${filename}` for now (later: hash-based)

**Flow:**
```
Browser → POST /upload (UploadCreate.) → Lambda → S3 CreateMultipartUpload → { uploadId, key }
Browser → POST /upload (UploadSign.) → Lambda → presigned URL
Browser → PUT to presigned URL → S3 → ETag
...repeat for each part...
Browser → POST /upload (UploadComplete.) → Lambda → S3 CompleteMultipartUpload → done
```

---

## User Stories

### Hash Demo

As a developer, I can drag a large file into UppyDemo and see the computed hashes displayed on the page. This validates that `hashStream()` from `icarus/level1.js` works in the browser with real files and shows progress during hashing. No backend needed. We'll use Uppy's `file-added` event to trigger hashing, calling `hashStream()` with `file.stream()` and the protocol constants (`hashProtocolPieces`, `hashProtocolTips`). The `onProgress` callback updates the UI as pieces complete. Need to figure out how to best display progress and final hashes (tipHash, pieceHash as base32) in the component.

### Simple Upload (backend ready, needs frontend wiring)

As a developer, I can drag a file into Uppy and have it land in the S3 bucket. **Backend complete:** Lambda deployed with all S3 operations, CORS configured, envelope auth enabled. **Next:** Wire UppyDemo.vue to call the Lambda using the Uppy configuration above.

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

