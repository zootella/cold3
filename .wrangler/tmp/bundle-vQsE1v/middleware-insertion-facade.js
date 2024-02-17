				import worker, * as OTHER_EXPORTS from "C:\\Documents\\code\\code21site\\cold3\\.wrangler\\tmp\\pages-lr6NV2\\functionsWorker-0.10457342604754172.mjs";
				import * as __MIDDLEWARE_0__ from "C:\\Documents\\code\\code21site\\cold3\\node_modules\\wrangler\\templates\\middleware\\middleware-miniflare3-json-error.ts";
				const envWrappers = [__MIDDLEWARE_0__.wrap].filter(Boolean);
				const facade = {
					...worker,
					envWrappers,
					middleware: [
						__MIDDLEWARE_0__.default,
            ...(worker.middleware ? worker.middleware : []),
					].filter(Boolean)
				}
				export * from "C:\\Documents\\code\\code21site\\cold3\\.wrangler\\tmp\\pages-lr6NV2\\functionsWorker-0.10457342604754172.mjs";

				const maskDurableObjectDefinition = (cls) =>
					class extends cls {
						constructor(state, env) {
							let wrappedEnv = env
							for (const wrapFn of envWrappers) {
								wrappedEnv = wrapFn(wrappedEnv)
							}
							super(state, wrappedEnv);
						}
					};
				

				export default facade;