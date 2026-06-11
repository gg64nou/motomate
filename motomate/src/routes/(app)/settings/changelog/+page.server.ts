import type { PageServerLoad } from './$types';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHANGELOG_URL = 'https://raw.githubusercontent.com/hawkinslabdev/motomate/main/CHANGELOG.md';
const TTL = 3_600_000;

let cache: { raw: string; at: number } | null = null;

function readAppVersion(): string {
	try {
		const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
		return tag.replace(/^v/, '');
	} catch {
		try {
			const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
			return pkg.version ?? '0.0.0';
		} catch {
			return '0.0.0';
		}
	}
}

export const load: PageServerLoad = async ({ url }) => {
	const currentVersion = readAppVersion();
	const refresh = url.searchParams.has('refresh');
	if (!refresh && cache && Date.now() - cache.at < TTL) {
		return { raw: cache.raw, currentVersion };
	}
	try {
		const res = await fetch(CHANGELOG_URL, { signal: AbortSignal.timeout(8000) });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const raw = await res.text();
		cache = { raw, at: Date.now() };
		return { raw, currentVersion };
	} catch {
		return { raw: cache?.raw ?? null, currentVersion };
	}
};
