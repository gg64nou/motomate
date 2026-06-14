import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import pt from './locales/pt.json';
import ro from './locales/ro.json';

export const locales = { en, de, fr, es, it, nl, pt, ro };
export const supportedLocales = Object.keys(locales) as (keyof typeof locales)[];

export function getLocale<T>(map: Record<string, T>, locale: string): T {
	return map[locale in map ? locale : 'en'];
}
