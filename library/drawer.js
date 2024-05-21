





//a drawerful of awesome javascript library functions from previous coding
//move these into library0 and library1 as you need them
//and, as you do, run and improve syntax and tests!







































//   ____             _           _      _                         
//  / ___|  ___  _ __| |_ ___  __| |    / \   _ __ _ __ __ _ _   _ 
//  \___ \ / _ \| '__| __/ _ \/ _` |   / _ \ | '__| '__/ _` | | | |
//   ___) | (_) | |  | ||  __/ (_| |  / ___ \| |  | | | (_| | |_| |
//  |____/ \___/|_|   \__\___|\__,_| /_/   \_\_|  |_|  \__,_|\__, |
//                                                           |___/ 

// Keep an array sorted as we add elements to it
function SortedArray(compareFunction, startingArray) {
	var list = {};
	list.c = compareFunction; // Pass in a function that can compare two elements
	list.a = startingArray ? startingArray : []; // Start out empty, or use the given array which must already be sorted

	list.has  = function (e) { return list.find(e) != -1;   } // True if e is the same as something we have
	list.find = function (e) { return _sortedFind(list, e); } // Find the index of an item that matches e in list, -1 not found
	list.add  = function (e) { return _sortedAdd(list, e);  } // Add e to list, which is sorted and allows duplicates
	return list;
}
function _sortedFind(list, e) {

	var p = 0;             // Distance to first item in clip
	var q = list.a.length; // Distance beyond last item in clip
	var r;                 // Zero if same, negative if e is lighter, positive means e is heavier

	while (true) {

		var n = q - p;                 // Width of clip
		var z = q - 1;                 // Distance to last item in clip
		var m = p + Math.floor(n / 2); // Distance to middle item in clip

		if (n == 0) { // Empty

			return -1;

		} else if (n < 4) { // Too few items for middle to be useful

			r = list.c(e, list.a[p]); if (r == 0) return p; if (r < 0) return -1; // Found, or can't be before
			p++; // Loop again to look after

		} else { // Middle is useful

			r = list.c(e, list.a[p]); if (r == 0) return p; if (r < 0) return -1; // Found, or can't be before
			r = list.c(e, list.a[z]); if (r == 0) return z; if (r > 0) return -1; // Found, or can't be after
			r = list.c(e, list.a[m]); if (r == 0) return m; // Found
			if (r < 0) { p++; q = m; } else { p = m + 1; q--; } // Look next in lighter or heavier half
		}
	}
}
function _sortedAdd(list, e) {

	var p = 0;             // Distance to first item in clip
	var q = list.a.length; // Distance beyond last item in clip
	var r;                 // Zero if same, negative if e is lighter, positive means e is heavier

	while (true) {

		var n = q - p;                 // Width of clip
		var z = q - 1;                 // Distance to last item in clip
		var m = p + Math.floor(n / 2); // Distance to middle item in clip

		if (n == 0) { // Empty

			list.a.splice(p, 0, e); return;

		} else if (n < 4) { // Too few items for middle to be useful

			r = list.c(e, list.a[p]);
			if (r <= 0) { list.a.splice(p, 0, e); return; } // Same or lighter
			p++; // Heavier, loop again to look after

		} else { // Middle is useful

			r = list.c(e, list.a[p]); if (r <= 0) { list.a.splice(p, 0, e); return; } // Same or lighter
			r = list.c(e, list.a[z]); if (r >= 0) { list.a.splice(q, 0, e); return; } // Same or heavier
			r = list.c(e, list.a[m]); if (r == 0) { list.a.splice(m, 0, e); return; }
			if (r < 0) { p++; q = m; } else { p = m + 1; q--; } // Look next in lighter or heavier half
		}
	}
}
exporty({SortedArray});


















