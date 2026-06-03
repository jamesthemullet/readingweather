import { type Writable, writable } from 'svelte/store';

export const showAddComment: Writable<boolean> = writable(true);
