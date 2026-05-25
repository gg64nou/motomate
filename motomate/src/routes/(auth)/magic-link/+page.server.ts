import { redirect } from '@sveltejs/kit';
import { lucia } from '$lib/auth/index.js';
import { verifyMagicLinkToken } from '$lib/auth/magic-link.js';
import { getUserById } from '$lib/db/repositories/users.js';
import crypto from 'crypto';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = url.searchParams.get('token') ?? '';

	const dummyToken = crypto.randomBytes(32).toString('hex');
	const tokenToVerify = token || dummyToken;

	const userId = await verifyMagicLinkToken(tokenToVerify);
	const user = userId ? await getUserById(userId) : null;

	const isValid =
		crypto.timingSafeEqual(Buffer.from(String(token)), Buffer.from(tokenToVerify)) &&
		userId !== null &&
		user !== null;

	if (!isValid || !userId || !user) {
		await crypto.scryptSync(crypto.randomBytes(16), 'salt', 64);
		return { verified: false, errorKey: 'auth.magicLink.invalid' };
	}

	const session = await lucia.createSession(userId, {});
	const cookie = lucia.createSessionCookie(session.id);
	cookies.set(cookie.name, cookie.value, { path: '/', ...cookie.attributes });

	redirect(302, user.onboarding_done ? '/dashboard' : '/onboarding');
};
