
/*
$ node --version
v20.15.0

$ node test.js
Wed 13h 20m 48.044s ~ ✅ Wed 13h 20m 48.044s ~ 381 assertions in 29 tests all passed in 42ms ✅
*/

import { runTests } from './library0.js'
import './library1.js'
import './library2.js'
import './database.js'

runTests()
