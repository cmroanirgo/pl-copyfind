pl-copyfind
=============

*A plagarism comparing function*

This project was inspired by the work of Dr Lou Bloomfield's CopyFind/WCopyFind windows programs (http://plagiarism.bloomfieldmedia.com/z-wordpress/software/wcopyfind/). Algorithmically there is an equivalence, however there are marked differences.

Key Differences:
-----------------

pl-copyfind does not:

* ~download and extract the 'text' from various file formats. Depending upon the platform (either nodejs or a browser), there are a few solutions to this:
 
    - mozilla's 'readbility' functions, which generally does excellent work at extracting *only* the main article html from web pages
    - npm package `textract`. This is a 'one stop shop' for reading in a plethora of file formats. Note that this cannot be used in a browser solution, as it requires external binaries to be installed (although a server-side solution can be used for this).
    - the demo package illustrates a poor man's method of converting html to text, using purely regex's.
* ~generate output files, although an optional html output is available.

pl-copyfind does:

* ~have equivalent switches that the original program uses. You can ignore all of them and run your own sanitisers however.
* ~allow the 'hashes' to be stored in a cache. This is up to you to implement (although easy using one of many npm file caching packages).
* ~allow multple inputs (comparators and comparatees). 

Default Options:
-------

```
	PhraseLength: 6, // Shortest Phrase to Match
	WordThreshold: 100, // Fewest Matches to Report
	SkipLength: 20, // Needs bSkipLongWords. words this long are skipped
	MismatchTolerance: 2, // #Most Imperfections to Allow
	MismatchPercentage: 80, // Minimum % of Matching Words
	bIgnoreCase: false, // Ignore Letter Case
	bIgnoreNumbers: false, // Ignore Numbers
	bIgnoreOuterPunctuation: false, // Ignore Outer Punctuation
	bIgnorePunctuation: false, // Ignore Punctuation
	bSkipLongWords: false, // Skip Long Words
	bSkipNonwords: false, // Skip Non-Words
	bBuildReport: true, // generate html output
	bBriefReport: true, // show a html report of matches with lead in and out text, for context (otherwise shows full source text). Needs bBuildReport
	bTerseReport: false // show ONLY the matching text. Needs bBuildReport
```




Usage:
--------
See the demos folder for a complete working example that does not require a web server to execute (just open index.html from your local file system to try it out).

### Example 1. Single input comparison

```
var copyfind = require('pl-copyfind');
...
var options = { PhraseLength: 3, WordThreshold: 3, bIgnoreCase:true}; 
var src_text = "original text is here. lorem ipsum dolorem est";
var check_text = "I plagiarised lorem ipsum DOLOREM est and I reckon I can get away with it";
 
copyfind(src_text, check_text, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();
 
	if (!data.matches.length)
		return false; // no comparison found
 
 	console.log("Found " + data.matches.length + " matches"); // expect 1
	for (var i=0; i<data.matches.length; i++) {
		var match = data.matches[i]; 
		var orig_text = src_text.substr(match.textL.pos, match.textL.length);
		var copied_text = check_text.substr(match.textR.pos, match.textR.length);
		console.log("Match found: \n" + orig_text + "\nvs. \n" + copied_text + "\nat position : " + match.textR.pos);
	}
});
```

### Example 2. Multiple input comparisons
```
var copyfind = require('pl-copyfind');
...
var options = { PhraseLength: 3, WordThreshold: 3 }; 
var src_texts = ["original text is here. lorem ipsum dolorem est","This is another original text that is also dolorem est"];
var check_texts = ["I plagiarised lorem ipsum dolorem est and I reckon I can get away with it","I didn't do lorem est this time"];

copyfind(src_texts, check_texts, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	if (!data.matches.length)
		return false; // no comparison found on any text

    for (var l=0; l<src_texts.length; l++) {
        for (var r=0; r<check_texts.length; r++) {
        	for (var i=0; i<data.matches[l][r].length; i++) {
        		var match = data.matches[l][r][i]; 
        		var orig_text = src_texts[l].substr(match.textL.pos, match.textL.length);
        		var copied_text = check_texts[r].substr(match.textR.pos, match.textR.length);
        		console.log("Match found: #["+l+"]\n" + orig_text + "\nvs. #["+r+"]\n" + copied_text + "\nat position : " + match.textR.pos);
        	}
        }
	}
});

```

### Example 3. Render html reports
```
var copyfind = require('pl-copyfind');
...
var options = { bBuildReport:  true }; 
var src_text = "original text is here. lorem ipsum dolorem est";
var check_text = "I plagiarised lorem ipsum dolorem est and I reckon I can get away with it";

copyfind(src_texts, check_text, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();
    alert(data.html);
});

```

### Example 4. Cache results for faster re-comparisons
```
var copyfind = require('pl-copyfind');
...
var options = {  }; 
var src_text = "original text is here. lorem ipsum dolorem est";
var check_text1 = "I plagiarised lorem ipsum dolorem est and I reckon I can get away with  with it";
var check_text2 = "Another plagiarised lorem ipsum dolorem est and I reckon I can get away with it";

copyfind(src_texts, check_text1, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();
    alert("execution took " + data.executionTime + " ms");
    options.hashesL = data.hashesL; // save the hashdata. You *could* store this in a file cache too
});

// re-uses hashesL for better performance
copyfind(src_texts, check_text2, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();
    alert("execution took " + data.executionTime + " ms");
});
```


Licensing:
---------

This module and all its source is licensed under GPL, which is the original licensing of WCopyFind/CopyFind source. The license file can be found at [https://github.com/cmroanirgo/pl-copyfind/blob/master/LICENSE.md].

Please note that if you *use* this library, as-is, then your project need not be subject to what is commonly called 'GPL cancer'. It is only if you embrace and extend the module that you must also release your source code, also under a GPL license.
However, as all things go, it would be appreciated if attribution for the work done in this project was acknowledged in your source and information pages.








