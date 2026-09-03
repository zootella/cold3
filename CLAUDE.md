# cold3

README.md maps the workspaces and the commands that build, test, and deploy them.

## Read the style guide

@./style.md

The guide above governs everything written here: code, comments, and essays alike. Read it before writing any of them, rather than after a review catches something.

## Planning documents

Markdown documents at the monorepo root track current planning and effort. Each one holds a piece of work: what it is, what it has to decide, and what order the steps go in. Plan in one before writing code, and keep it true as the work lands.

If contents.md is present, read it first. It is the guide to the others and says what comes next.

## How we work

The work moves in a fixed order: you write the code, the user seals and builds diff.diff, the two of you review that diff together, and only after that comes the smoke test, the deploy, or the database push. What diff.diff includes, and what it leaves out, is the scope of the review.

Run `pnpm test` after you write code, every time, before you say the work is ready, and put what it said in your report. It runs the unit tests and then the grid tests against PGlite, so a shape mismatch surfaces here instead of at runtime, and a red suite is part of the report rather than a reason to hold it back.

The user alone mutates git and ships — sem, seal, commit, push, and `pnpm cloud`. Read git freely, never write to it, and propose when a commit makes sense rather than waiting to be asked. You run `supabase db push` yourself, but only as the single step of a turn and only at the user's explicit go-ahead in that turn; dry runs are fine anytime.
