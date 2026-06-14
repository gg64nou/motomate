import { register, init, locale, _, waitLocale } from 'svelte-i18n';
import { browser } from '$app/environment';
import { supportedLocales } from './locales.js';

/* To add a locale: add JSON to locales/, register below, add to locales.ts */
register('en', () => import('./locales/en.json'));
register('de', () => import('./locales/de.json'));
register('fr', () => import('./locales/fr.json'));
register('it', () => import('./locales/it.json'));
register('es', () => import('./locales/es.json'));
register('nl', () => import('./locales/nl.json'));
register('pt', () => import('./locales/pt.json'));

function detectInitialLocale(): string {
	if (!browser) return 'en';
	const stored = localStorage.getItem('locale');
	if (stored && (supportedLocales as string[]).includes(stored)) return stored;
	return 'en';
}

init({
	fallbackLocale: 'en',
	initialLocale: detectInitialLocale()
});

export function setUserLocale(userLocale?: string) {
	if (userLocale) {
		locale.set(userLocale);
	}
}

export { locale, _, waitLocale };
