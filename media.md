# Media Pipeline Documentation

## Current Status

**Delivery pipeline:** Working. CloudFront + S3 with signature verification. See `vhs.cjs`, `vhsSign()`.

**Upload pipeline:** Backend ready, needs frontend wiring.
- Upload Lambda deployed at `/upload` with 5 actions: `Create.`, `SignPart.`, `Complete.`, `Abort.`, `ListParts.`
- Envelope auth enabled (`openEnvelope('Net23Upload.', ...)`)
- Origin validation (`checkOriginValid()` - cold3.cc and localhost:3000)
- S3 bucket CORS configured (PUT, exposes ETag)

---

## Next Step: Wire UppyDemo.vue to Lambda

Add `@uppy/aws-s3` plugin to `site/components/snippet1/UppyDemo.vue` with multipart callbacks that POST to `/upload` Lambda.

**To implement, read:**
- `UppyDemo.vue` - current component state, how Uppy is initialized
- `upload.js` - Lambda expects `{action, envelope, ...params}`, see `uploadHandleBelow()` for each action's parameters
- `origin23()` from icarus - handles cloud/local URL switching

**Key points:**
- Use `shouldUseMultipart: () => true` - one code path for all file sizes
- Each callback POSTs to `${origin23()}/upload` with action: `Create.`, `SignPart.`, `Complete.`, `Abort.`, or `ListParts.`
- Must include `envelope` in every request (get from Worker via `sealEnvelope('Net23Upload.', ...)`)

**Then smoke test:** select file → Create. → SignPart. → PUT to S3 → Complete. → file appears in bucket.

---

## Key Files

| File | Purpose |
|------|---------|
| `net23/src/upload.js` | Upload Lambda: `uploadLambda`, `uploadLambdaOpen`, `uploadLambdaShut`, `uploadHandleBelow` |
| `net23/serverless.yml` | Infrastructure: S3, CloudFront, Lambda, IAM, CORS |
| `net23/persephone/persephone.js` | `bucketDynamicImport()`: S3 SDK loading |
| `net23/vhs.cjs` | CloudFront Function: delivery signature verification |
| `icarus/level2.js` | `checkForwardedSecure()`, `checkOriginValid()`, `openEnvelope()` |
| `icarus/level3.js` | `vhsSign()`: delivery signature creation |
| `icarus/level1.js` | `hashFile()`, `hashStream()`, `uppyDynamicImport()` |
| `site/components/snippet1/UppyDemo.vue` | Upload UI (wire to Lambda next) |
| `site/components/snippet1/VhsDemo.vue` | Delivery demo |

---

## Completed Steps

**Step 1: AWS SDK S3 Modules ✓** — Added packages to net23, created `bucketDynamicImport()` in persephone.js.

**Step 2: Upload Lambda ✓** — Created `upload.js` with 5 actions. Added serverless.yml config (function, IAM, CORS). Deployed.

**Step 2.5: Page-Direct Pattern ✓** — Can't use `doorLambda` (blocks pages). Created `uploadLambda`/`uploadLambdaOpen`/`uploadLambdaShut` with `checkOriginValid` (opposite of door's `checkOriginOmitted`). Envelope type: `'Net23Upload.'`.

---

## Architecture Decisions

These are settled. Don't re-litigate.

- **Browser → Lambda direct** for uploads (not through Worker) — reduces round-trips
- **Single Lambda with action parameter** — one endpoint, less config
- **Multipart always** (`shouldUseMultipart: () => true`) — one code path for all file sizes
- **Envelope auth from start** — page gets envelope from Worker, includes in Lambda requests
- **S3 key format** — `uploads/${timestamp}-${filename}` for now (later: hash-based)

**Flow:**
```
Browser → POST /upload (Create.) → Lambda → S3 CreateMultipartUpload → { uploadId, key }
Browser → POST /upload (SignPart.) → Lambda → presigned URL
Browser → PUT to presigned URL → S3 → ETag
...repeat for each part...
Browser → POST /upload (Complete.) → Lambda → S3 CompleteMultipartUpload → done
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

