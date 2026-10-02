import { loadPageById } from '$lib/server/loadPageById';
import type { PageServerLoad } from './$types';

export const prerender = true;

const PHOTOGRAPHS_PAGE_ID = 169;

export const load: PageServerLoad = loadPageById(PHOTOGRAPHS_PAGE_ID);
