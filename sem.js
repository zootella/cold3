
import fs from 'fs'
import yaml from 'yaml'
import semver from 'semver'
import {
log, look, commas, takeNumerals, toss, Now, sayWhenPage, sayDate, tickToText, textToTick, Time,
} from 'icarus'

/*
sem.js — version analysis for all workspaces in the monorepo
Reads every package.json and pnpm-lock.yaml, fetches live data from npm, writes sem.yaml.
Each module gets flagged with notes. Here's what they mean and what to do:

🕰️ Installed version 1+ year old
   Two very different situations with the same signal. A stable utility like is-mobile
   sitting at 5.0.0 for 16 months is probably done — fine. A dev tool like serverless-offline
   at 14.4.0 for 14 months is probably expiring — they've moved on. Look and decide which.

🏺 Declared release 1+ year earlier than installed
   The version in package.json is an archaeological artifact. You declared ^2.39.8 but you're
   running 2.94.1 — that old version will never appear again. Action: bump the declared version
   forward in package.json. Mechanical, low risk, just closing the gap. (ncu does this.)

⏰ Current version 6+ months newer
   There's a newer version within your declared semver range that you're not running. Your
   lockfile is holding you back. Action: upgrade-wash && install to resolve fresh.

🎁 Major new version available
   Breaking changes, intentional decision required. Some major bumps are trivial (dotenv 16→17),
   others are real work (wagmi 2→3, zod 3→4). Action: evaluate the changelog, test, upgrade.

🩸 Latest tag is behind installed
   You're on a version newer than what npm calls "latest" — typically because you installed from
   a @next or prerelease tag. They already made the version you're running; the question is
   whether they'll promote it to stable, or you're riding a prerelease channel indefinitely.
   Action: watch the project, decide if you're comfortable on that channel.

🐣 Pre-1.0 version installed
   No semver stability guarantee — minor versions can contain breaking changes. For some packages
   this is genuinely early (pglite 0.3.x), for others it's just convention (sharp 0.34.x, 35M
   weekly downloads, been pre-1.0 for a decade). Action: know that semver minor = breaking for
   these packages.

📌 Exact version pinned
   No caret or tilde — you won't get patches automatically. Usually intentional: matching a
   scaffold's known-good version, or avoiding a specific broken release. Action: check
   periodically whether the pin is still needed, especially after scaffolding updates.

🪦 Installed version marked deprecated on npm
   The maintainer is telling you to stop using this version. Action: look for the recommended
   replacement or upgrade path.
*/

// Note constants
const note_old_installed = '🕰️ Installed version 1+ year old'
const note_old_declared = '🏺 Declared release 1+ year earlier than installed'
const note_stale_current = '⏰ Current version 6+ months newer'
const note_major_available = '🎁 Major new version available'
const note_latest_behind = '🩸 Latest tag is behind installed'
const note_version_zero = '🐣 Pre-1.0 version installed'
const note_exact_pin = '📌 Exact version pinned'
const note_deprecated = '🪦 Installed version marked deprecated on npm'

// Helper to format version with publication date and age
function formatVersion(version, isoString, now) {
	if (!version) return 'not found'
	if (!isoString) return version
	let tick = new Date(isoString).getTime()
	let ageMonths = Math.round((now - tick) / Time.month)
	return `${version} on ${sayDate(tick)} ${ageMonths}m old`
}

// Helper to check if date2 is more than 6 months after date1
function isMoreThan6MonthsNewer(date1, date2) {
	if (!date1 || !date2) return false
	let d1 = new Date(date1)
	let d2 = new Date(date2)
	let sixMonthsLater = new Date(d1)
	sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
	return d2 > sixMonthsLater
}

// Helper to check if latest major version is higher than installed
function isMajorVersionHigher(installed, latest) {
	if (!installed || !latest) return false
	let installedMajor = semver.major(installed)
	let latestMajor = semver.major(latest)
	return latestMajor > installedMajor
}

// Helper to check if a date is more than 1 year old
function isMoreThan1YearOld(dateStr) {
	if (!dateStr) return false
	let d = new Date(dateStr)
	let oneYearAgo = new Date()
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
	return d < oneYearAgo
}

// Fetch version info from npm registry
async function fetchNpmVersions(name) {
	try {
		let response = await fetch(`https://registry.npmjs.org/${name}`)
		if (!response.ok) return null
		let data = await response.json()
		return {
			versions: Object.keys(data.versions),
			versionsData: data.versions,
			latest: data['dist-tags']?.latest,
			time: data.time || {},
			description: data.description || null,
			homepage: data.homepage || null,
		}
	} catch (e) {
		return null
	}
}

