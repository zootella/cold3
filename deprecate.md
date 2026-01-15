
# Deprecation Plan: name_table and browser_table

This document outlines the removal of the old `name_table` and `browser_table` systems, which have been replaced by `credential_table` with `Name.` and `Browser.` credential types.

---

## Migration Complete

All refactoring is done. The old systems are now fully disconnected from active code.

### Migrations Completed
- [x] `site/components/snippet1/HelloComponent.vue` - migrated from `mainStore.user` to `credentialStore`
- [x] `site/server/api/load.js` - removed `browserToUser`, now only returns `codes`
- [x] `site/server/api/report.js` - swapped `browserToUser` → `credentialBrowserGet`
- [x] `site/server/api/totp.js` - swapped `browserToUser` → `credentialBrowserGet`, simplified level checks
- [x] `site/stores/mainStore.js` - removed `user` ref (moved to credentialStore)
- [x] `icarus/level3.js:codeSend` - swapped `demonstrationSignGet` → `credentialBrowserGet`

---

## Ready for Mass Deletion

### Files to DELETE entirely

| File | Notes |
|------|-------|
| `site/server/api/authenticate.js` | Only used by AuthenticateDemo |
| `site/server/api/name.js` | Old nameCheck pattern |
| `site/server/api/password.js` | Dead code - nothing uses this |
| `site/components/pages/AuthenticateDemo.vue` | Uses old /api/authenticate |
| `site/components/credentials/SignUpSignInDemo.vue` | Header says "TO BE DELETED" |

### Lines to REMOVE from page files

| File | Change |
|------|--------|
| `site/pages/page1.vue` | Remove `<SignUpSignInDemo />` |
| `site/pages/page4.vue` | Remove `<AuthenticateDemo />` |

### icarus/index.js - exports to remove

Remove these 6 exports:
- `nameCheck`
- `browserToUser`
- `demonstrationSignGet`
- `demonstrationSignUp`
- `demonstrationSignIn`
- `demonstrationSignOut`

### icarus/level3.js - functions and schemas to remove

**browser_table section (lines ~693-769):**
- `browser_table` SQL schema block (including comment block above it)
- `browser_get`
- `browser_in`
- `browser_out`

**name_table section (lines ~1214-1296):**
- `name_table` SQL schema block (including ttd comment above it)
- `nameCheck`
- `name_get`
- `name_set`
- `name_delete`

**browserToUser and demonstration functions (lines ~1609-1675):**
- `browserToUser`
- `demonstrationSignGet`
- `demonstrationSignUp`
- `demonstrationSignIn`
- `demonstrationSignOut`

**Note:** These are in 3 separate sections of level3.js, not contiguous.

---

## Optional Cleanup (stale txt files)

These contain old notes/examples referencing deprecated code:

- `site/server/api/report.txt`
- `site/components/small/postbutton.txt`
- `icarus/user.txt` - design notes (key concepts preserved below)
- `icarus/code.txt` - has one reference to browser_table
- `icarus/tables2.txt` - has references to browserToUser and browser_table

---

## Design Notes Preserved

From `icarus/user.txt` (can be deleted after noting these):

**Happy lazy path concept:**
> Don't force new users to verify email immediately. User can start using site with just email, verification only required on second device. This avoids friction while still enabling account recovery.

**Feature roadmap:**
> Future: user status messages, user hiding/unhiding, account closing. These build on the name/credential foundation.

**Behavior change - `level` field:**
> `browser_table` had levels (1=provisional, 2=normal, 3=elevated). The credential system simplifies this: signed in or not. Elevated permissions (sudo hour) can be added later if needed.

---

## Summary Checklist

### Delete Files
- [ ] `site/server/api/authenticate.js`
- [ ] `site/server/api/name.js`
- [ ] `site/server/api/password.js`
- [ ] `site/components/pages/AuthenticateDemo.vue`
- [ ] `site/components/credentials/SignUpSignInDemo.vue`

### Edit Page Files
- [ ] `site/pages/page1.vue` - remove `<SignUpSignInDemo />`
- [ ] `site/pages/page4.vue` - remove `<AuthenticateDemo />`

### Edit icarus/index.js
Remove these exports:
- [ ] `nameCheck`
- [ ] `browserToUser`
- [ ] `demonstrationSignGet`
- [ ] `demonstrationSignUp`
- [ ] `demonstrationSignIn`
- [ ] `demonstrationSignOut`

### Edit icarus/level3.js
Remove these functions/schemas:
- [ ] `browser_table` SQL schema
- [ ] `browser_get`
- [ ] `browser_in`
- [ ] `browser_out`
- [ ] `name_table` SQL schema
- [ ] `nameCheck`
- [ ] `name_get`
- [ ] `name_set`
- [ ] `name_delete`
- [ ] `browserToUser`
- [ ] `demonstrationSignGet`
- [ ] `demonstrationSignUp`
- [ ] `demonstrationSignIn`
- [ ] `demonstrationSignOut`

### Optional Cleanup
- [ ] `site/server/api/report.txt`
- [ ] `site/components/small/postbutton.txt`
- [ ] `icarus/user.txt`
- [ ] `icarus/code.txt` (or just remove browser_table reference)
- [ ] `icarus/tables2.txt` (or just remove browserToUser/browser_table references)
