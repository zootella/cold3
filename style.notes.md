# Style notes

A draft addendum to style.md, holding rules that belong in the guide but haven't been folded into it yet. Read it after style.md. Where the two overlap, style.md is the settled text and this is the working one.

## How much ink a comment gets

The normal comment is one line, at the end of the line it's about, and it should seldom wrap onto a second line in the editor and essentially never onto a third. Call it a hundred and twenty characters. That isn't a budget to spend up to; it's the width at which a comment still reads as a remark rather than a paragraph.

The technique that makes this possible is the one most writers miss. Don't try to carry the whole story on one line. Write the sentence down several lines, giving each part to the line it sits beside, so the story assembles as the reader descends the code:

	let rows5 = await trailGet(words, week)//how many codes this address has had in five days
	let rows1 = rows5.filter(recent)//and how many of those landed in the last one
	if (rows1.length >= limitHard) return refuse('CoolHard.')//too many; this is how an attacker spams a stranger

Each line says the part of the story that line is doing. None of them says all of it, and together they say more than one long comment could, because the reader meets each fact at the moment the code needs it.

Essays are the exception, not the escape hatch. Turn to one when line comments working together genuinely cannot carry the weight: an overall design, a mechanism running full stack, a set of choices and the reasons behind them. A long thought crammed onto a single line is not thoroughness, it's the wrong form, and no amount of tightening fixes it. If what you've written fills eight lines in the editor, it was an essay from the start.

## What all of it is for

Every rule about comments serves one thing: the reader's fastest path to correct understanding. Hold that in mind and most cases decide themselves.

There's a ravine on each side of the road.

On one side is code with too few comments. It's quick to read and slow to figure out. The reader reaches the bottom of a function having parsed every line and understood the system not at all, thinking: I wish there were a comment here to confirm what I suspect about how this works, or about why it was done this way.

On the other side is code replete with long, complex comments. It's just as inscrutable, and worse in a particular way, because the reader's instinct becomes: to understand this, I need to strip the comments out so I can see the code. When a reader wants to delete your comments in order to read your program, the comments have failed, however true they are.

Aim for the middle. It's genuinely difficult, it takes real attention and energy, and it isn't something to fix on a last pass. Write toward it in the first draft, then read once more as a stranger and ask whether any of it could be faster to understand than it is.
