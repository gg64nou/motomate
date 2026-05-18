import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: new Proxy({}, { get: (_, k: string) => process.env[k] })
}));

vi.mock('$lib/db/repositories/users.js', () => ({
	hasAnyUser: vi.fn()
}));

import { isRegistrationOpen } from '$lib/auth/registration.js';
import { hasAnyUser } from '$lib/db/repositories/users.js';

describe('isRegistrationOpen', () => {
	beforeEach(() => {
		delete process.env.AUTH_ALLOW_REGISTRATION;
		vi.mocked(hasAnyUser).mockReset();
	});

	it('open when AUTH_ALLOW_REGISTRATION is unset', async () => {
		expect(await isRegistrationOpen()).toBe(true);
	});

	it('open when AUTH_ALLOW_REGISTRATION=true', async () => {
		process.env.AUTH_ALLOW_REGISTRATION = 'true';
		expect(await isRegistrationOpen()).toBe(true);
	});

	it('closed when AUTH_ALLOW_REGISTRATION=false and users exist', async () => {
		process.env.AUTH_ALLOW_REGISTRATION = 'false';
		vi.mocked(hasAnyUser).mockResolvedValue(true);
		expect(await isRegistrationOpen()).toBe(false);
	});

	it('open when AUTH_ALLOW_REGISTRATION=false but no users (first-user failsafe)', async () => {
		process.env.AUTH_ALLOW_REGISTRATION = 'false';
		vi.mocked(hasAnyUser).mockResolvedValue(false);
		expect(await isRegistrationOpen()).toBe(true);
	});

	it('hasAnyUser not called when registration is explicitly enabled', async () => {
		process.env.AUTH_ALLOW_REGISTRATION = 'true';
		await isRegistrationOpen();
		expect(hasAnyUser).not.toHaveBeenCalled();
	});
});
