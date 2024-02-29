
import { nanoid, customAlphabet } from "nanoid";

//generate a new universally unique double-clickable string of 21 letters and numbers
export function unique() {
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";//removed -_ for double-clickability, at a cost of 149 to 107 billion years according to https://zelark.github.io/nano-id-cc/
	const length = 21;//same default nanoid length
	let generator = customAlphabet(alphabet, length);
	let id = generator();
	return id;
}
