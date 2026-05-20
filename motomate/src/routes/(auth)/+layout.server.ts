import { env } from '$env/dynamic/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	return { demoMode: env.PUBLIC_DEMO_ENABLED === 'true' };
};