//                             _     _            _   _  __ _           
//  ___  ___ _ __ __ _ _ __   (_) __| | ___ _ __ | |_(_)/ _(_) ___ _ __ 
// / __|/ __| '__/ _` | '_ \  | |/ _` |/ _ \ '_ \| __| | |_| |/ _ \ '__|
// \__ \ (__| | | (_| | |_) | | | (_| |  __/ | | | |_| |  _| |  __/ |   
// |___/\___|_|  \__,_| .__/  |_|\__,_|\___|_| |_|\__|_|_| |_|\___|_|   
//                    |_|                                               

var idn_i, idn_s;
function idn() {
	if (!idn_s) idn_s = "id"; // Starting prefix
	if (!idn_i || idn_i > 9000000000000000) { idn_s += "n"; idn_i = 1; } // It's over nine thousand! actually quadrillion
	return idn_s + idn_i++; // Increment number for next time
}
exporty({idn});













//                                      _     _            
//  ___  ___ _ __ __ _ _ __   __      _(_) __| | ___ _ __  
// / __|/ __| '__/ _` | '_ \  \ \ /\ / / |/ _` |/ _ \ '_ \ 
// \__ \ (__| | | (_| | |_) |  \ V  V /| | (_| |  __/ | | |
// |___/\___|_|  \__,_| .__/    \_/\_/ |_|\__,_|\___|_| |_|
//                    |_|                                  

// Make s n long by adding t to the start or end
function widenStart(s, t, n) { widenCheck(s, t, n); while (s.length < n) s = t + s; return s; }
function widenEnd(s, t, n)   { widenCheck(s, t, n); while (s.length < n) s = s + t; return s; }
function widenCheck(s, t, n) {
	checkInt(n, 0);
	if (!t.length) toss("t must have length", {s, t, n});
}
exporty({widenStart, widenEnd});













//                                                 _                 
//  ___  ___ _ __ __ _ _ __    _ __ __ _ _ __   __| | ___  _ __ ___  
// / __|/ __| '__/ _` | '_ \  | '__/ _` | '_ \ / _` |/ _ \| '_ ` _ \ 
// \__ \ (__| | | (_| | |_) | | | | (_| | | | | (_| | (_) | | | | | |
// |___/\___|_|  \__,_| .__/  |_|  \__,_|_| |_|\__,_|\___/|_| |_| |_|
//                    |_|                                            

// Make a random string using 0-9 and a-f that's n characters long
function randomBase16(n) {
	checkInt(n, 0);
	var s = "";
	while (s.length < n) s += randomBase16Part();
	return start(s, n);
}
function randomBase16Part() {
	var s = (Math.random()).toString(16);
	s = widenEnd(s, "0", 15);//put 0s on the end
	return clip(s, 2, 12);
}
exporty({randomBase16});














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















//    ____ _                          _                
//   / ___| |__   __ _ _ __ __ _  ___| |_ ___ _ __ ___ 
//  | |   | '_ \ / _` | '__/ _` |/ __| __/ _ \ '__/ __|
//  | |___| | | | (_| | | | (_| | (__| ||  __/ |  \__ \
//   \____|_| |_|\__,_|_|  \__,_|\___|\__\___|_|  |___/
//                                                     

//turn all nonprinting characters in s like tabs and newline characters into spaces
function onlySpaces(s) {
	var t = "";
	for (c of s) t += c.trim().length ? c : " ";//if c trims to blank, mark it with a space
	return t;
}

//turn all nonprinting characters in s except for tabs into spaces
function onlyTabsAndSpaces(s) {
	var t = "";
	for (c of s) t += (c == "\t" || c.trim().length) ? c : " ";
	return t;
}

//shorten stretches of nonprinting characters to leave only two spaces and single spaces
function gapsToDoubleSpace(s) {
	s = onlySpaces(s);
	while (has(s, "   ")) s = swap(s, "   ", "  ");//end up with one 1 and 2 spaces together
	return s;
}

//squash all stretches of nonprinting characters like spaces, tabs, and newlines into single spaces
function gapsToSpace(s) {
	s = onlySpaces(s);//turn space-like characters like tab and newline into actual spaces
	while (has(s, "  ")) s = swap(s, "  ", " ");//turn multiple spaces into a single space
	return s;
}

