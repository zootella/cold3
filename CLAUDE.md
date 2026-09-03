# cold3

README.md maps the workspaces and the commands that build, test, and deploy them.

## Read the style guide

@./style.md

The guide above governs everything written here: code, comments, and essays alike. Read it before writing any of them, rather than after a review catches something.

## Planning documents

Markdown documents at the monorepo root track current planning and effort. Each one holds a piece of work: what it is, what it has to decide, and what order the steps go in. Plan in one before writing code, and keep it true as the work lands.

If contents.md is present, read it first. It is the guide to the others and says what comes next.

## How we work

The work moves in a fixed order, and every turn sits at a known point in it: you code, the user seals and makes diff.diff, the two of you review that diff over several turns, and only after the review settles comes the commit. Only after the commit comes the smoke test, the deploy, or the database push.

### The coding turn

Plan in the relevant planning document first, then write the code. Run `pnpm test` after every turn that writes code; it runs the unit tests and then the grid tests against PGlite. If a test fails, investigate and fix it so the turn ends with the suite green, and report the result in a few words, "tests pass" or the like, with no counts or timings. The exception is something genuinely strange, or a question only the user can answer: then stop and explain what's going on. A small hiccup is not worth an extra turn.

### The review cycle

After you code, expect the user to run `git add -N .`, then seal, then make diff.diff. The user deliberately leaves out files that don't need review, so what diff.diff shows is the scope of the review, and what it leaves out is not. Then come several turns of the user asking questions and suggesting improvements, with more changes by both of you, followed by another seal, another diff.diff, and another review, until it settles down.

Through these turns, make small clear changes as you see them without asking: a typo, a comment that says something false, a nearby bug. List each in your recap so the review knows where to look, and ask first when you're unsure or the change is large. A real problem, like a variable referenced out of scope, gets fixed the turn you find it whatever diff.diff's scope says, and leads your report rather than trailing it.

### The commit

When the review has settled, it's often time to commit. Suggest it by saying so, with the pushpin emoji 📌 in your message and a few sentences of what the snapshot holds, but no commit message yet. There's a fork here: the user may have more questions or improvements and not commit. If the user agrees it's time to move forward, they ask you for a commit message. Reply with the pushpin again on its own line, followed by the suggested message in bold. Keep the message to code and functional changes, the machinery that changed, rather than comments or planning documents: comments are as important as style.md says, but the narrative a reader gets from a list of commit messages should be the code changing. One short line; the user prefixes the seal's sticker. The user will say when they've committed, and a follow-up question instead means they haven't. Confirm in git that the tree is newly clean before anything that needs a committed tree.

### The deploy and the database push

The user alone mutates git and ships: sem, seal, commit, push, and `pnpm cloud`. Read git freely, never write to it. When it's time to deploy to production, suggest it by saying so with the partly cloudy emoji ⛅ so it stands out, and as with commits, the user will say when they've deployed, or may have another question instead. You run `supabase db push` yourself, but only as the single step of a turn and only at the user's explicit go-ahead in that turn; a read-back query confirming what landed belongs to that same step, and dry runs are fine anytime.
