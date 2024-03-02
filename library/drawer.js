





//a drawerful of awesome javascript library functions from previous coding
//move these into library0 and library1 as you need them
//and, as you do, run and improve syntax and tests!













//        _               _    
//    ___| |__   ___  ___| | __
//   / __| '_ \ / _ \/ __| |/ /
//  | (__| | | |  __/ (__|   < 
//   \___|_| |_|\___|\___|_|\_\
//                             

/*************************************************************************/
/*                                                                       */
/*                                  (`-.                                 */
/*                                   \  `                                */
/*      /)         ,   '--.           \    `                             */
/*     //     , '          \/          \   `   `                         */
/*    //    ,'              ./         /\    \>- `   ,----------.        */
/*   ( \  ,'    .-.-._        /      ,' /\    \   . `            `.      */
/*    \ \'     /.--. .)       ./   ,'  /  \     .      `           `.    */
/*     \     -{/    \ .)        / /   / ,' \       `     `-----.     \   */
/*     <\      )     ).:)       ./   /,' ,' \        `.  /\)    `.    \  */
/*      >^,  //     /..:)       /   //--'    \         `(         )    ) */
/*       | ,'/     /. .:)      /   (/         \          \       /    /  */
/*       ( |(_    (...::)     (                \       .-.\     /   ,'   */
/*       (O| /     \:.::)                      /\    ,'   \)   /  ,'     */
/*        \|/      /`.:::)                   ,/  \  /         (  /       */
/*                /  /`,.:)                ,'/    )/           \ \       */
/*              ,' ,'.'  `:>-._._________,<;'    (/            (,'       */
/*            ,'  /  |     `^-^--^--^-^-^-'                              */
/*  .--------'   /   |                                                   */
/* (       .----'    |   *************************************************/
/*  \ <`.  \         |   */
/*   \ \ `. \        |   */  // Make sure s is a string that has some text,
/*    \ \  `.`.      |   */  // meaning it's not blank, and not just space
/*     \ \   `.`.    |   */  function checkText(s) {
/*      \ \    `.`.  |   */    if (!hasText(s)) toss("no text", {s});
/*       \ \     `.`.|   */  }
/*        \ \      `.`.  */  function badText(s) {
/*         \ \     ,^-'  */    return !hasText(s);
/*          \ \    |     */  }
/*           `.`.  |     */  function hasText(s) {
/*              .`.|     */    return (
/*               `._>    */      typeof s == "string" &&
/*                       */      s.length &&
/*       g o o d w i n   */      s.trim() != ""
/*                       */    );
/*************************/  }

// Make sure i is a whole integer with a value of m or greater
function toIntCheck(n, m) { var i = toInt(n); checkInt(i, m); return i; }
function toInt(n) {
	var i = parseInt(n, 10);//specify radix of base10
	if (i+"" !== n) toss("round trip mismatch", {n, i});
	return i;
}
function checkInt(i, m) { if (badInt(i, m)) toss("Must be an integer m or higher", {i, m}); }
function minInt(i, m) { return !badInt(i, m); }
function badInt(i, m) {
	if (!m) m = 0;//TODO potentially huge change, make sure -5 is truthy enough to make it through this
	return !(typeof i === "number" && !isNaN(i) && Number.isInteger(i) && i >= m);
}

// Make sure a is an array with at least one element
function checkArray(a) { if (badArray(a)) toss("Must be an array", {a}); }
function badArray(a) {
	return !(typeof a === "object" && typeof a.length == "number" && a.length > 0);
}
//TODO added new stuff, write test cases

exporty({checkText, badText, hasText});
exporty({toIntCheck, toInt, checkInt, minInt, badInt});
exporty({checkArray, badArray});



















//   _            _   
//  | |_ _____  _| |_ 
//  | __/ _ \ \/ / __|
//  | ||  __/>  <| |_ 
//   \__\___/_/\_\\__|
//                    

function start(s, n)  { return clip(s, 0, n); }            // Clip out the first n characters of s, start(s, 3) is CCCccccccc	
function end(s, n)    { return clip(s, s.length - n, n); } // Clip out the last n characters of s, end(s, 3) is cccccccCCC	
function beyond(s, i) { return clip(s, i, s.length - i); } // Clip out the characters beyond index i in s, beyond(s, 3) is cccCCCCCCC	
function chop(s, n)   { return clip(s, 0, s.length - n); } // Chop the last n characters off the end of s, chop(s, 3) is CCCCCCCccc	
function clip(s, i, n) {                                   // Clip out part of s, clip(s, 5, 3) is cccccCCCcc
	if (i < 0 || n < 0 || i + n > s.length) toss("Avoided clipping beyond the edges of the given string", {s, i, n});
	return s.substring(i, i + n);
}