//replace spaces with thin spaces so its a readable "12 345" for everyone rather than "12,345" US and "12.345" EU
function thinSpaces(s) {
	var t = String.fromCodePoint(0x2009); // Thin space
	return swap(s, " ", t);
}
//TODO Vue even replaces this with the html &thinsp; which is super correct, but it's not any narrower in Chrome

exporty({unfancyIncludingBacktick, unfancy, refancy});
exporty({onlySpaces, onlyTabsAndSpaces, gapsToDoubleSpace, gapsToSpace});
exporty({thinSpaces});

test(function() {

	var s1 = "\ta\r\n  bb  ";
	var s2 = onlySpaces(s1);
	var s3 = gapsToDoubleSpace(s2);
	var s4 = gapsToSpace(s3);
	var s5 = s4.trim();
	ok(s2 == " a    bb  ");
	ok(s3 == " a  bb  ");
	ok(s4 == " a bb ");//notice how s still isn't trimmed
	ok(s5 == "a bb");

	ok(onlySpaces(" a b  cc ") == " a b  cc ");
	ok(onlySpaces("\t") == " ");//tab
	ok(onlySpaces("\n") == " ");//mac and linux newline
	ok(onlySpaces("\r\n") == "  ");//windows newline becomes two spaces, which is fine

	var s = thinSpaces(" ");
	ok(s.length == 1);//a thin space has length 1
	ok(s.trim() == "");//and trims down to nothing just like a normal space

	s = thinSpaces("a b");
	ok(s != "a b");//a thin space is different than a normal space
	ok(onlySpaces(s), "a b");//but onlySpaces() makes it normal again
});






























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
//make sure s looks like a valid hash value
function checkHash(s) { if (!hashLooksValid(s)) toss("bad hash", {s}); }
//true if s looks like a valid hash value
function hashLooksValid(s) { return hasText(s) && s.length == 64 && s == onlyHashCharacters(s); }
//convert a drive hash like "00ff...ff00" to a complete hyper url like "hyper://00ff...ff00/"
function driveHashToHyperUrl(h) { checkHash(h); return "hyper://"+h+"/"; }
//parse the given hyper url like "hyper://00ff...ff00/" to get the drive hash like "00ff...ff00" or throw if missing or not valid
function hyperUrlToDriveHash(u) {
	var p = parse(u, "hyper://", "/");
	if (!p.found || hasText(p.before)) toss("not hyper", {u, p});
	checkHash(p.middle);
	return p.middle;
}
test(function() {
	ok(hashLooksValid("eda67eaf0786d8e62da7ea24edf143bf2249588511704b42b9057a910e9e29ab"));
	ok(!hashLooksValid("potato"));
});
exporty({validName, validNote, checkHash, hashLooksValid, driveHashToHyperUrl, hyperUrlToDriveHash});




















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

















                                              
//  ___  ___ _ __ __ _ _ __    _______ _ __ ___  
// / __|/ __| '__/ _` | '_ \  |_  / _ \ '__/ _ \ 
// \__ \ (__| | | (_| | |_) |  / /  __/ | | (_) |
// |___/\___|_|  \__,_| .__/  /___\___|_|  \___/ 
//                    |_|                        

//here's one for the very start
function textOrBlank(s) { return hasText(s) ? s : ""; }
function intOrZero(s) {
	var i = Math.floor(parseInt(s, 10));//base 10
	if (i+"" != s) return 0;//round trip check
	return i;
}
exporty({textOrBlank, intOrZero});
test(function() {
	ok(intOrZero() == 0);
	ok(intOrZero("") == 0);
	ok(intOrZero("potato") == 0);
	ok(intOrZero("2.5") == 0);//floor takes it down to 2, but then fails the round trip check
	ok(intOrZero("5") == 5);
	ok(intOrZero("789") == 789);
});










