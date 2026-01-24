# Notes Document Review Process

We're going through older planning and brainstorming documents, adding section headers to categorize content, and deciding what to keep versus delete.

## The Three Categories

- 🟢 **KEEP** — Good documentation, brainstorming, or future feature ideas worth preserving
- 🟡 **REVIEW** — Uncertain; requires more attention to decide
- 🔴 **IMPLEMENTED** — Already reflected in code, comments, and tests; safe to delete

## Header Format

Each section gets a visible ASCII border with the emoji verdict, a short title, and a paragraph summary describing what the notes contain and their "feel" (brainstorming, design doc, stream of consciousness, etc.):

```
================================================================================
🔴 IMPLEMENTED — Short title describing the section

A paragraph summary explaining what these notes are about, what kind of thinking
they represent (brainstorming, design decisions, implementation plans, etc.),
and why they fall into this category. The summary stays inside the === borders
so it's clearly separate from the original notes below.
================================================================================

original notes content here...
```

## Review Process

1. Read the notes document
2. Check the actual implementation (code, comments, tests) to see what's been built
3. Identify natural section breaks (whitespace gaps, topic changes)
4. Add headers with verdicts and summaries
5. For 🔴 sections: verify the implementation truly captures the intent before deleting
6. For 🟢 sections: these survive as valuable reference material
7. For 🟡 sections: flag for human review

## Documents Reviewed

- **totp.md, wallet.md** — Deleted (envelope pattern now understood from code)
- **otp.md** — Deleted (moved credential_table note to today.md step 7)
- **plan.md** — Deleted (implementation complete, questions answered)
- **code.md** — Deleted (constraint stories covered by tests)
- **code.txt, code2.txt** — Headers added, awaiting cleanup
- **build.txt** — Headers added, mostly obsolete (old build systems replaced by build.js)

## Key Principle

The code is now the documentation. Planning documents served their purpose during development but become stale and potentially misleading once implementation is complete. When in doubt, check what the code actually does.
