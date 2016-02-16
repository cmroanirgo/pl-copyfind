pl-copyfind
=============

* A plagarism comparing function *

This project was inspired by the work of Dr Lou Bloomfield's CopyFind/WCopyFind windows programs (http://plagiarism.bloomfieldmedia.com/z-wordpress/software/wcopyfind/). Algorithmically there is an equivalence, however it is not a 'port' per-se.

Key Differences:
-----------------

pl-copyfind does not:

* ~download and extract the 'text' from various file formats. Depending upon the platform (either nodejs or a browser), there are a few solutions to this:
 - mozilla's 'readbility' functions, which generally does excellent work at extracting *only* the main article text from web pages
 - npm package `node-readbility`, which is far inferior to the above, but is more geared toward 'drop-in' usage. It can accept html or urls.
 - npm package `textract`. This is a 'one stop shop' for reading in a plethora of file formats. Note that this cannot be used in a browser solution, as it requires external binaries to be installed (although a server-side solution can be used for this).
* ~generate output files. This is up to you, if you need it.
* ~allow multiple inputs/comparisons.

pl-copyfind does:

* ~have equivalent switches that the original program uses. You can ignore all of them and run your own sanitisers however.
* ~allow the 'hashes' to be stored in a cache. This is up to you to implement (although easy using one of many npm file caching packages).
* ~allow multple inputs (comparators and comparatees). 

Usage:
--------

Example 1. Single input comparison
```
var copyfind = require('pl-copyfind');

...

var options = { }; 
var src_text = "original text is here. lorem ipsum dolorem est";
var check_text = "I plagiarised lorem ipsum dolorem est and I reckon I can get away with it";

copyfind(src_text, check_text, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	if (!data.matches.length)
		return false; // no comparison found

	for (var i=0; i<data.matches.length; i++) {
		var match = data.matches[i]; 
		var orig_text = src_text.substr(match.text1.pos, match.text1.len);
		var copied_text = check_text.substr(match.text2.pos, match.text2.len);
		console.log("Match found: \n" + orig_text + "\nvs. \n" + copied_text + "\nat position : " + match.text2.pos);
	}
});

```

Example 2. Multiple input comparisons
```
var copyfind = require('pl-copyfind');

...

var options = { }; 
var src_texts = ["original text is here. lorem ipsum dolorem est","This is another original text that is also dolorem est"];
var check_texts = ["I plagiarised lorem ipsum dolorem est and I reckon I can get away with it","I didn't do lorem est this time"];

copyfind(src_texts, check_texts, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	if (!data.matches.length)
		return false; // no comparison found on any text

	for (var i=0; i<data.matches.length; i++) {
		var match = data.matches[i]; 
		var orig_text = src_texts[match.text1.index].substr(match.text1.pos, match.text1.len);
		var copied_text = check_texts[match.text2.index].substr(match.text2.pos, match.text2.len);
		console.log("Match found: #["+match.text2.index+"]\n" + orig_text + "\nvs. #["+match.text2.index+"]\n" + copied_text + "\nat position : " + match.text2.pos);
	}
});

```







