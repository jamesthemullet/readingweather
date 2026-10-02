import { loadPageById } from '$lib/server/loadPageById';
import type { PageServerLoad } from './$types';

export const prerender = true;

const USEFUL_LINKS_PAGE_ID = 161;

export const load: PageServerLoad = loadPageById(USEFUL_LINKS_PAGE_ID);