//TODO these throw if anything is out of bounds, maybe add startSoft, endSoft, beyondSoft that instead return shorter or blank
//bookmark you added this really fast, go through the larger process of actually testing them, and them using them where you need them
function startSoft(s, n)  { return clipSoft(s, 0, n); }
function clipSoft(s, i, n) {
	s = s+"";//fix everything
	if (badInt(i)) i = 0;
	if (badInt(n)) n = 0;

	if (i     > s.length) i = s.length;
	if (i + n > s.length) n = s.length - i;

	return clip(s, i, n);
}
exporty({startSoft, clipSoft});
test(function() {
	ok(clipSoft("abc", 1, 0) == "");
	ok(clipSoft("abc", 1, 1) == "b");
	ok(clipSoft("abc", 1, 2) == "bc");
	ok(clipSoft("abc", 1, 3) == "bc");
});

function has(s, t)    { return                      findFirst(s, t) != -1; } // True if s contains t
function starts(s, t) { return _mightStart(s, t) && findFirst(s, t) == 0; } // True if s starts with t
function ends(s, t)   { return _mightEnd(s, t)   && findLast(s, t) == s.length - t.length; } // True if s ends with t

function cut(s, t)     { return _cut(s, t, findFirst(s, t)); } // Cut s around t to get what's before and after
function cutLast(s, t) { return _cut(s, t, findLast(s, t)); } // Cut s around the last place t appears to get what's before and after
function _cut(s, t, i) {
	if (i == -1) {
		return { found: false, before: s, tag: "", after: "" };
	} else {
		return {
			found:  true, // We found t at i, clip out the text before and after it
			before: start(s, i),
			tag:    clip(s, i, t.length), // Include t to have all parts of s
			after:  beyond(s, i + t.length)
		};
	}
}
// Keep starts() and ends() from making indexOf() scan the whole thing if the first character doesn't even match
function _mightStart(s, t) { return s.length && t.length && s.charAt(0)            == t.charAt(0); }
function _mightEnd(s, t)   { return s.length && t.length && s.charAt(s.length - 1) == t.charAt(t.length - 1); }
// Don't give indexOf() blank strings, because somehow "abc".indexOf("") is 0 first not -1 not found
function findFirst(s, t) { if (s.length && t.length) return s.indexOf(t);     else return -1; }
function findLast(s, t)  { if (s.length && t.length) return s.lastIndexOf(t); else return -1; }

// In a single pass through s, replace whole instances of t1 with t2
function swap(s, t1, t2) {
	var s2 = "";          // Target string to fill with text as we break off parts and make the replacement
	while (s.length) {    // Loop until s is blank, also makes sure it's a string
		var c = cut(s, t1); // Cut s around the first instance of the tag in it
		s2 += c.before;     // Move the part before from s to done
		if (c.found) s2 += t2;
		s = c.after;
	}
	return s2;
}

// Parse out the part of s between t1 and t2
function parse(s, t1, t2) {
	var c1 = cut(s,        t1);
	var c2 = cut(c1.after, t2);
	if (c1.found && c2.found) {
		return {
			found:     true,
			before:    c1.before,
			tagBefore: c1.tag,
			middle:    c2.before,
			tagAfter:  c2.tag,
			after:     c2.after
		};
	} else {
		return { found: false, before: s, tagBefore: "", middle: "", tagAfter: "", after: "" };
	}
}

exporty({start, end, beyond, chop, clip});
exporty({has, starts, ends});
exporty({findFirst, findLast});
exporty({cut, cutLast});
exporty({swap, parse});














//               _ _       
//   _   _ _ __ (_) |_ ___ 
//  | | | | '_ \| | __/ __|
//  | |_| | | | | | |_\__ \
//   \__,_|_| |_|_|\__|___/
//                         

// Describe big sizes and counts in four digits or less
function size4(n)   { return _number4(n, 1024, [" bytes", " KB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"]); }
function number4(n) { return _number4(n, 1000, ["",       " K",  " M",  " B",  " T",  " P",  " E",  " Z",  " Y"]);  }
function _number4(n, power, units) {
	var u = 0; // Start on the first unit
	var d = 1; // Which has a value of 1 each
	while (u < units.length) { // Loop to larger units until we can say n in four digits or less

		var w = Math.floor(n / d); // Find out how many of the current unit we have
		if (w <= 9999) return w + units[u]; // Four digits or less, use this unit

		u++; // Move to the next larger unit
		d *= power;
	}
	return n+""; // We ran out of units
}

exporty({size4, number4});
















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










//                                  _                          _                
//  ___  ___ _ __ __ _ _ __     ___| |__   __ _ _ __ __ _  ___| |_ ___ _ __ ___ 
// / __|/ __| '__/ _` | '_ \   / __| '_ \ / _` | '__/ _` |/ __| __/ _ \ '__/ __|
// \__ \ (__| | | (_| | |_) | | (__| | | | (_| | | | (_| | (__| ||  __/ |  \__ \
// |___/\___|_|  \__,_| .__/   \___|_| |_|\__,_|_|  \__,_|\___|\__\___|_|  |___/
//                    |_|                                                       

//return s with everything except 0-9 and a-f removed
//useful as a part of checking drive hash strings
function onlyHashCharacters(s) {

	var a1 = "0".charCodeAt(0); var a2 = "9".charCodeAt(0);
	var a3 = "a".charCodeAt(0); var a4 = "f".charCodeAt(0);

	var t = "";
	for (var i = 0; i < s.length; i++) {
		var c = s.charAt(i); var a = c.charCodeAt(0);
		if ((a >= a1 && a <= a2) || (a >= a3 && a <= a4)) t += c;
	}
	return t;
}

