#!/usr/bin/env python3
"""
diffy — a readable git diff between two points in our commit history.

It's cold3-specific (it reads our wrapper-hash commit convention), so run it from the repo
root — as `diffy` (if aliased), `./diffy.py`, or `python3 diffy.py`. The diff prints to stdout,
so redirect or pipe it like git diff:

  diffy                  > diff.diff   # like `git diff`: the newest commit (HEAD) -> the working tree
  diffy Addr96           > diff.diff   # the Addr96 commit -> the working tree
  diffy Firs10 Seco20    > diff.diff   # one commit -> another

  diffy Addr96 . -skip wrapper md  > diff.diff   # also leave out files whose names match these terms

Both points default sensibly: omit the second for "the working tree", omit both for "HEAD to
the working tree". A '.' is the explicit way to say "the working tree".

Two things diffy does that plain git diff doesn't:
  1. it takes wrapper hashes, not shas — the first word of a commit's message (the label we
     stamp on most commits, e.g. Addr96, Crun39). diffy looks up the matching commit for you.
  2. it skips files by name. The skip list below always applies — pnpm-lock.yaml is tracked on
     purpose, but its diff is huge and machine-generated and never worth reading — and words
     after -skip add more, this run only.

A skip term can be as broad or as targeted as you like: it matches a file when it equals the
whole path, one path segment (a complete filename or directory name), or one whole word of the
name — words being the pieces between dots, dashes, and underscores, compared ignoring case.
So `-skip yaml` drops sem.yaml and pnpm-lock.yaml both, while `-skip pnpm-lock.yaml` drops only
the lockfile and lets sem.yaml through, and `-skip icarus/wrapper.js` names one exact file.
Whole words only: `-skip md` drops every .md file, including deleted ones, while namemd.js
shines through, because "md" is only part of that name. Plain terms mean nothing to quote and
nothing for the shell to expand — there are no glob patterns; name the words instead. The one
exception is the keep list: README.md is always part of the diff, even under `-skip md`,
because it's short, shows the wrapper hashes, and introduces the diff file, labeling what
changed from what.
"""
import sys, subprocess, difflib, re     # difflib powers the "did you mean" hint on a mistyped label; re splits names into words for skip matching

skip = ['pnpm-lock.yaml']                           # the always-on skips, spoken in the same terms as -skip; add more machine-generated noise here
keep = ['README.md']                                # never skipped, no matter what matches: README.md is short, shows the wrapper hashes, and sorts first, labeling the diff file with a nice what-to-what introduction

def git(*args):                                     # run git in the current dir (the cold3 root), or bail with its error
	r = subprocess.run(['git', *args], capture_output=True, text=True)
	if r.returncode != 0:
		sys.exit(f"diffy: git {args[0]} failed: {r.stderr.strip()}")
	return r.stdout

def find_commit(label):                             # wrapper hash -> commit sha
	seen = []
	for line in git('log', '--format=%H %s').splitlines():
		sha, _, subject = line.partition(' ')       # each line is "<sha> <subject>"
		words = subject.split()
		if not words:
			continue
		if words[0] == label:                       # the wrapper hash is the subject's first word
			return sha
		if len(words[0]) == 6 and words[0].isalnum() and not words[0].isalpha():
			seen.append(words[0])                   # collect label-shaped words (6 chars, letters+digits) to suggest
	near = difflib.get_close_matches(label, seen)   # a mistyped Addr69 -> Addr96
	hint = f" — did you mean {', '.join(near)}?" if near else ''
	sys.exit(f"diffy: no commit whose message starts with '{label}'{hint}")

def resolve(point):                                 # a CLI point -> a commit sha git can diff
	if point == 'HEAD':                             # the default 'from' when no args are given
		return git('rev-parse', 'HEAD').strip()
	return find_commit(point)                        # otherwise it's a wrapper hash

def path_terms(path):                               # everything a skip term can match: the whole path, each segment, and each segment's whole words
	terms = {path.lower()}
	for segment in path.lower().split('/'):         # a directory name or the filename
		terms.add(segment)
		terms.update(w for w in re.split(r'[._-]', segment) if w)  # and its words, split on dots, dashes, and underscores
	return terms

def main():
	args = sys.argv[1:]
	skips = list(skip)                              # every run starts with the always-on skips,
	if '-skip' in args:                             # and words after -skip join them, this run only
		i = args.index('-skip')
		skips += [s.lower() for s in args[i+1:]]
		args = args[:i]
		if len(skips) == len(skip):
			sys.exit("diffy: -skip needs one or more words after it")
	skips = list(dict.fromkeys(skips))              # dedupe, keeping order, so retyping a built-in doesn't double it in the status line
	if len(args) > 2:                               # fail fast on misuse; full usage is in the block up top
		sys.exit("diffy: [from-label] [to-label|.] [-skip word ...]")
	from_arg = args[0] if len(args) >= 1 else 'HEAD'  # default 'from' = the newest commit, like git diff
	to_arg   = args[1] if len(args) >= 2 else '.'      # default 'to'   = the working tree
	points = [resolve(from_arg)]                    # the shas git will diff: one for commit -> working tree, two for commit -> commit
	if to_arg == '.':
		to_desc = 'working tree'
	else:
		points.append(resolve(to_arg))
		to_desc = f"{to_arg} ({points[1][:10]})"
	names = git('diff', '--name-only', *points).splitlines()  # the diff's files first--new and deleted ones included, so skips reach those too
	dropped = [p for p in names if path_terms(p) & set(skips) and p not in keep]  # then match skip terms here, because git pathspecs can't match whole words; keep shines through every skip
	diff = git('diff', *points, '--', '.', *[f':(exclude){p}' for p in dropped])  # and exclude the matches by exact path
	sys.stdout.write(diff)                          # the diff -> stdout, so '>' or '|' can capture it
	skipped = ', '.join(p.split('/')[-1] for p in dropped) if dropped else 'nothing'  # just the filenames, of only the files that had changes to hide
	print(f"diffy: {from_arg} ({points[0][:10]}) -> {to_desc}; skipped {skipped}", file=sys.stderr)  # status -> stderr, never into the file

if __name__ == '__main__':
	main()
