import { env } from '$env/dynamic/public';
import type { LayoutServerLoad } from './$types';
import { supportedLocales } from '$lib/i18n/locales.js';

function localeFromAcceptLanguage(header: string | null): string {
	if (!header) return 'en';
	for (const entry of header.split(',')) {
		const code = entry.split(';')[0].trim().split('-')[0].toLowerCase();
		if ((supportedLocales as string[]).includes(code)) return code;
	}
	return 'en';
}

export const load: LayoutServerLoad = async ({ locals, request, cookies }) => {
	// In demo mode, authenticated users always get English regardless of what may be stored in DB.
	// The shared demo account must not carry over one visitor's browser locale to the next.
	if (env.PUBLIC_DEMO_ENABLED === 'true' && locals.user) {
		return { user: locals.user, locale: 'en' };
	}

	const locale =
		(locals.user as any)?.settings?.locale ??
		cookies.get('locale') ??
		localeFromAcceptLanguage(request.headers.get('accept-language'));

	return {
		user: locals.user,
		locale: (supportedLocales as string[]).includes(locale) ? locale : 'en'
	};
};
