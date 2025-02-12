
//  _   _            _                            _ _ _                          
// | |_| |__   ___  (_) ___ __ _ _ __ _   _ ___  | (_) |__  _ __ __ _ _ __ _   _ 
// | __| '_ \ / _ \ | |/ __/ _` | '__| | | / __| | | | '_ \| '__/ _` | '__| | | |
// | |_| | | |  __/ | | (_| (_| | |  | |_| \__ \ | | | |_) | | | (_| | |  | |_| |
//  \__|_| |_|\___| |_|\___\__,_|_|   \__,_|___/ |_|_|_.__/|_|  \__,_|_|   \__, |
//                                                                         |___/ 

/*
ttd, rename from library to level
each level rests on lower levels

level3 - (application) application logic
level2 - (services) more application specific environment and service functions
level1 - (modules) plus helpful node modules that run anywhere
level0 - (script) just javascript that runs anywhere

so convert to base62 is level 0, script
make a random tag is level 1, module
so read a row from the database is level 2, service
sign a user in is level 3, application
*/



/*
bundling all this together here means you can move a function from one file to another,
change where it is here,
but then all the code above, which just gets it from icarus, doesn't need to change
*/







//      _          _       _                              
//  ___| |__  _ __(_)_ __ | | ____      ___ __ __ _ _ __  
// / __| '_ \| '__| | '_ \| |/ /\ \ /\ / / '__/ _` | '_ \ 
// \__ \ | | | |  | | | | |   <  \ V  V /| | | (_| | |_) |
// |___/_| |_|_|  |_|_| |_|_|\_\  \_/\_/ |_|  \__,_| .__/ 
//                                                 |_|    
/*
details of this shrinkwrapped version of the code
*/
export {

wrapper

} from './wrapper.js'

//  _                _ _____ 
// | | _____   _____| |___ / 
// | |/ _ \ \ / / _ \ | |_ \ 
// | |  __/\ V /  __/ |___) |
// |_|\___| \_/ \___|_|____/ 
//                           
/*
*/
export {

getBrowserTag,
urlNetwork23, fetchNetwork23, vhsSign,

/* level 3 query */

snippetQuery3,
snippet3,

settingReadInt, settingRead, settingWrite,
legacyAccessSet, legacyAccessGet,
recordHit,

authenticateSignGet,
authenticateSignUp,
authenticateSignIn,
authenticateSignOut,

userToRoute,
routeToUser,
routeAdd,
routeRemove,
routeMove,

browserToUser,
browserSignIn,
browserSignOut,

trailCount,
trailRecent,
trailAdd,

} from './level3.js'

//  _                _ ____  
// | | _____   _____| |___ \ 
// | |/ _ \ \ / / _ \ | __) |
// | |  __/\ V /  __/ |/ __/ 
// |_|\___| \_/ \___|_|_____|
//                           
/*
functions that use parts of the larger application and environment
*/
export {

Sticker, isLocal, isCloud, senseEnvironment,
canGetAccess, accessWorker, getAccess,
doorWorker, doorLambda,
headerGetOne,
doorPromise, awaitDoorPromises,
dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,
useTurnstileHere, addTurnstileHeadScript, checkTurnstileToken,

/* level 2 query */

getDatabase,

snippetClear,
snippetPopulate,
snippetQuery2,
snippet2,

//ttd february, ok, you got it down to just 6 functions! give them really good names
/*

	queryFilterRecent -> queryTop
	queryAdd          -> queryAddRow
	queryAddSeveral   -> queryAddRows
	queryHideRows, same

	queryCountSince, same
	queryAddRowIfCellsUnique, same

also, look where level3 needs the database directly, can you factor those down to level2 now?
groups of query functions:
1-test
2-common
3-specialized
4-check

*/

//-- ttd february: see if you can get just a half dozen useful and commonly used query functions--then you probably don't even have to write tests!

queryFilterRecent,//many users
queryCountSince,//one user

/*
queryFilterMostRecent,//no users
queryFilterSortTop,//one user: legacyAccessGet
queryFilterSortAll,//no users
*/

queryAddRowIfCellsUnique,//one user
queryHideRows,//many users

/*
querySetCell, querySetCellOrAddRow,
queryGetCell, queryGetCellOrAddRow,
queryGetRow,  queryGetRowOrAddRow,
*/

queryAdd,//many users
queryAddSeveral,//useful helper
//queryAddRow,//switched everyone to queryAdd, but may want to take the name
//queryAddRows,//users

//--

queryCountRows,//these are just for testing
queryCountAllRows,
queryDeleteAllRows,

checkQueryTitle,
checkQueryRow,
checkQueryCell,

checkQueryTag,
checkQueryHash,
checkQueryText,
checkQueryInt,

checkQueryTagOrBlank,

} from './level2.js'

//  _                _ _ 
// | | _____   _____| / |
// | |/ _ \ \ / / _ \ | |
// | |  __/\ V /  __/ | |
// |_|\___| \_/ \___|_|_|
//                       
/*
functions that use module imports
*/
export {

tagLength, Tag, checkTag, checkTagOrBlank,

checkEmail, checkPhone,
validateEmail, validatePhone, validateCard,

checkAction,

measurePasswordStrength,

generatePosts, postDatabase,
testBox,

} from './level1.js'

//  _                _  ___  
// | | _____   _____| |/ _ \ 
// | |/ _ \ \ / / _ \ | | | |
// | |  __/\ V /  __/ | |_| |
// |_|\___| \_/ \___|_|\___/ 
//                           
/*
helpful javascript functions with no module imports
*/
export {

Time, Size, textLimit, noop,
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
timeSafeEqual,
hashLength, subtleHash, checkHash, hash,
hashPassword,
encrypt, decrypt,
hmacSign,
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

replaceAll, replaceOne, parseEnvStyleFileContents,
noOverlap,
ashFetchum,

getBrowserGraphics,
getBrowserAgentRendererAndVendor,

sameIgnoringCase, sameIgnoringTrailingSlash,


typeUserName, checkUserName,
checkUserRoute, validUserRoute,

} from './level0.js'
