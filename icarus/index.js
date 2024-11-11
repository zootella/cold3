
export {

wrapper

} from './wrapper.js'//details of this shrinkwrapped version of the code
export {

Time, Size, noop,
Now, sayDate, sayTick,
test, ok, runTests,
toss,
log, addLogSink, logTo,
sameObject, sameArray,

checkText, hasText, checkInt, minInt,
intToText, textToInt,
checkTextSame, hasTextSame, checkTextOrBlank, hasTextOrBlank,
newline, middleDot, thinSpace,

start, end, beyond, chop, clip,
has, starts, ends,
cut, cutLast,
findFirst, findLast,
swap, parse,

checkNumerals, checkBase16, checkAlpha, checkName,
onlyNumerals, onlyBase16, onlyAlpha, onlyName,
checkDate,
size4, number4,
Bin, Data,
base62ToInt, intToBase62,

randomBetweenLight, randomBetween, randomCode,
hashLength, subtleHash, checkHashLight, checkHash,
hashPassword,
encrypt, decrypt,
rsaEncrypt, rsaDecrypt,
objectToBase62, base62ToObject,
curveSign, curveVerify,

sayWhenPage, sayWhenFeed,
fraction, exponent, int, big,
deindent,
defined,
squareEncode, squareDecode, checkSquare,
correctLength,
say, look, stringify,

replaceAll, replaceOne,
parseEnvStyleFileContents,
getBrowserAgentRendererAndVendor,

} from './library0.js'//helpful javascript functions with no module imports
export {

tagLength, Tag, checkTag,
validateEmail, validatePhone, validateCard,
measurePasswordStrength,
generatePosts, postDatabase,

testBox,

} from './library1.js'//functions that use module imports
export {

Sticker, senseEnvironment,
canGetAccess, accessWorker, getAccess,
doorWorker, doorLambda, doorPromise, awaitDoorPromises,
getBrowserTag,

} from './library2.js'//functions that use parts of the larger application and environment

/*
beyond that structure are temporary files named by the area they're working on
once done, move groups of functions into library0,1,2 above
*/
export {

settings_getText, settings_getNumber, settings_setText, settings_setNumber,
counts_getGlobalCount, counts_setGlobalCount, counts_getBrowserCount, counts_setBrowserCount,
access_addRecord, access_getRecords,
accessTableInsert, accessTableQuery,
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

/*
ttd, rename from library to level
each level rests on lower levels

level0 - (script) just javascript that runs anywhere
level1 - (modules) plus helpful node modules that run anywhere
level2 - (services) more application specific environment and service functions
level3 - (application) application logic

so convert to base62 is level 0, script
make a random tag is level 1, module
so read a row from the database is level 2, service
sign a user in is level 3, application
*/



/*
bundling all this together here means you can move a function from one file to another,
change where it is here,
but then all the code above, which just gets it from icarus, doesn't need to change

it would be even nicer if the files within icarus could do that
but that makes circular references that rollup warns about:

Export "log" of module "../icarus/library0.js" was reexported through module "../icarus/index.js" while both modules are dependencies of each other and will end up in different chunks by current Rollup settings. This scenario is not well supported at the moment as it will produce a circular dependency between chunks and will likely lead to broken execution order.
Either change the import in "components/AccountComponent.vue" to point directly to the exporting module or reconfigure "output.manualChunks" to ensure these modules end up in the same chunk.

note that with these warnings, the build still worked, and stats.html still looked ok
but you're heeding these warnings for now, and enjoying importing everything from just icarus in all the code above
but still naming individual files within icarus
*/





















