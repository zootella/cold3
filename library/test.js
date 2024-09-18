
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
