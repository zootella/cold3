
export {

wrapper

} from '../wrapper.js'//details of this shrinkwrapped version of the code
export {

Sticker,
senseEnvironment,
tagLength, Tag,
Now,
sayDate, sayTick,

} from './sticker.js'//small to not slow down ping
export {

Time, Size, noop,
test, ok, runTests,
toss,
log, composeLog, recordLog, getLogRecord, composeLogArguments,
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
checkHash, checkHashThoroughly,
base62ToInt, intToBase62,

randomBetween, cryptoRandomBetween,
accessCreateKey, accessEncrypt, accessDecrypt,
symmetricCreateKey, symmetricExportKey, symmetricImportKey, symmetricEncrypt, symmetricDecrypt,
rsaEncrypt, rsaDecrypt,
hashLength, subtleHash,
curveCreateKeys, curveExportKey, curveImportKey, curveSign, curveVerify,
hashPassword,

checkTag,
randomCode,
sayWhenPage, sayWhenFeed,
fraction,
deindent,
defined,
squareEncode, squareDecode, checkSquare,
correctLength,
testBox,
say, look, stringify,

replaceAll, replaceOne,
parseEnvStyleFileContents,

} from './library0.js'//helpful javascript functions with no module imports
export {

validateEmail, validatePhone, validateCard,
generatePosts, postDatabase,

} from './library1.js'//functions that use module imports
export {

getBrowserTag, getBrowserFingerprintAndTag, browserHash,

} from './library2.js'//functions that use parts of the larger application and environment

/*
beyond that structure are temporary files named by the area they're working on
once done, move groups of functions into library0,1,2 above
*/
export {

durationEnvironment, durationFetch, durationWait,
doorPromise, awaitDoorPromises,
saveUseRuntimeConfigFunction, getUseRuntimeConfigFunction,
doorWorkerOpen, doorLambdaOpen,
doorWorkerShut, doorLambdaShut,

} from './door.js'
export {

} from './door2.js'
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

} from './cloud.js'
export {

} from './cloud2.js'
export {

redact_snippet,
getAccess,

} from './access.js'//just for coding access, get rid of later, october
