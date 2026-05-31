import { writable, type Writable } from 'svelte/store';

export const showAddComment: Writable<boolean> = writable(true);
