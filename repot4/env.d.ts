/// <reference types="./worker-configuration.d.ts" />
//in the workspace "repot4", this is the file ./env.d.ts

declare module "h3" {
	interface H3EventContext {
		cf: CfProperties;
		cloudflare: {
			request: Request;
			env: Env;
			context: ExecutionContext;
		};
	}
}

export {};
