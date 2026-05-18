import { env } from '$env/dynamic/private';
import { hasAnyUser } from '$lib/db/repositories/users.js';

export async function isRegistrationOpen(): Promise<boolean> {
	if (env.AUTH_ALLOW_REGISTRATION !== 'false') return true;
	return !(await hasAnyUser());
}