// Fetch weekly downloads from npm (with retry)
async function fetchDownloads(name, retries = 2) {
	try {
		let response = await fetch(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`, {
			headers: {'User-Agent': 'sem.js dependency checker'}
		})
		if (!response.ok) {
			if (retries > 0) {
				await new Promise(r => setTimeout(r, 500))
				return fetchDownloads(name, retries - 1)
			}
			return null
		}
		let data = await response.json()
		return data.downloads
	} catch (e) {
		if (retries > 0) {
			await new Promise(r => setTimeout(r, 500))
			return fetchDownloads(name, retries - 1)
		}
		return null
	}
}

async function main() {

	// Read existing sem.yaml to preserve download data
	let previousData = {}
	if (fs.existsSync('sem.yaml')) {
		try {
			let parsed = yaml.parse(fs.readFileSync('sem.yaml', 'utf8')) || {}
			previousData = parsed.modules || parsed.details || parsed
		} catch (e) {
			// ignore parse errors, start fresh
		}
	}

	// Read workspace list from pnpm-workspace.yaml
	let workspaceConfig = yaml.parse(fs.readFileSync('pnpm-workspace.yaml', 'utf8'))
	let workspaces = workspaceConfig.packages || []

	// Collect all package.json paths with their source names
	let sources = [
		{path: 'package.json', name: 'root'},
		...workspaces.map(w => ({path: `${w}/package.json`, name: w}))
	]

	// Map of "name" -> {semver, sources[]} to collect and detect conflicts
	let modules = new Map()
	for (let source of sources) {
		let pkg = JSON.parse(fs.readFileSync(source.path, 'utf8'))
		let deps = {...pkg.dependencies, ...pkg.devDependencies}
		for (let [name, ver] of Object.entries(deps)) {
			if (name === 'icarus') continue // skip workspace self-reference
			if (modules.has(name)) {
				let existing = modules.get(name)
				if (existing.semver !== ver) {
					toss(`Different declared semver for "${name}": ${existing.sources.join(', ')} want ${existing.semver} but ${source.name} wants ${ver}`)
				}
				existing.sources.push(source.name)
			} else {
				modules.set(name, {name, semver: ver, sources: [source.name]})
			}
		}
	}

	// Parse pnpm-lock.yaml to get installed versions
	let lockfile = yaml.parse(fs.readFileSync('pnpm-lock.yaml', 'utf8'))
	let versionMap = new Map()
	for (let [, data] of Object.entries(lockfile.importers || {})) {
		let allDeps = {...data.dependencies, ...data.devDependencies}
		for (let [name, info] of Object.entries(allDeps)) {
			if (info?.specifier && info?.version) {
				let key = `${name}:${info.specifier}`
				// Strip peer dep info: "1.2.3(peer@1.0.0)" → "1.2.3"
				let version = info.version.split('(')[0]
				versionMap.set(key, version)
			}
		}
	}

	function getInstalledVersion(name, semver) {
		return versionMap.get(`${name}:${semver}`) || null
	}

	for (let m of modules.values()) {
		m.installed = getInstalledVersion(m.name, m.semver)
	}

	// Fetch npm data for all packages in parallel
	log('Fetching version info from npm registry...')
	let npmData = new Map()
	await Promise.all([...modules.values()].map(async (m) => {
		let data = await fetchNpmVersions(m.name)
		if (data) npmData.set(m.name, data)
	}))

	// Preserve existing download data (parse commas-formatted numbers back to int)
	function parseOn(s) {
		if (!s) return null
		return textToTick(s)
	}
	let today = Now()
	let downloadsData = new Map()
	for (let m of modules.values()) {
		let prev = previousData[m.name]?.downloads
		if (prev?.weekly != null && prev?.on) {
			let weekly = typeof prev.weekly === 'string' ? parseInt(takeNumerals(prev.weekly)) : prev.weekly
			downloadsData.set(m.name, {weekly, on: parseOn(prev.on)})
		}
	}

	// Build list of modules needing fetch: missing first, then stale (>1 month old)
	let oneMonthAgo = Now() - Time.month

	let allNeedsFetch = [...modules.values()]
		.map(m => ({name: m.name, on: downloadsData.get(m.name)?.on || null}))
		.filter(m => !m.on || m.on < oneMonthAgo)
		.sort((a, b) => {
			if (!a.on && b.on) return -1
			if (a.on && !b.on) return 1
			if (!a.on && !b.on) return 0
			return a.on - b.on
		})

	let missing = allNeedsFetch.filter(m => !m.on).length
	let stale = allNeedsFetch.length - missing
	let toFetch = allNeedsFetch.slice(0, 20)

	if (toFetch.length > 0) {
		log(`Download counts: ${missing} missing, ${stale} stale; fetching ${toFetch.length} of ${allNeedsFetch.length}`)
		for (let {name} of toFetch) {
			let weekly = await fetchDownloads(name)
			if (weekly !== null) downloadsData.set(name, {weekly, on: today})
			await new Promise(r => setTimeout(r, 300))
		}
	} else {
		log(`Download counts: ${missing} missing, ${stale} stale`)
	}

	// Add npm version info to each module
	for (let m of modules.values()) {
		let npm = npmData.get(m.name)
		if (npm) {
			m.latestInRange = semver.maxSatisfying(npm.versions, m.semver)
			m.latest = npm.latest
			m.installedTime = npm.time[m.installed]
			m.currentTime = npm.time[m.latestInRange]
			m.latestTime = npm.time[m.latest]
			m.installedLine = formatVersion(m.installed, m.installedTime, today)
			m.currentLine = formatVersion(m.latestInRange, m.currentTime, today)
			m.latestLine = formatVersion(m.latest, m.latestTime, today)
			m.description = npm.description
			m.homepage = npm.homepage
			m.deprecated = npm.versionsData[m.installed]?.deprecated || null

			// Get the base version from declared semver to show when it was released
			let declaredBase = semver.minVersion(m.semver)
			if (declaredBase) {
				m.declaredTime = npm.time[declaredBase.version]
				if (m.declaredTime) {
					let tick = new Date(m.declaredTime).getTime()
					let ageMonths = Math.round((today - tick) / Time.month)
					m.declaredAge = `on ${sayDate(tick)} ${ageMonths}m old`
				} else {
					// Version specified in package.json doesn't exist on npm
					m.declaredAge = `⚠️ ${declaredBase.version} not found on npm`
				}
			}
		}
		m.downloads = downloadsData.get(m.name) || null
	}

	// Sort by package name
	let sorted = [...modules.values()].sort((a, b) => a.name.localeCompare(b.name))

	// Build output and collect summary data
	let output = {}
	let summary = {
		[note_old_installed]: [],
		[note_old_declared]: [],
		[note_stale_current]: [],
		[note_major_available]: [],
		[note_latest_behind]: [],
		[note_version_zero]: [],
		[note_exact_pin]: [],
		[note_deprecated]: [],
	}

	for (let m of sorted) {
		// Check if all versions are the same (before adding notes)
		let allSame = m.installedLine === m.currentLine && m.currentLine === m.latestLine

		// Build notes to append
		let installedNote = ''
		let currentNote = ''
		let latestNote = ''

		if (isMoreThan1YearOld(m.installedTime)) {
			installedNote += ' ' + note_old_installed
			summary[note_old_installed].push(m.name)
		}
		if (m.declaredTime && m.installedTime && !isMajorVersionHigher(m.installed, m.latest)) {
			// Check if declared is more than 1 year older than installed (and no major version jump)
			let declaredDate = new Date(m.declaredTime)
			let oneYearLater = new Date(declaredDate)
			oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
			if (new Date(m.installedTime) > oneYearLater) {
				summary[note_old_declared].push(m.name)
			}
		}
		if (m.installed && semver.major(m.installed) === 0) {
			installedNote += ' ' + note_version_zero
			summary[note_version_zero].push(m.name)
		}
		if (!m.semver.startsWith('^') && !m.semver.startsWith('~')) {
			installedNote += ' ' + note_exact_pin
			summary[note_exact_pin].push(m.name)
		}
		if (m.deprecated) {
			installedNote += ' ' + note_deprecated
			summary[note_deprecated].push(m.name)
		}
		if (isMoreThan6MonthsNewer(m.installedTime, m.currentTime)) {
			currentNote = ' ' + note_stale_current
			summary[note_stale_current].push(m.name)
		}
		if (isMajorVersionHigher(m.installed, m.latest)) {
			latestNote += ' ' + note_major_available
			summary[note_major_available].push(m.name)
		}
		if (m.installed && m.latest && semver.lt(m.latest, m.installed)) {
			latestNote += ' ' + note_latest_behind
			summary[note_latest_behind].push(m.name)
		}

		// Format declared with date if available and different from installed
		let declaredWithDate = m.declaredAge && m.installed !== semver.minVersion(m.semver)?.version
			? `${m.semver} ${m.declaredAge}`
			: m.semver

		output[m.name] = {
			homepage: m.homepage || null,
			description: m.description || null,
			from: m.sources.length === 1 ? m.sources[0] : m.sources,
			versions: allSame
			? { declared: declaredWithDate, installed: m.installedLine + installedNote + currentNote + latestNote }
			: { declared: declaredWithDate, installed: m.installedLine + installedNote, current: m.currentLine + currentNote, latest: m.latestLine + latestNote },
			downloads: m.downloads ? {weekly: commas(m.downloads.weekly), on: tickToText(m.downloads.on)} : {weekly: null, on: null},
		}
	}

	// Filter out empty summary categories
	let filteredSummary = {}
	for (let [key, mods] of Object.entries(summary)) {
		if (mods.length > 0) filteredSummary[key] = mods
	}

	// Build downloads summary grouped by magnitude
	let downloadsByMagnitude = {}
	sorted
		.filter(m => m.downloads?.weekly != null)
		.sort((a, b) => a.downloads.weekly - b.downloads.weekly)
		.forEach(m => {
			let digits = String(m.downloads.weekly).length
			let group = `${digits} figure`
			if (!downloadsByMagnitude[group]) downloadsByMagnitude[group] = {}
			downloadsByMagnitude[group][m.name] = commas(m.downloads.weekly)
		})

	let finalOutput = {
		summary: {
			generated: sayWhenPage(Now()),
			...filteredSummary,
			downloads: downloadsByMagnitude,
		},
		modules: output,
	}

	fs.writeFileSync('sem.yaml', yaml.stringify(finalOutput, {lineWidth: 0}))
	log(`Wrote ${sorted.length} modules to sem.yaml`)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
