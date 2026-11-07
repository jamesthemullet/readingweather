// Fails if the SSR build contains bundled CommonJS that still require()s a
// non-builtin package at runtime. Vercel's dependency tracing can't see
// requires hidden inside bundled CJS (`__require("x")`), so those packages are
// missing from the deployed function and every SSR'd page 500s with
// "Cannot find module". Fix by adding the package to ssr.noExternal in
// vite.config.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join } from 'node:path';

const root = '.svelte-kit/output/server';
const builtins = new Set(builtinModules);
const offenders = [];

function walk(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) walk(path);
		else if (name.endsWith('.js')) {
			for (const [, spec] of readFileSync(path, 'utf8').matchAll(/__require\("([^"]+)"\)/g)) {
				const bare = spec.replace(/^node:/, '').split('/')[0];
				if (!builtins.has(bare)) offenders.push(`${path}: ${spec}`);
			}
		}
	}
}

walk(root);

if (offenders.length) {
	console.error('Bundled SSR code require()s packages Vercel will not ship:');
	for (const o of offenders) console.error(`  ${o}`);
	console.error('Add them to ssr.noExternal in vite.config.ts.');
	process.exit(1);
}
console.log('check-ssr-requires: OK');
