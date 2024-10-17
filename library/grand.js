

export {
wrapper
} from '../wrapper.js'
export {

Sticker, senseEnvironment,
sayDate,

/*
uncomment this section when you actually move some of these into sticker officially

//and these are copied from library0 for now, because that would be a messy refactor:
Now,
sayTick,
defined,
hasText,

//and these are copied from library1.js, and use nanoid:
tagLength,
Tag,
*/

} from './sticker.js'
export {

Time, Size, Now,
noop, test, ok, runTests,
toss,
log, composeLog, recordLog, getLogRecord, composeLogArguments,
sameObject, sameArray,

checkText, hasText, checkInt, minInt, intToText, textToInt, checkTextSame, hasTextSame, checkTextOrBlank, hasTextOrBlank,
newline, middleDot, thinSpace,
start, end, beyond, chop, clip, has, starts, ends, cut, cutLast, findFirst, findLast, swap, parse,
checkNumerals, checkBase16, checkAlpha, checkName, onlyNumerals, onlyBase16, onlyAlpha, onlyName,
checkDate,
size4, number4,

Bin, Data,
checkHash, checkHashThoroughly,
base62ToInt, intToBase62,
randomBetween, cryptoRandomBetween,
symmetricCreateKey, symmetricExportKey, symmetricImportKey, symmetricEncrypt, symmetricDecrypt,
rsaEncrypt, rsaDecrypt,
hashLength, subtleHash,
curveCreateKeys, curveExportKey, curveImportKey, curveSign, curveVerify,
hashPassword,

sayTick, sayTick_previousVersion,
sayWhenPage, sayWhenFeed,
fraction,
deindent,
defined,
squareEncode, squareDecode, checkSquare,
correctLength,
testBox,
say, look, stringify,

//more you'll probably rename
accessEncrypt, accessDecrypt,

} from './library0.js'
export {

tagLength, Tag, checkTag,
uniqueCode4, uniqueCode6,
validateEmail, validatePhone, validateCard,
generatePosts, postDatabase,

} from './library1.js'
export {

Access, hasAccess,
redact, replaceAll, replaceOne,
getBrowserTag, getBrowserFingerprintAndTag, browserHash,

} from './library2.js'
export {

durationEnvironment, durationFetch, durationWait,
saveUseRuntimeConfigFunction, getUseRuntimeConfigFunction,
doorPromise, awaitDoorPromises,
doorWorkerOpen, doorLambdaOpen,
doorWorkerShut, doorLambdaShut,

} from './door.js'
export {

} from './door2.js'
export {

settings_getText, settings_getNumber, settings_setText, settings_setNumber,
counts_getGlobalCount, counts_setGlobalCount, counts_getBrowserCount, counts_setBrowserCount,
access_addRecord, access_getRecords, accessTableInsert, accessTableQuery,
rowExists, createRow, readRow, writeRow,
database_pingCount,

} from './database.js'
export {

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,
snippet,

} from './cloud.js'
export {

} from './cloud2.js'



export {
	secretSnippet2
} from './access.js'//just for coding access, get rid of later, october




//also this replaces test.js
/*

//this script just bundles together all the library files that have tiny tests
import { runTests } from './library0.js'
import './library1.js'
import './library2.js'
import './door.js'
import './door2.js'
import './database.js'
import './cloud.js'
import './cloud2.js'

//so you can import just one thing from here
export { runTests }//curly braces as part of named export system in javascript
*/





//grand like grand central station
//or maybe instead nexus like star trek or plexus like chakras?


/*
thsi is also where you can document package.json



where do you install a module taht will be used only by lambda?
needs to be available to

library - yes
net23 - yes
site - no



needs to be







*/

/*
a note about yarn

have these environments:

/ root nuxt for cloudflare, or maybe put that in a subfolder, too?
/library, this is where you do $ node test, not in the root, so that there can be node test library-only modules
/icarus
/net23

so you'll have four, not three

*/

/*
this will be the pass through imports library
so you can move a function from library1 to library2 without changing a bunch of imports in code files

you might also bring in database, cloud, and door functions here

and also this is where you channel sticker.js
but ping files still import sticker.js by itself to be really lean



*/

/*
oh, this is also where you document what each file is for, and what code goes in each file
which is better than doing that at the top of each file, because this one place can see the whole map

*/

/*
an early fun thing you'll unwind here is which functions from library0 get brought up to sticker
*/


/*
// File: moduleA.js
export const valueA = 'Hello';

// File: moduleB.js
export { valueA } from './moduleA';

// Now you can import valueA from moduleB.js:
import { valueA } from './moduleB';



before you switch to this with a lot of keystrokes:
confirm you can import in loops, like library2 imports grand, which imports functions from library2
confirm you can stack import statements from the same file, so that you can group these thematically

and then go file by file and condense imports to grand
and actually only import things you're using, which is cleaner, and also eliminates some build warnings




*/






