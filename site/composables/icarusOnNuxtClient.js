
/*
./icarus/index.js                           - 1 Icarus library functions bundled together for export to both Nuxt and Lambda
./site/composables/icarusOnNuxtClient.js    - 2 Nuxt composable to automatically import them into client-side Nuxt .vue files
./site/server/plugins/icarusOnNuxtServer.js - 3 Nitro plugin to pin them globally so they're also in server-side Nuxt .js files

^ you've wired together these three so common Icarus functions are automatically imported
in Lambda files you still have to import these from Icarus manually, but that's fine because the Lambda side is small
*/

export {

wrapper, Sticker, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined,
toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

canGetAccess, getAccess,
doorWorker, doorLambda,
Task,

} from 'icarus'

/*
ttd april[]check that these are imported from icarus manually in files that use them!

Data
getBrowserTag
sayTick
sayTimePage
*/



/*
Nuxt’s composables directory is designed to auto-import functions based on your file structure. Although many examples involve reactive utilities (using Vue’s Composition API), nothing stops you from using the same mechanism to handle pure, stateless functions such as an email validator or utility functions like Tag and Now.

How It Can Work
Instead of manually importing these utility functions from your external “icarus” library every time, you can create a file (or files) in your project’s composables/ directory that re-exports selected functions from icarus. For example, you might create a file like:

ts
Copy
// composables/useUtilities.ts
export { validateEmail, Tag, Now } from 'icarus'
With this setup, Nuxt’s auto-import feature will expose these functions throughout your project without the need for explicit import statements. You can then simply call these functions in your page components or server API handlers, streamlining your codebase.
*/

/*
ttd april, comment this all between:

./icarus/index.js which groups them together for easy import
./site/composables/useIcarus.js which gets them there already for nuxt page code
./site/server/plugins/plugin1.js which gets them there already for nuxt server code, and also globalizes useRuntimeConfig

*/



//you're doing this because you're worried you  have a reference in a catch block that never runs, until it does, and when that happens, isntead of it running ok to log an exceptional case, you'll get a 500 because there's a code error which should bubble up
//so you're going to use this for the most essential and basic stuff, Now and Tag, look and log, dog, logAlert, all those
//but not Data, for instance