//return s with everything except 0-9 and a-z removed
//useful as a part of correcting tags
function onlyLettersAndNumbers(s) {

	var a1 = "0".charCodeAt(0); var a2 = "9".charCodeAt(0);
	var a3 = "a".charCodeAt(0); var a4 = "z".charCodeAt(0);

	var t = "";
	for (var i = 0; i < s.length; i++) {
		var c = s.charAt(i); var a = c.charCodeAt(0);
		if ((a >= a1 && a <= a2) || (a >= a3 && a <= a4)) t += c;
	}
	return t;
}

//return s with everything except 0-9 a-z A-Z and .-_ removed
//useful as a part of correcting blog names
function onlyNameCharacters(s) {

	var a1 = "0".charCodeAt(0); var a2 = "9".charCodeAt(0);
	var a3 = "a".charCodeAt(0); var a4 = "z".charCodeAt(0);
	var a5 = "A".charCodeAt(0); var a6 = "Z".charCodeAt(0);

	var a7 = ".".charCodeAt(0);
	var a8 = "-".charCodeAt(0);
	var a9 = "_".charCodeAt(0);

	var t = "";
	for (var i = 0; i < s.length; i++) {
		var c = s.charAt(i); var a = c.charCodeAt(0);
		if ((a >= a1 && a <= a2) || (a >= a3 && a <= a4) || (a >= a5 && a <= a6) || a == a7 || a == a8 || a == a9) t += c;
	}
	return t;
}

exporty({onlyHashCharacters, onlyLettersAndNumbers, onlyNameCharacters});

test(function() {
	var s = " 0123456789 一二三 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ .-_ 🌴? yes ";
	ok(onlyHashCharacters(s) == "0123456789abcdefe");
	ok(onlyLettersAndNumbers(s) == "0123456789abcdefghijklmnopqrstuvwxyzyes");
	ok(onlyNameCharacters(s) == "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-_yes");
});











//                                                 _                 
//  ___  ___ _ __ __ _ _ __    _ __ __ _ _ __   __| | ___  _ __ ___  
// / __|/ __| '__/ _` | '_ \  | '__/ _` | '_ \ / _` |/ _ \| '_ ` _ \ 
// \__ \ (__| | | (_| | |_) | | | | (_| | | | | (_| | (_) | | | | | |
// |___/\___|_|  \__,_| .__/  |_|  \__,_|_| |_|\__,_|\___/|_| |_| |_|
//                    |_|                                            

//factoring math, time, date, and moment stuff into one place

//return a random integer between and including the given minimum and maximum
//pass 0 and 1 to flip a coin, 1 and 6 to roll a dice, and so on
//https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function randomBetween(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}
exporty({randomBetween});










//   ____        _       
//  |  _ \  __ _| |_ ___ 
//  | | | |/ _` | __/ _ \
//  | |_| | (_| | ||  __/
//  |____/ \__,_|\__\___|
//                       

var pattern1 = "YYYYMMMDD";
var pattern2 = "YYYY-MMM-DD h:mma";
var pattern3 = "YYYY MMMM D dddd h:mm A";
var pattern4 = "YYYYMMMDD.HH.mm.ss.SSS";
var pattern5 = "ddhh:mm:ss.SSS";
function sayDateDataShort(t) { checkInt(t); return moment(t).utc().format(pattern1).toLowerCase(); }//for file names
function sayDateDataLong(t)  { checkInt(t); return t + " " + ((new Date(t)).toUTCString()); }//for front matter
function sayDatePageShort(t) { checkInt(t); return moment(t).format(pattern2); }//for the page, local time zone
function sayDatePageLong(t)  { checkInt(t); return moment(t).format(pattern3); }
function tickToText(t)       { checkInt(t); return moment(t).utc().format(pattern4).toLowerCase(); }//for the location bar
function textToTick(s)       {              return moment.utc(s, pattern4).utc().valueOf(); }
exporty({sayDateDataShort, sayDateDataLong, sayDatePageShort, sayDatePageLong, tickToText, textToTick});
function nowStamp()          { return sayStamp(now()); }
function sayStamp(t)         { checkInt(t); return moment(t).format(pattern5); }
exporty({nowStamp, sayStamp});

noop(function() {

	var t = now();
	log(margin(`
		${sayDateDataLong(t)} -- sayDateDataLong()
		${sayDateDataShort(t)} -- sayDateDataShort()

		${sayDatePageShort(t)} -- sayDatePageShort()
		${sayDatePageLong(t)} -- sayDatePageLong()

		${tickToText(t)} -- tickToText()

		${t} -- now()
		${textToTick(tickToText(t))} -- round trip
	`));

	for (var i = 0; i < 10000; i++) {
		var t = now() - randomBetween(1, 20*Time.year);
		ok(textToTick(tickToText(t)) == t);
	}
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










