#!/usr/bin/env python3
"""
diffy — a readable git diff between two points in our commit history.

It's cold3-specific (it reads our wrapper-hash commit convention), so run it from the repo
root — as `diffy` (if aliased), `./diffy.py`, or `python3 diffy.py`. The diff prints to stdout,
so redirect or pipe it like git diff:

  diffy                  > diff.diff   # like `git diff`: the newest commit (HEAD) -> the working tree
  diffy Addr96           > diff.diff   # the Addr96 commit -> the working tree
  diffy Firs10 Seco20    > diff.diff   # one commit -> another

Both points default sensibly: omit the second for "the working tree", omit both for "HEAD to
the working tree". A '.' is the explicit way to say "the working tree".

Two things diffy does that plain git diff doesn't:
  1. it takes wrapper hashes, not shas — the first word of a commit's message (the label we
     stamp on most commits, e.g. Addr96, Crun39). diffy looks up the matching commit for you.
  2. it skips pnpm-lock.yaml. we track the lockfile on purpose, but its diff is huge and
     machine-generated and never worth reading, so diffy leaves it out every time.

Add more filenames to EXCLUDE to drop other generated noise (wrapper.txt, sem.yaml, ...).
"""
import sys, subprocess, difflib     # difflib powers the "did you mean" hint on a mistyped label

EXCLUDE = ['pnpm-lock.yaml']                        # tracked on purpose, but machine-generated — skip it in diffs

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

def main():
	args = sys.argv[1:]
	if len(args) > 2:                               # fail fast on misuse; full usage is in the block up top
		sys.exit("diffy: [from-label] [to-label|.]")
	from_arg = args[0] if len(args) >= 1 else 'HEAD'  # default 'from' = the newest commit, like git diff
	to_arg   = args[1] if len(args) >= 2 else '.'      # default 'to'   = the working tree
	from_sha = resolve(from_arg)
	pathspecs = ['--', '.'] + [f':(exclude){name}' for name in EXCLUDE]  # everything, minus the excluded files
	if to_arg == '.':                               # '.' means "here" — diff against the working tree
		diff = git('diff', from_sha, *pathspecs)
		to_desc = 'working tree'
	else:                                           # a second point — commit to commit
		to_sha = resolve(to_arg)
		diff = git('diff', from_sha, to_sha, *pathspecs)
		to_desc = f"{to_arg} ({to_sha[:10]})"
	sys.stdout.write(diff)                          # the diff -> stdout, so '>' or '|' can capture it
	print(f"diffy: {from_arg} ({from_sha[:10]}) -> {to_desc}, minus {', '.join(EXCLUDE)}", file=sys.stderr)  # status -> stderr, never into the file

if __name__ == '__main__':
	main()
