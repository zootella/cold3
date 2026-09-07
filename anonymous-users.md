# Anonymous users

A person at a browser who has done something worth remembering and has no account. They starred a post, followed a creator, saved something to find again. They may come back tomorrow on the same browser, or next week on a different one, or sign in to an account they made last year and forgot to mention. This document is planning at the product level: the opportunity these people represent, why serving them well is hard, the choices of mechanism, and the questions still open. Nothing here is built. first-night-accounts.md holds the next step, which credential types turn an anonymous user into an account holder and how those first-night accounts stay safe; this document is about everything that happens before a credential enters the picture, and about what happens to that state when one does.

## The opportunity

Amazon solved the visible half of this in the nineties and trained everyone to expect it. Arrive at a browser where you aren't signed in, put a few things in the cart, and when you sign in at checkout the cart you filled combines with the one your account already held. No one is asked to make an account before they are allowed to want something. The account comes at the moment it is worth having, and nothing done before that moment is lost.

Most of the web does the opposite with the actions that matter most to it. A visitor sees a star, a like, a follow, a bookmark, a comment box, and reasonably expects the button to do the thing. Instead it is a trigger for a sign-up wall. The visitor came to do one small thing, was told to do a large thing first, and leaves. The site had a chance to gain a user with one click and instead gained someone who holds a small grudge against the brand, and may remember it the next time they see the name. That is the exact opposite of what the button was for.

The opportunity is the front door: the button works, the first time, with one click, and the account is offered later, softly, when it is worth something to the person, like seeing the same stars on their phone. A person who has three creators followed and a dozen posts saved is a person with a reason to make an account, and the flows in first-night-accounts.md are built for the one finger they have free at that moment. Get the anonymous stage right and the sign-up stage is easy; get it wrong and there is no sign-up stage.

## Why it is hard: the merge

Merging carts is easy because a cart is a bag of quantities. Dump one bag into the other and nobody minds an extra item. Stars and follows are relationships, a person's set of pointers at things, and combining two sets raises questions a cart never had to answer.

**The union case is fine.** Alice, an existing user, sits at a new browser, stars three posts without signing in, then signs in, and one of the three was already starred on her account. A star twice is a star. Follows and bookmarks are the same: union, idempotent, safe. This is the case the cart merge covers, and it is the common one.

**There is no negative case, and that is worth saying.** An anonymous identity that never starred something cannot unstar it, so the merge only ever adds. Nothing done anonymously can remove anything from the account. That keeps the merge from ever being destructive, which is the property that makes doing it silently thinkable at all.

**Utterances are not relationships.** A comment or a post merged into an account attributes speech to a person. If the anonymous comment was written by whoever was at the browser before, the merge puts words in Alice's mouth. So the merge rule has to be per kind of thing: relationships union, utterances never merge without the person seeing and accepting each one, or simply are not offered anonymously at all.

**The browser is not a person.** This is the hard one, and it is the kitchen-hallway computer again. Anonymous state belongs to a browser, and a browser can be several people. Merge silently on sign-in, the way a cart does, and Alice inherits her roommate's stars, or a stranger's at a library. Amazon accepts this because a household cart is fine and a stray item is harmless. Our stars are personal in a way a cart isn't: a follow says something about a person. The choice is between merging silently, asking, and discarding, and the honest default is probably to ask whenever there is anything to merge and to make discarding one tap.

**Exactly once, and then retired.** Whichever way the merge goes, it happens once. After it, the anonymous identity is finished, and the browser's next anonymous action, after a sign-out, starts a new one. Nothing from the account leaks into that new identity, which is the reverse direction of the same rule: signing out at a browser leaves the next person at it with a clean start.

**Two directions, one of them easy.** A stranger who accumulates anonymous state and then signs up moves nothing: the identity that held the stars becomes the account. An existing user who accumulates anonymous state on a fresh browser and then signs in is the merge, two identities that have to become one. The mechanism choice below is largely about making the easy direction easy without making the hard direction worse.

