
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
base62ToInt, intToBase62,
checkTag,

randomBetweenLight, randomBetween, randomCode,
hashLength, subtleHash, checkHashLight, checkHash,
hashPassword,
encrypt, decrypt,
rsaEncrypt, rsaDecrypt,
objectToBase62, base62ToObject,
curveSign, curveVerify,

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
getBrowserAgentRendererAndVendor,

} from './library0.js'//helpful javascript functions with no module imports
export {

validateEmail, validatePhone, validateCard,
generatePosts, postDatabase,

} from './library1.js'//functions that use module imports
export {

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
