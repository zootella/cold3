
//not a part of what get's tested or built; a recycle bin for code you probably don't need














//                                            _ 
//  _ __   __ _ ___ _____      _____  _ __ __| |
// | '_ \ / _` / __/ __\ \ /\ / / _ \| '__/ _` |
// | |_) | (_| \__ \__ \\ V  V / (_) | | | (_| |
// | .__/ \__,_|___/___/ \_/\_/ \___/|_|  \__,_|
// |_|                                          

export function measurePasswordStrength(s) {
	let o = {}
	o.length = s.length
	o.hasUpper = /[A-Z]/.test(s)
	o.hasLower = /[a-z]/.test(s)
	o.hasDigit = /\d/.test(s)
	o.hasOther = /[^a-zA-Z\d]/.test(s)

	o.alphabet = 0//how many different characters could be in this password based on the variety of characters we've seen
	if (o.hasUpper) o.alphabet += 26//if it has one uppercase letter, imagine there could be any uppercase letter
	if (o.hasLower) o.alphabet += 26
	if (o.hasDigit) o.alphabet += 10
	if (o.hasOther) o.alphabet += 32//while we allow any characters in passwords, OWASP lists 32 special characters, and most users will probably choose passwords with special characters from that list
	o.permutations = exponent(o.alphabet, o.length)//how many possible passwords exist of this length and variety
	o.permutationsPlaces = (o.permutations+'').length//essentially log10(permutations) that can't overflow
	o.guessYears = fraction([o.permutations, 10], [Time.year, 2]).quotient//how many years it might take to crack this password, assuming a fast computer that can hash a guess in 10 milliseconds, and a successful guess after trying one half (2) of permutations

	if      (o.guessYears <    1) o.sayStrength = 'Weak'
	else if (o.guessYears <   10) o.sayStrength = 'Okay'
	else if (o.guessYears < 1000) o.sayStrength = 'Strong'
	else                          o.sayStrength = 'Very strong'

	o.acceptable = !(o.guessYears < 1)//allow passwords above weak
	o.sayEndurance = sayHugeInteger(o.guessYears)

	if      (o.length < 6)                             o.sayImprovement = 'Make longer'
	else if (o.hasUpper != o.hasLower)                 o.sayImprovement = 'Mix upper and lower case'
	else if (o.hasDigit != (o.hasUpper || o.hasLower)) o.sayImprovement = 'Use letters and numbers'
	else if (!o.hasOther)                              o.sayImprovement = 'Add a special character'
	else                                               o.sayImprovement = 'Make longer'

	if (o.sayStrength == 'Weak') {
		o.sayStatus = `Strength: ${o.sayStrength}. ${o.sayImprovement} for more strength.`
	} else if (o.sayStrength == 'Okay') {
		o.sayStatus = `Strength: ${o.sayStrength}. ${o.sayEndurance} to guess. ${o.sayImprovement} for more strength.`
	} else if (o.sayStrength == 'Strong') {
		o.sayStatus = `${o.sayStrength}. ${o.sayEndurance} to guess. ${o.sayImprovement} for more strength.`
	} else if (o.sayStrength == 'Very strong') {
		o.sayStatus = `${o.sayStrength}. ${o.sayEndurance} to guess.`
	}
	return o
}


















