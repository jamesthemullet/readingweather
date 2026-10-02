import { loadPageById } from '$lib/server/loadPageById';
import type { PageServerLoad } from './$types';

export const prerender = true;

const ABOUT_PAGE_ID = 2;

export const load: PageServerLoad = loadPageById(ABOUT_PAGE_ID);
