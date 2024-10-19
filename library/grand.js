
export {

wrapper

} from '../wrapper.js'
export {

Sticker,
senseEnvironment,
tagLength, Tag,
Now,
sayDate, sayTick,

} from './sticker.js'
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

} from './library0.js'
export {

validateEmail, validatePhone, validateCard,
generatePosts, postDatabase,

} from './library1.js'
export {

getBrowserTag, getBrowserFingerprintAndTag, browserHash,

} from './library2.js'
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

snippet,
getAccess,
redact,
replaceAll, replaceOne,

} from './access.js'//just for coding access, get rid of later, october


/*

you could combine sticker and library0
by pass-through importing all of sticker's exports at the top of library0
and then importing them from library0 elsewhere
yeah, do this









*/

