# Media Pipeline Documentation

## Current Status

**Delivery pipeline:** Working. CloudFront + S3 with signature verification. See `vhs.cjs`, `vhsSign()`.

**Upload pipeline:** Working with end-to-end hashing. Smoke tested local and deployed.
- Page hashes file before upload (tipHash + pieceHash)
- Lambda hashes file after upload lands in S3
- Hashes compared to verify integrity
- Password-protected via PBKDF2 hash check

---

## Key Files

- **Upload Lambda:** `net23/src/upload.js` — 6 actions: `UploadCreate.`, `UploadSign.`, `UploadComplete.`, `UploadAbort.`, `UploadList.`, `UploadHash.`
- **Worker endpoint:** `site/server/api/media.js` — `MediaDeliverySign.`, `MediaUploadPermission.`, `MediaUploadHash.`
- **Frontend:** `site/components/snippet1/UppyDemo.vue` — Uppy Dashboard with `@uppy/aws-s3` multipart callbacks
- **Infrastructure:** `net23/serverless.yml`, `net23/persephone/persephone.js`, `net23/vhs.cjs`
- **Hashing:** `icarus/level1.js` — `hashFile()`, `hashStream()`, `uppyDynamicImport()`

---

## Architecture Decisions

These are settled. Don't re-litigate.

- **Browser → Lambda direct** for uploads (not through Worker) — reduces round-trips
- **Single Lambda with action parameter** — one endpoint, less config
- **Multipart always** (`shouldUseMultipart: () => true`) — one code path for all file sizes
- **Envelope-based auth** — page gets permission envelope from Worker, includes in Lambda requests
- **S3 path format** — `upload/<tag>` during upload phase (content-addressable by pieceHash later)
- **Vanilla JS for Uppy** — not `@uppy/vue`, because dynamic import conflicts with Vue's prop-based mounting
- **Tag for upload identity** — Lambda generates unique tag, embeds in S3 key, verifies on hash request

---

## How Upload + Hashing Works

High-level flow:

1. **Permission:** Page gets `permissionEnvelope` from Worker (password-gated)
2. **Hash before upload:** Page computes tipHash (fast, random access) and pieceHash (streams whole file)
3. **Report to Worker:** Page sends hashes to Worker (for future duplicate detection)
4. **Upload:** Uppy multipart upload via presigned URLs (bytes flow directly to S3)
5. **Hash after upload:** Lambda reads file from S3, computes both hashes, seals in `hashEnvelope`
6. **Report to Worker:** Page sends Lambda's sealed envelope (trusted attestation of what landed in bucket)
7. **Verify:** Page compares its hashes to Lambda's hashes

The `hashEnvelope` is critical: it's sealed by the Lambda (trusted), so the Worker can trust the hashes inside it. The page's self-reported hashes could be lies; the envelope cannot.

---

## Tag's Tale

How the upload tag flows through the system (prevents path collisions and spoofing):

1. **Lambda generates** (`UploadCreate.`) — creates unique tag, embeds in S3 key `upload/<tag>`, returns both
2. **Page stores** — saves tag in upload object for later use
3. **Lambda verifies** (`UploadHash.`) — page sends tag back, Lambda verifies it matches the key before sealing in envelope
4. **Worker receives** — trusted tag arrives in sealed envelope

---

## Multipart Upload Flow

How S3 multipart upload works (for reference, not implementation detail):

1. `CreateMultipartUpload` — "I'm going to upload a file here, give me a session ID"
2. `getSignedUrl(UploadPartCommand)` — "Give me a presigned URL so the page can PUT part N directly"
3. Page PUTs bytes directly to S3 — actual file data flows browser → S3, bypassing Lambda
4. `CompleteMultipartUpload` — "All parts uploaded, here are the ETags, assemble the file"

Also available: `AbortMultipartUpload` (cleanup), `ListParts` (resume support).

---

## Future: Resume After Page Refresh

Not implemented yet. Infrastructure is in place (`UploadList.` action, Uppy's `listParts` callback). Would need to persist `{uploadId, key}` to localStorage.

**Concerns:**
- **Duplicate tabs** — need coordination (locks or BroadcastChannel)
- **Orphaned parts** — S3 lifecycle rules can auto-expire incomplete uploads
- **Stale permission envelope** — resumed upload needs fresh envelope from Worker

---

## Future: Content-Addressable Storage

Eventual goal: files stored by pieceHash, not by tag.

- During upload: file lands at `upload/<tag>` (temporary)
- After verification: file moves to `hash/<pieceHash>` (permanent, content-addressable)
- Worker DB tracks metadata (filename, size, user, timestamp) separately

This enables natural deduplication: uploading identical content targets same location.

---

## Future: Upload Short-Circuit

If Worker detects pieceHash already exists in bucket, skip upload entirely. Instant success, zero bytes transferred. Current code has placeholder for `UploadDuplicate.` response.

---

## Future: Parallel Hashing

Currently hashing is sequential (tipHash, then pieceHash, then upload). Could optimize:
- Start pieceHash when file added, run in background during upload
- Only await pieceHash in `upload-success` before verification

---

## Future: Mobile Skip

Mobile devices could skip pieceHash entirely (CPU/battery concerns). Use tipHash only for duplicate detection; Lambda still computes both for verification.

---

## Lambda Timeout Constraint

API Gateway has 29-second hard timeout. Lambda timeout is 25 seconds. `UploadHash.` must stream and hash file within this limit — roughly 5-10GB max depending on throughput.

**Options to explore:**
- Lambda Function URLs (bypass API Gateway, up to 15-minute timeout)
- Response streaming for progress
- Accept limit and flag large files as "unverified"

---

## Open Questions

- What happens on hash mismatch? Delete? Quarantine? Alert?
- How to check existence quickly for short-circuit? HeadObject? Hash index?
- Should all page↔Lambda go through Function URLs instead of API Gateway?

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

Working. Browser requests signed URL from server (`vhsSign()`), fetches from `vhs.net23.cc`. CloudFront Function validates HMAC signature, expiration, referer, path scope.

## Reference: Hashing (Fuji Protocol)

In `icarus/level1.js`. `hashFile()` for quick tipHash via random access slicing. `hashStream()` for full pieceHash via streaming. Works in browser and Lambda.
