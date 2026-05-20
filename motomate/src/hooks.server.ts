import { lucia } from '$lib/auth/index.js';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';
import { initScheduler } from '$lib/server/scheduler.js';

initScheduler();

let _demoSeeded = false;

function isOriginTrusted(origin: string | null, referer: string | null, url: string): boolean {
	const configuredOrigins = process.env.PUBLIC_APP_ORIGINS
		? process.env.PUBLIC_APP_ORIGINS.split(',')
		: [];

	const normalizedOrigin =
		origin === null || origin === 'null' || origin === 'undefined' ? null : origin;

	let requestOrigin: string | null = normalizedOrigin;

	if (!requestOrigin && referer) {
		try {
			requestOrigin = new URL(referer).origin;
		} catch {
			// ignore
		}
	}

	if (!requestOrigin && url) {
		try {
			requestOrigin = new URL(url).origin;
		} catch {
			// ignore
		}
	}

	if (requestOrigin) {
		for (const trusted of configuredOrigins) {
			try {
				const trustedOrigin = trusted.includes('://')
					? new URL(trusted).origin
					: `http://${trusted}`;
				const originUrl = new URL(requestOrigin);
				const trustedUrl = new URL(trustedOrigin);

				if (originUrl.hostname === trustedUrl.hostname) {
					return true;
				}
			} catch {
				// skip
			}
		}

		if (configuredOrigins.length > 0) {
			return false;
		}
	}

	return true;
}

function buildCorsHeaders(requestOrigin: string | null): Record<string, string> {
	const configuredOrigins = process.env.PUBLIC_APP_ORIGINS
		? process.env.PUBLIC_APP_ORIGINS.split(',')
		: [];
	const appUrl = env.PUBLIC_APP_URL ?? '';
	const appOrigins: string[] = [];
	if (appUrl) {
		try {
			appOrigins.push(new URL(appUrl).origin);
		} catch {
			// ignore
		}
	}
	const allOrigins = [...configuredOrigins, ...appOrigins];

	let allowedOrigin: string | null = null;
	if (requestOrigin) {
		for (const trusted of allOrigins) {
			try {
				const trustedUrl = new URL(trusted.includes('://') ? trusted : `http://${trusted}`);
				if (new URL(requestOrigin).hostname === trustedUrl.hostname) {
					allowedOrigin = requestOrigin;
					break;
				}
			} catch {
				// skip
			}
		}
	}
	if (!allowedOrigin) {
		allowedOrigin = allOrigins.length === 0 ? '*' : null;
	}

	const headers: Record<string, string> = {
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400'
	};
	if (allowedOrigin) {
		headers['Access-Control-Allow-Origin'] = allowedOrigin;
		headers['Access-Control-Allow-Credentials'] = 'true';
	}
	return headers;
}

export const handle: Handle = async ({ event, resolve }) => {
	if (!_demoSeeded && pubEnv.PUBLIC_DEMO_ENABLED === 'true') {
		_demoSeeded = true;
		const { seedDemo } = await import('$lib/db/demo-seed.js');
		await seedDemo();
	}

	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: buildCorsHeaders(event.request.headers.get('origin'))
		});
	}

	if (
		pubEnv.PUBLIC_DEMO_ENABLED === 'true' &&
		event.request.method !== 'GET' &&
		event.request.method !== 'HEAD' &&
		!event.url.pathname.startsWith('/login') &&
		!event.url.pathname.startsWith('/register') &&
		!event.url.pathname.startsWith('/magic-link') &&
		event.url.pathname !== '/auth/logout'
	) {
		if (event.request.headers.get('x-sveltekit-action') === 'true') {
			return new Response(JSON.stringify({ type: 'success', status: 200 }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
		return new Response(null, { status: 303, headers: { Location: event.url.pathname } });
	}

	if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
		const origin = event.request.headers.get('origin');
		const referer = event.request.headers.get('referer');

		if (!isOriginTrusted(origin, referer, event.request.url)) {
			return new Response('Forbidden, origin not trusted', { status: 403 });
		}
	}

	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (session?.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const blankCookie = lucia.createBlankSessionCookie();
		event.cookies.set(blankCookie.name, blankCookie.value, {
			path: '/',
			...blankCookie.attributes
		});
	}

	event.locals.user = user;
	event.locals.session = session;

	const response = await resolve(event, {
		transformPageChunk({ html }) {
			const theme = (event.locals.user as any)?.settings?.theme;
			if (theme === 'light' || theme === 'dark') {
				return html.replace('<html ', `<html data-theme="${theme}" `);
			}
			return html;
		}
	});

	const corsHeaders = buildCorsHeaders(event.request.headers.get('origin'));
	if (corsHeaders['Access-Control-Allow-Origin']) {
		response.headers.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
	}
	if (corsHeaders['Access-Control-Allow-Credentials']) {
		response.headers.set(
			'Access-Control-Allow-Credentials',
			corsHeaders['Access-Control-Allow-Credentials']
		);
	}

	return response;
};
