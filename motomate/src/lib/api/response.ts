import { json } from '@sveltejs/kit';

export function ok<T>(data: T, status = 200) {
	return json({ data }, { status });
}

export function list<T>(items: T[], total?: number) {
	return json({ data: items, ...(total !== undefined ? { total } : {}) });
}

export function apiError(message: string, code: string, status: number) {
	return json({ error: message, code }, { status });
}

export function requireUser(user: unknown): user is NonNullable<typeof user> {
	return user !== null && user !== undefined;
}
