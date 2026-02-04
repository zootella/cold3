
import fs from 'fs'
import yaml from 'yaml'
import semver from 'semver'
import {
log, look, commas, takeNumerals, toss,
} from 'icarus'

// Note constants
const note_old_installed = 'Installed version 1+ year old 🕰️'
const note_stale_current = 'Current version 6+ months newer ⏰'
const note_major_available = 'Major new version available 🆕'

// Helper to format date as YYYY-MM-DD
function formatDate(isoString) {
	if (!isoString) return null
	return isoString.split('T')[0]
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
	let today = new Date().toISOString().split('T')[0]
	let downloadsData = new Map()
	for (let m of modules.values()) {
		let prev = previousData[m.name]?.downloads
		if (prev?.weekly != null && prev?.on) {
			let weekly = typeof prev.weekly === 'string' ? parseInt(takeNumerals(prev.weekly)) : prev.weekly
			downloadsData.set(m.name, {weekly, on: prev.on})
		}
	}

	// Build list of modules needing fetch: missing first, then stale (>1 month old)
	let oneMonthAgo = new Date()
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
	let oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0]

	let allNeedsFetch = [...modules.values()]
		.map(m => ({name: m.name, on: downloadsData.get(m.name)?.on || null}))
		.filter(m => !m.on || m.on < oneMonthAgoStr)
		.sort((a, b) => {
			if (!a.on && b.on) return -1
			if (a.on && !b.on) return 1
			if (!a.on && !b.on) return 0
			return a.on.localeCompare(b.on)
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
			m.installedDate = formatDate(npm.time[m.installed])
			m.currentDate = formatDate(npm.time[m.latestInRange])
			m.latestDate = formatDate(npm.time[m.latest])
			m.description = npm.description
			m.homepage = npm.homepage
		}
		m.downloads = downloadsData.get(m.name) || null
	}

	// Sort by package name
	let sorted = [...modules.values()].sort((a, b) => a.name.localeCompare(b.name))

	// Build output and collect summary data
	let output = {}
	let summary = {
		[note_old_installed]: [],
		[note_stale_current]: [],
		[note_major_available]: [],
	}

	for (let m of sorted) {
		let notes = []
		if (isMoreThan1YearOld(m.installedDate)) {
			notes.push(note_old_installed)
			summary[note_old_installed].push(m.name)
		}
		if (isMoreThan6MonthsNewer(m.installedDate, m.currentDate)) {
			notes.push(note_stale_current)
			summary[note_stale_current].push(m.name)
		}
		if (isMajorVersionHigher(m.installed, m.latest)) {
			notes.push(note_major_available)
			summary[note_major_available].push(m.name)
		}

		output[m.name] = {
			...(notes.length > 0 && {note: notes.join('; ')}),
			homepage: m.homepage || null,
			description: m.description || null,
			from: m.sources.length === 1 ? m.sources[0] : m.sources,
			versions: {
				declared: m.semver,
				installed: m.installed || 'NOT FOUND',
				current: m.latestInRange || 'NOT FOUND',
				latest: m.latest || 'NOT FOUND',
			},
			published: {
				installed: m.installedDate || null,
				current: m.currentDate || null,
				latest: m.latestDate || null,
			},
			downloads: m.downloads ? {weekly: commas(m.downloads.weekly), on: m.downloads.on} : {weekly: null, on: null},
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
			generated: new Date().toLocaleString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'}),
			...filteredSummary,
			downloads: downloadsByMagnitude,
		},
		modules: output,
	}

	fs.writeFileSync('sem.yaml', yaml.stringify(finalOutput, {lineWidth: 0}))
	log(`Wrote ${sorted.length} modules to sem.yaml`)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