## Why it is hard: the shadow class

Serving anonymous users means holding data for people who have never agreed to anything and whom we cannot authenticate. That is a class of identity the security model has to name and bound.

**The only anchor is a bearer token.** The browserTag cookie is the whole tie between an anonymous identity and a person. Nothing recovers it. Clearing cookies, or a browser's own housekeeping, ends the identity, and that has to be an acceptable deal: we remember while your browser does. An anonymous user who wants more than that is the person first-night-accounts.md is for.

**Free to create is free to abuse.** Anything a stranger can create at no cost is a bot's playground. Anonymous state has to be cheap to hold, throttled at the browser the way sends already are, and worthless to accumulate: an anonymous star should carry no weight in the counts shown to other people, or a discounted weight, until the identity is real. Otherwise the star button is a vote-stuffing tool with no sign-up required.

**Retention is a promise we have to keep.** Rows about people who never signed up should not live forever. Anonymous identities expire after some period of inactivity and their rows go, which is the ordinary deletion data-plan.md now allows, and the first place it will run at scale. The period is a product decision: long enough that a person who comes back next month finds their stars, short enough that the table is not a graveyard of one-click visitors.

**The merge is a privilege escalation.** It is the moment anonymous rows become an authenticated user's rows, and it is the attack surface. The roommate stars and follows things as anonymous at the shared computer, Alice signs in, and now Alice follows his picks. With relationships only, that is embarrassment, not harm, and asking before merging removes even that. With utterances it would be real harm, which is why they are excluded above. And an anonymous identity must never be able to learn anything about accounts: an anonymous action on a private thing, or one that answers differently for an existing account, would be an enumeration oracle, the same discipline the Held. outcome keeps elsewhere.

## Where the state lives: three candidates

The mechanism is not chosen, and the choice is the reason the brownie has not yet been removed. All three carry the merge questions above unchanged; they differ in where the shadow class lives and who can see it.

**An early userTag.** credential.md's proposal: mint a tag at the first anonymous action, write a Browser. row tying it to the browser, and store stars and follows as ordinary rows under it. Sign-up is the tag acquiring credentials, and nothing moves. Sign-in to an existing account is the merge, two tags reconciled once. What it buys: one model of a person for the whole system, every flow function already takes a userTag, the server render sees the stars on first paint, and expiry is a query we run. What it costs: a userTag stops meaning a user and starts meaning an identity we are tracking, the table gains a tag for every stranger who clicked once, the Browser. row's meaning of signed-in has to stretch to cover an identity that never proved anything, and the cleanup regime is ours to build and run.

**Browser-keyed rows.** Store anonymous state keyed by the browserHash alone, with no tag until sign-up mints one and re-keys the rows. What it buys: no shadow tags in the table. What it costs: two shapes for the same fact, rows by browser and rows by user, and every reader of stars has two paths. The merge is unchanged.

**Client-held sealed state, the brownie's shape.** Stars and follows ride as notes in a sealed letter in the browser's storage, and no row exists until sign-up or sign-in, when the page sends the letter up and the server writes rows under the real tag. What it buys: no shadow class in the database at all, abuse bounded by the client's own storage rather than our table, retention the browser's problem rather than ours, and a binding to the browser that is, for once, exactly right, since anonymous state is the browser's. What it costs: the server render cannot see it, so anonymous stars paint a beat after hydration, the same beat the credential flows just shed; a person whose browser clears storage loses everything, the same as losing the cookie; and the merge is not avoided, only deferred to the moment the letter comes up.

The honest comparison is that the first and third candidates differ in where the shadow lives, in the database or in the browser, and everything else is the same problem. In the database it is visible to us, queryable, expirable on our schedule, and painted on first paint, at the cost of shadow tags and a cleanup regime. In the browser it is invisible to us until the person signs in, costs us nothing to hold, and never needs cleaning up, at the cost of first paint and of trusting client storage with the only copy. Which of those trades we want is the decision, and it is a product decision as much as an engineering one.

