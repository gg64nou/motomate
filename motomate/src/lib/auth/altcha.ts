import crypto from 'crypto';
import { env } from '$env/dynamic/private';

export function getAltchaKey(): string {
	if (env.ALTCHA_HMAC_KEY) return env.ALTCHA_HMAC_KEY;
	return crypto.createHmac('sha256', env.AUTH_SECRET ?? '').update('altcha').digest('hex');
}

export async function verifyAltcha(payload: FormDataEntryValue | null): Promise<boolean> {
	if (!payload || typeof payload !== 'string') return false;
	const { verifySolution } = await import('altcha-lib/v1');
	return verifySolution(payload, getAltchaKey());
}
