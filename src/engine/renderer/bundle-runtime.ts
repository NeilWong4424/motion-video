import {join} from 'node:path';

import {bundle} from '@remotion/bundler';

import type {RepoContext} from '../project/paths.js';

let cachedBundle: {key: string; serveUrl: string} | null = null;

/**
 * Bundle the fixed runtime entry (src/index.ts) with the repo public dir. No
 * command may supply another entry or public directory. Cached by a key over the
 * current RenderPlan hash and build identity; a changed key rebuilds.
 */
export async function bundleRuntime(context: RepoContext, cacheKey: string): Promise<string> {
  if (cachedBundle && cachedBundle.key === cacheKey) {
    return cachedBundle.serveUrl;
  }
  const serveUrl = await bundle({
    entryPoint: join(context.repoRoot, 'src', 'index.ts'),
    publicDir: join(context.repoRoot, 'public'),
    onProgress: () => undefined,
    // The engine uses NodeNext `.js` import specifiers that resolve to `.ts`/
    // `.tsx` source; teach webpack the same extension alias so the bundle
    // resolves them without rewriting every import.
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        extensionAlias: {
          ...(config.resolve?.extensionAlias ?? {}),
          '.js': ['.tsx', '.ts', '.js'],
          '.jsx': ['.tsx', '.jsx'],
        },
      },
    }),
  });
  cachedBundle = {key: cacheKey, serveUrl};
  return serveUrl;
}
