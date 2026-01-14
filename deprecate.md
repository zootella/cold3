# Deprecation Plan: name_table and browser_table

This document outlines the removal of the old `name_table` and `browser_table` systems, which have been replaced by `credential_table` with `Name.` and `Browser.` credential types.

---

## Safe to Delete (demo/unused)

### icarus/level3.js functions

| Lines | Item | Notes |
|-------|------|-------|
| 716-734 | `browser_table` schema | |
| 737-769 | `browser_get`, `browser_in`, `browser_out` | Internal functions |
| 1224-1248 | `name_table` schema | |
| 1250-1264 | `nameCheck()` | Exported |
| 1268-1296 | `name_get`, `name_set`, `name_delete` | Internal functions |
| 1610-1626 | `browserToUser()` | Exported, uses both old systems |
| 1633-1675 | `demonstrationSign*` (4 functions) | Exported |

### icarus/index.js exports to remove

- `nameCheck`
- `browserToUser`
- `demonstrationSignGet`
- `demonstrationSignUp`
- `demonstrationSignIn`
- `demonstrationSignOut`

### Front-end components

| File | Notes |
|------|-------|
| `site/components/credentials/SignUpSignInDemo.vue` | Header says "TO BE DELETED" |
| `site/components/pages/AuthenticateDemo.vue` | Uses old /api/authenticate |

### API endpoints

| File | Notes |
|------|-------|
| `site/server/api/authenticate.js` | Only used by AuthenticateDemo |
| `site/server/api/name.js` | Old nameCheck pattern |
| `site/server/api/password.js` | Nothing uses this - dead code |

### Page edits

| File | Change |
|------|--------|
| `site/pages/page1.vue` | Remove `<SignUpSignInDemo />` |
| `site/pages/page4.vue` | Remove `<AuthenticateDemo />` |

### Pinia stores

None to delete - all stores use the new credential system.

---

## Needs Migration (actively used by core site)

These use `browserToUser` but are NOT demos:

| File | Used By | Action Needed |
|------|---------|---------------|
| `site/server/api/load.js` | `mainStore.js` on every page load | Replace `browserToUser` with `credentialBrowserGet` + `credentialNameGet` |
| `site/server/api/report.js` | `mainStore.js` Hello, `Error2Page.vue` | Same migration |

---

## Decision Needed (demo but self-contained)

| File | Used By | Options |
|------|---------|---------|
| `site/server/api/totp.js` | `TotpDemo.vue` (page4 only) | Delete if not using TOTP; or migrate if you want TOTP |
| `site/components/snippet1/TotpDemo.vue` | page4.vue | Delete with api/totp.js, or keep TotpDemo1.vue (client-only) |

---

## Behavior Differences to Note

### `level` field

`browser_table` has a `level` field that `credential_table` Browser. type doesn't have.

**Where it's used:** `/api/totp.js` checks `user.level >= 2`

**What it means:**
- 1 = provisional (started signup but not finished)
- 2 = normal signed-in user
- 3 = elevated permissions (sudo hour)

**Options:**
- Store level in `k2` field of Browser. credential
- Simplify: signed in = level 2, no provisional users

### `origin_text` field

`browser_table` tracks which domain a session originated from. `credential_table` Browser. type doesn't have this. Could add to `k2` if needed.

---

## Design Notes Worth Preserving

From `icarus/user.txt` (will be deleted with old system):

**Happy lazy path concept:**
> Don't force new users to verify email immediately. User can start using site with just email, verification only required on second device. This avoids friction while still enabling account recovery.

**Feature roadmap:**
> Future: user status messages, user hiding/unhiding, account closing. These build on the name/credential foundation.

---

## Summary Checklist

### Delete Files
- [ ] `site/server/api/authenticate.js`
- [ ] `site/server/api/name.js`
- [ ] `site/server/api/password.js`
- [ ] `site/components/pages/AuthenticateDemo.vue`
- [ ] `site/components/credentials/SignUpSignInDemo.vue`

### Edit Files
- [ ] `site/pages/page1.vue` - remove `<SignUpSignInDemo />`
- [ ] `site/pages/page4.vue` - remove `<AuthenticateDemo />`
- [ ] `icarus/index.js` - remove 6 exports
- [ ] `icarus/level3.js` - remove ~150 lines of functions/schema

### Migrate Before Deleting browserToUser
- [ ] `site/server/api/load.js`
- [ ] `site/server/api/report.js`

### Decision Needed
- [ ] `site/server/api/totp.js`
- [ ] `site/components/snippet1/TotpDemo.vue`