## How the well-built platforms do it

The mature pattern, the one the platforms that handle this well converged on, is that the anonymous person gets a real identity record, made lazily at the first action worth remembering, with no credentials on it. Not a special shadow table and not a different kind of key. Firebase Auth has offered this for years as anonymous sign-in: the app mints an ordinary user id with no credentials, and the documented path is to link a credential to that same id later, which upgrades the account in place. Supabase Auth added the same thing in 2024, an ordinary user row with an is_anonymous flag, converted by adding an email, phone, or oauth identity, with the guidance to delete anonymous users on a schedule after a quiet period. Discord went furthest: an unclaimed account is a full account with no email, a banner nags the person to claim it, and logging out loses it, which they warn about. Amazon's guest cart is the same idea in older words, a visitor id the cart hangs on and a merge at sign-in.

So a userTag for someone who can't sign in is not the contradiction it looks like. An anonymous person signs in the only way an anonymous person can, by being at the browser that holds the cookie, which is the Browser. row doing what it does today. What they can't do is come back from another device, and that is the definition of anonymous rather than a defect. The upgrade direction, adding a credential to the tag already in use, is the common one and moves nothing, and every one of those systems handles it that way.

What none of them solve for the app is the collision. Firebase's documentation says it plainly: if the credential being linked already belongs to another account, linking fails, and merging the two accounts' data is the app's problem. That is the merge above, and the well-built products split it by the kind of data:

- Things that union, like stars and follows, merge silently or with a one-line notice. Amazon's cart.
- Things that can't union, like a game's progress, get asked: keep this device's progress or the account's? That is how every console and mobile game links a guest account to an existing one.
- Things personal enough that merging would be a surprise get discarded. YouTube keeps signed-out watch history against a visitor cookie, server side, and does not merge it into the account at sign-in.

The client-held route is the one none of the large platforms take for anything but preferences. It fails the server render, it fails the second device, it loses everything when storage clears, and it does not make the merge go away, only delays it to the moment the letter comes up. It is what a product does when it does not want to hold the data at all, and for stars and follows we do want to hold it, because the point is that they are there tomorrow.

**The recommendation, September 2026.** The early identity record, which is what credential.md proposed and what the flow functions already fit, with four things beside it that the good implementations all have: a plain way to tell an anonymous tag from a real one, which today is a Browser. row and nothing proven; an expiry job that deletes anonymous tags after a quiet period, the first real use of data-plan.md's ordinary deletion; a merge policy per kind, union for relationships and nothing for utterances; and the ask at a browser that has been someone else's. None of that needs the brownie, and the platforms that got this right did not need one either. The uncertainty that remains is about the merge and the housekeeping, which are real work but not a mechanism choice. The decision is not yet taken, and until it is the brownie stays in the code, empty and running, as the third candidate.

## What anonymous users may do

A short list, and a ladder that continues in first-night-accounts.md: star, follow, and bookmark, yes, as relationships that union safely. Comment, no, or held unpublished until an account exists. Post, no. Preferences like a theme, yes, and those are the browser's anyway. Anything with money or content behind it waits for a real account and the credentials that make it one.

## Open questions

- Merge policy per kind of thing: union silently, ask, or discard, and whether the answer differs for a browser that has been signed in before.
- The shared browser: whether sign-in at a browser holding anonymous state asks, and what the ask looks like in one screen.
- Where the state lives, among the three candidates above, which decides the brownie's future.
- How long an anonymous identity lives without activity, and what deletes it.
- What weight anonymous actions carry in public counts, if any.
- What sign-out does at a browser with anonymous history: a clean start for the next person, and what happens to the state the signed-in user made while signed in.
- How the sign-up offer is presented once there is something worth saving: never a wall, and never the same prompt twice.
- Whether a person can see and delete their own anonymous state before ever signing up, and how, given that the cookie is the only key.
