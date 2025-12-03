
//  _   _            _                            _ _ _                          
// | |_| |__   ___  (_) ___ __ _ _ __ _   _ ___  | (_) |__  _ __ __ _ _ __ _   _ 
// | __| '_ \ / _ \ | |/ __/ _` | '__| | | / __| | | | '_ \| '__/ _` | '__| | | |
// | |_| | | |  __/ | | (_| (_| | |  | |_| \__ \ | | | |_) | | | (_| | |  | |_| |
//  \__|_| |_|\___| |_|\___\__,_|_|   \__,_|___/ |_|_|_.__/|_|  \__,_|_|   \__, |
//                                                                         |___/ 

/*
ttd december2024, rename from library to level
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

/*
when coding, the axiom is to
factor everything away from vue files and api handlers, down here, to this icarus library
that way, those framework specific files stay short enough to fit on one screen
multiple front end components and api handlers can use the same library code
exactly the same code runs on the client (to provide keystroke-by-keytroke feedback to the user) and the server (where its validation can be trusted)
and because it's the same:
you know it will act the same
changes to it affect its behavior everywhere it could run (a long list: lambda, worker, ssr, page running on client)


code that must be vendor-specific, like doorWorker and doorLambda, still factor down into the library
here, side-by-side, ctrl+f and select term to highlight show differences and commonalities

switching providers is something to plan for
new team members getting up to speed, faster on a smaller codebase
imagine a switch from vue in nuxt to react in next.js: instead of changing lengthy .vue files, most of the code is already down in the library
imagine a switch from supabase to neon: a thin layer abstracts this away
imagine a switch from cloudflare pages and amazon lambda to virtual instances
also, round robin enables multiple providers, and switches in run-time: these will become pluggable
send email and texts through amazon and twilio
*/

/*
within the library, factor everything to the lowest level where it fits
reasons for this include:
you can see how much code is maximually portable--depending on the fewest outside modules and platforms
you only use more modules and services when necessary

modern javascript platform only: ESM, run by Node 20, a current Chromium V8 worker, or a common consumer's web browser

could be run in
local debug | deployed to production public in the cloud
x
front end client page | back end server api endpoint
x
(if deployed server) cloudflare worker | amazon lambda
x
(if page) ssr | client browser

so, the library code is isomorphic, but modern
exactly the same code runs on the client and the server
on the client, it's there to give instant, keystroke by keystroke feedback to the user
on the server, it's there to validate, be trusted, we can be certain that it hasn't been tampered with

not in icarus are:
any code that uses any node modules that were written intending to be run on a server by node
such as: twilio, sharp
those are in persephone
so, icarus can't use persephone, but persephone can use icarus
and, persephone can use tiny tests, and defines more tests that only run in lambda
*/

//ttd march2025 ^ clean that up into a single tight essay about levels and isomorphic




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

vhsSign,
Code, codeSend, browserToCodes, codeEnter,

/* level 3 query */

snippetQuery3,
snippet3,

settingReadInt, settingRead, settingWrite,
recordDelay, recordHit,

browserToUser,

nameCheck,

demonstrationSignGet,
demonstrationSignUp,
demonstrationSignIn,
demonstrationSignOut,

trailRecent, trailCount, trailGet, trailAdd,

credentialPasswordGet, credentialPasswordCreate, credentialPasswordRemove,
credentialTotpGet, credentialTotpCreate, credentialTotpRemove,
credentialGet, credentialSet,

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

Sticker, stickerParts, isLocal, isCloud,
Key, decryptKeys, accessKey, canGetAccess, getAccess,
doorWorker, doorLambda,
headerGetOne,
keepPromise, awaitDoorPromises,
dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,
useTurnstileHere, addTurnstileHeadScript, checkTurnstileToken,
sayFloppyDisk, runTestsSticker,

Task, fetchWorker, fetchLambda, fetchProvider,
origin23, originOauth, originApex,
sealEnvelope, openEnvelope,
composeCookieName, composeCookieValue, parseCookieValue,

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

sayPlural, commas, sayHugeInteger, saySize4, sayNumber4,
middleDot, thinSpace,
Limit, cropToLimit,
trimLines, trimLine,
deaccent, slug,

bundleValid,
checkName,
validateName,

validateTitle, validatePost,
checkActions,
checkEmail, validateEmail, validateEmailOrPhone,
checkPhone, validatePhone,
checkCard, validateCard,
checkDate, validateDate, getPageOffsetMinutes, ageDate,
checkWallet, validateWallet,

browserIsBesideAppStore, getBrowserGraphics,

measurePasswordStrength,
generatePosts, postDatabase,

indexRecords, addRecords, mergeRecords,

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

checkText, hasText, checkInt, minInt,
toBoolean, toTextOrBlank,
intToText, textToInt,
checkTextSame, hasTextSame, checkTextOrBlank, hasTextOrBlank,
checkNumerals, isNumerals, takeNumerals,
newline,
cut, cutLast,
replaceAll, replaceOne,
safefill, deindent,

Bin, Data, checkSizeStartEnd, mulberryData,
base62ToInt, intToBase62,

Tag, checkTagOrBlank, checkTag, hasTag,
randomBetweenLight, randomBetween, randomCode, hashToLetter,
secureSameText, secureSameData,
checkHash, hashData, hashText,
hashPassword, hashPasswordMeasureSpeed,
encryptData, decryptData, encryptSymmetric,
hmacSign,
rsaEncrypt, rsaDecrypt,
objectToBase62, base62ToObject,
curveSign, curveVerify,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants, checkTotpSecret, checkTotpCode,

tickToDay, dayToTick,
sayTimePage, sayWhenPage, sayWhenFeed,
fraction, exponent, int, big,
defined, given,
squareEncode, squareDecode, checkSquare,
correctLength,
say, look,
makePlain, makeObject, makeText,

parseKeyFile, parseKeyBlock, lookupKey, listAllKeyValues,
parseEnvStyleFileContents,
sequentialShared, sequentialSeparate,

sameIgnoringCase, sameIgnoringTrailingSlash,
roundDown,
sample1,
isExpired,

liveBox,//move to whichever level you need it!

} from './level0.js'
