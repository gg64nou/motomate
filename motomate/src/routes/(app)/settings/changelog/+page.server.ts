import type { PageServerLoad } from './$types';

const CHANGELOG_URL = 'https://raw.githubusercontent.com/hawkinslabdev/motomate/main/CHANGELOG.md';
const TTL = 3_600_000;

let cache: { raw: string; at: number } | null = null;

export const load: PageServerLoad = async ({ url }) => {
	const refresh = url.searchParams.has('refresh');
	if (!refresh && cache && Date.now() - cache.at < TTL) {
		return { raw: cache.raw };
	}
	try {
		const res = await fetch(CHANGELOG_URL, { signal: AbortSignal.timeout(8000) });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const raw = await res.text();
		cache = { raw, at: Date.now() };
		return { raw };
	} catch {
		return { raw: cache?.raw ?? null };
	}
};
