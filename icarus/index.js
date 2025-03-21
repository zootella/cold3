
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
urlNetwork23, fetch23, fetchNetwork23, vhsSign,
Code, codeSend, codeLiveForBrowser, codeEnter,

/* level 3 query */

snippetQuery3,
snippet3,

settingReadInt, settingRead, settingWrite,
recordHit,

browserToUserTag,
browserToUser,

demonstrationSignGet,
demonstrationSignUp,
demonstrationSignIn,
demonstrationSignOut,

trailCount,
trailRecent,
trailAdd,
trailAddHashes,

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
keep, awaitDoorPromises,
dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,
useTurnstileHere, addTurnstileHeadScript, checkTurnstileToken,
sayFloppyDisk,

/* level 2 query */

//query snippet
snippetClear, snippetPopulate, snippetQuery2, snippet2,
queryCountRows, queryCountAllRows, queryDeleteAllRows,

//query common
queryTop,
queryGet,
queryGet2,
queryAddRow,
queryAddRows,
queryHideRows,
queryUpdateCells,

//query specialized
queryCountSince,
queryAddRowIfHashUnique,
queryTopEqualGreater,
queryTopSinceMatchGreater,

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

liveBox,//move to whichever level you need it!

checkNumerals, onlyNumerals, sayPlural, sayGroupDigits, sayHugeInteger, saySize4, sayNumber4,
Tag, checkTagOrBlank, checkTag, hasTag,
middleDot, thinSpace,
Limit, cropToLimit,
trimLines, trimLine,
deaccent, slug,

bundleValid,
checkName,
validateName,

validateTitle, validatePost,
checkAction,
checkEmail, validateEmail, validateEmailOrPhone,
checkPhone, validatePhone,
checkCard, validateCard,
months3, checkDate, validateDate, getPageOffsetMinutes, ageDate,

measurePasswordStrength,

generatePosts, postDatabase,

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

Time, Size, noop,
Now, sayDate, sayTick,
test, ok, runTests,
toss,
log, addLogSink, logTo,
sameObject, sameArray,

checkText, hasText, blanket, checkInt, minInt,
intToText, textToInt,
checkTextSame, hasTextSame, checkTextOrBlank, hasTextOrBlank,
newline,

start, end, beyond, chop, clip,
has, starts, ends,
cut, cutLast,
findFirst, findLast,
swap, between,

Bin, Data,
base62ToInt, intToBase62,

randomBetweenLight, randomBetween, randomCode, hashToLetter,
secureSameText, secureSameData,
checkHash, hashData, hashText,
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
say, look,
parse, print,

replaceAll, replaceOne, parseEnvStyleFileContents,
noOverlap,
ashFetchum,

getBrowserGraphics,

sameIgnoringCase, sameIgnoringTrailingSlash,

roundDown,
given,

} from './level0.js'
