
//this script just bundles together all the library files that have tiny tests
import { runTests } from '../library/library0.js'
import '../library/library1.js'
import '../library/library2.js'
import '../library/door.js'
import '../library/door2.js'
import '../library/database.js'
import '../library/cloud.js'
import '../library/cloud2.js'

//so you can import just one thing from here
export { runTests }//curly braces as part of named export system in javascript
