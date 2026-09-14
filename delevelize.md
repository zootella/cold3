# delevelize

The plan for removing the query vocabulary from level2, so that level3's application functions call supabase-js directly, the way nearly every Supabase codebase does. This is a first draft: the idea, its scope, what it gains and loses, the tensions in it, what the work would involve, and what we still have to figure out. The granular decisions, which helpers survive, what a converted function looks like line by line, how the tests read rows back, get made in the code when we are there, not here. Nothing is built, and the change is not yet placed in data.md's order.

## The idea

level2 holds a family of query helpers, queryGet, queryHide, queryAddRow, and their siblings, and level3 reaches the database only through them. The user wrote them early, as a small checked vocabulary for making and testing database mutations by hand, and the rest of the data layer grew up around them. The proposal is to retire the vocabulary: a level3 function would get the database from the seam that already exists and run its own supabase-js chain, with the whole query visible at the line where it runs, which table, which filters, which order. The good parts of the layer survive in some smaller form, and everything else in level2 is untouched: the doors, the envelopes, the key system, the logging, the SQL registry, and getDatabase itself.

## Scope

The helpers, every call to them in level3, and every call to them in the grid tests, which use the helpers to read rows back after a flow. The counting and top-row helpers, the partial-unique insert that takes a duplicate as a quiet answer, and the two helpers the hideless sprint just added, all of it one family. Not in scope: the adapter in grid.js, which stays exactly as it is, and the tests themselves, which keep walking the same flows. Not in scope: the level2 and level3 split for everything that isn't a query; that layering stays as it is.

One fact bounds the risk, and it was checked before this was written. The grid adapter models the supabase-js builder, not the helpers: in simulation mode getDatabase hands back an object whose from() returns a fake builder, and the fake renders SQL for PGlite from whatever chain it is given. The helpers are ordinary callers of that builder, so a level3 function calling the builder directly is intercepted the same way. The tests survive the change by construction.

## Gains

Every query reads at sight, to the user, to the model, and to anyone who has used Supabase, with no helper to look up and no signature to remember. A new shape of read is written where it is needed instead of becoming a new helper, a new name, and a new argument about its parameters. Level3 functions stop fetching more than they need and filtering in JavaScript because the vocabulary couldn't say what they wanted. The layer stops being a second gate behind the first: every level3 function already checks its inputs at its top, and most of what the helpers re-check has been checked once already. And the codebase moves toward simple and standard, which is the direction the whole data sprint runs in.

## Losses

Three things the helpers do for free today have to be kept on purpose or given up knowingly. A wrong column name or a malformed cell fails loudly at the call, by the helpers' checks; without them a wrong column is still loud, since PostgREST refuses it, but a filter fed an undefined value renders as text, matches nothing, and returns an empty answer that looks real. Every insert takes its row_tag and row_tick the same way, from one place; without that, each insert fills its own margins and one of them will eventually forget. And every Supabase error reaches the top gate through one line; without it, each call writes its own check, and one of them will eventually be skipped. The hide filter the helpers apply everywhere is not a loss, since hideless removes it anyway.

There is also a cost already paid: the hideless sprint's first act added two helpers to this family, and the naming discussion about one of them was under way when this idea arrived.

## Tensions and trade-offs

**Uniformity against expressiveness.** A vocabulary makes every call look alike and constrains what a call can do. Direct chains can say anything the builder can say, at the price of every call being its own small decision. The style guide leans toward the plain standard thing, and the builder is that thing.

**The gate at the function's top against the gate in the helper.** The helpers' checks catch a bug that slipped past a function's own checks. Removing them trusts the function tops, which is the style guide's rule, defense at the trust boundary and not everywhere, but it makes the function-top checks the only line.

**The adapter as contract.** Today the adapter models only the slice the helpers use. Direct chains will reach for builder methods the adapter doesn't know, and each one fails the suite loudly until it is added. That is the right failure, but adding a method means reading PostgREST's rule for it first, because the fake renders its own SQL and a wrong rendering is a false pass that only a read-only query against the hosted database would catch.

**Timing against hideless.** hideless's credential type chapters rewrite every database call in level3, one type at a time. Do this first, and every chapter writes direct calls from the start. Do it after, and every function is rewritten twice. Fold it in, and each chapter converts its type's calls in the same pass that converts hiding to editing and deleting, at the cost of chapters that each do two things. The trivial migration composes with any of the three, since it only takes the hide filter out of whatever helpers remain.

## What the work would involve

Deciding the placement. Deciding what survives of the helpers' three gifts, and in what form. Converting level3 one function at a time, most naturally inside the hideless chapter that already has that function open, with the grid tests for that type proving the conversion. Converting the tests' own reads. Growing the adapter as direct chains reach methods it doesn't model. Retiring the helpers when the last caller is gone. Updating database-stack.md's paths from code to a table, and testing.md's description of what the adapter models.

## What we still need to figure out

- Its place in the order: folded into hideless's chapters, or a pass of its own before them.
- What form the three gifts take after, and whether all three are worth keeping.
- What the grid tests read rows back with once the helpers are gone.
- What the queryUpdate naming question becomes: if the helper leaves, the question leaves with it.
- Whether the one-off scripts path, which database-stack.md says uses the same helpers as the application, wants anything more than the builder.
