import { onRequest as __api_js_onRequest } from "C:\\Documents\\code\\code21site\\cold3\\functions\\api.js"
import { onRequest as __helloworld_js_onRequest } from "C:\\Documents\\code\\code21site\\cold3\\functions\\helloworld.js"

export const routes = [
    {
      routePath: "/api",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__api_js_onRequest],
    },
  {
      routePath: "/helloworld",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__helloworld_js_onRequest],
    },
  ]