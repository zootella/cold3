
import {
Sticker, log, look, Now, Tag, checkText, checkTag,
getBrowserTag,
} from 'icarus'
import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useHelloStore = defineStore('hello', () => {

// State
const sticker = ref('')

// Actions
async function hello1() {
}
async function hello2() {
}

/*
do the promise pattern where many calls wait for the first one to finish
protect each function like that
p1, p2

hello1:
userIsSignedInHere

hello2
userName

*/


return {
	hello1, hello2,
}

})









