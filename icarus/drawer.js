

//a drawerful of awesome javascript library functions from previous coding
//move these into level0 and level1 as you need them
//and, as you do, run and improve syntax and tests!




















//                                                       _       
//  ___  ___ _ __ __ _ _ __    _ __ ___   __ _ _ __ __ _(_)_ __  
// / __|/ __| '__/ _` | '_ \  | '_ ` _ \ / _` | '__/ _` | | '_ \ 
// \__ \ (__| | | (_| | |_) | | | | | | | (_| | | | (_| | | | | |
// |___/\___|_|  \__,_| .__/  |_| |_| |_|\__,_|_|  \__, |_|_| |_|
//                    |_|                          |___/         

//given a multiline string with blank first and last lines, and a whitespace margin before each line, remove that margin
//returns s unchanged if anything doesn't look right
function margin(s) {
	var l = stringToLines(s);
	if (!l.length) return s;//no lines
	if (hasText(l[0]) || hasText(l[l.length - 1])) return s;//edge text
	if (!(starts(l[1], " ") || starts(l[1], "\t"))) return s;//first line must start with space or tab

	var f = l[1];//first line
	var w = start(f, 1);//tab or space character
	var n = 0;//number of those at the start of the first line
	for (var i = 0; i < f.length; i++) { if (f[i] == w) n++; else break; }
	if (!n) return s;

	var a = [];//array to fill and return
	for (var i = 1; i < l.length - 1; i++) {//loop through lines not including blank first and last
		var line = l[i];
		if (hasText(line)) {
			if (line.length < n) return s;//line too short
			for (var j = 0; j < n; j++) { if (line[j] != w) return s; }//line doesn't start with w characters
			a.push(beyond(line, n));
		} else {
			a.push(line);
		}
	}
	return linesToString(a);
}
exporty({margin});




















//                             _   _ _   _      
//  ___  ___ _ __ __ _ _ __   | |_(_) |_| | ___ 
// / __|/ __| '__/ _` | '_ \  | __| | __| |/ _ \
// \__ \ (__| | | (_| | |_) | | |_| | |_| |  __/
// |___/\___|_|  \__,_| .__/   \__|_|\__|_|\___|
//                    |_|                       

/*
Blog titles can't be longer than 32 characters.
Post titles, notes and other short text messages are limited to 500 characters.

Other username length limits:    Other short post limits:
-----------------------------    ---------------------------
15 Twitter                       140 Twitter classic
20 Reddit                        280 Twitter
30 Gmail                         500 Mastodon, and our limit
32 Tumblr, and our limit
*/
const nameLimit = 32;
const noteLimit = 500;
//validate and correct or blank the given name text from the user, our settings.js, or settings.js from another installation
function validName(s) {
	if (badText(s)) return "";//no name yet
	s = onlySpaces(s);//turn all whitespace into _
	s = swap(s, " ", "_");

	s = onlyNameCharacters(s);//only allow 0-9 a-z A-Z and .-_
	while (has(s, "..")) s = swap(s, "..", ".");//no punctuation duplicates
	while (has(s, "--")) s = swap(s, "--", "-");
	while (has(s, "__")) s = swap(s, "__", "_");

	if (s.length > nameLimit) s = start(s, nameLimit);//32 characters or less
	while (starts(s, ".") || starts(s, "-") || starts(s, "_")) s = beyond(s, 1);//no punctuation on the ends
	while (ends(s, ".") || ends(s, "-") || ends(s, "_")) s = chop(s, 1);

	//return blank if that blanked it
	return s;
}
test(function() {
	ok(validName("title1") == "title1");
	ok(validName("My Title") == "My_Title");
	ok(validName("uh...no") == "uh.no");
	ok(validName("~.a.b.c.~") == "a.b.c");
	ok(validName("000009999900000999990000099999aaaa") == "000009999900000999990000099999aa");//34 shortened to 32
})
//validate and correct or blank the given text of a short note
function validNote(s) {
	if (badText(s)) return "";//no note yet
	s = gapsToSpace(s).trim();//turn all whitespace gaps into single spaces
	if (s.length > noteLimit) s = start(s, noteLimit);
	return s;
}


















//                             _   _     _                 
//  ___  ___ _ __ __ _ _ __   | |_| |__ (_)_ __   __ _ ___ 
// / __|/ __| '__/ _` | '_ \  | __| '_ \| | '_ \ / _` / __|
// \__ \ (__| | | (_| | |_) | | |_| | | | | | | | (_| \__ \
// |___/\___|_|  \__,_| .__/   \__|_| |_|_|_| |_|\__, |___/
//                    |_|                        |___/     

// Say "0 items", "1 item", "2 items", and so on
function things(n, name) { return (n == 1) ? ("1 "+name) : (n+" "+name+"s"); }//no commas, for internationalization
function thingsCommas(n, name) {//with commas
	if (!name) name = "item";
	if (n == 0) return `0 ${name}s`;
	if (n == 1) return `1 ${name}`;
	return `${commas(n+"")} ${name}s`;
}
// Format numerals with thousands separator, like "1,234"
function commas(s, separator) {
	if (!separator) separator = ",";
	var t = "";
	while (s.length > 3) { // Move commas and groups of 3 characters from s to t
		t = separator + end(s, 3) + t;
		s = chop(s, 3);
	}
	return s + t; // Move the leading group of up to 3 characters
}
test(function() {
	ok(things(0, "boat") == "0 boats");
	ok(things(1, "boat") == "1 boat");
	ok(things(2, "boat") == "2 boats");
	ok(things(2000, "boat") == "2000 boats");



	ok(thingsCommas(0, "muffin") == "0 muffins");
	ok(thingsCommas(1, "muffin") == "1 muffin");
	ok(thingsCommas(2, "muffin") == "2 muffins");
	ok(thingsCommas(3000, "cookie") == "3,000 cookies");

	ok(commas("12") == "12");
	ok(commas("12345") == "12,345");
});

exporty({things, thingsCommas, commas});













