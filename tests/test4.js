var copyfind = require("../index.js");
var fs = require("fs");
var util = require("util");

var startTime = Date.now();

var options = { 
	      PhraseLength:6
		, WordThreshold:6
		, bIgnorePunctuation:true
		, bBuildReport: true
		, bBriefReport: true

	};

// get the sonnets from: http://plagiarism.bloomfieldmedia.com/z-wordpress/software/copyfind/
var sonnet1 = fs.readFileSync(__dirname + "/sonnets/Sonnet I.txt", 'utf8');
var sonnet2 = fs.readFileSync(__dirname + "/sonnets/Sonnet II.txt", 'utf8');
var group1 = [sonnet1,sonnet2];
var group4 = [];
var group4caches;

// load all the sonnets in this folder
var files = fs.readdirSync(__dirname + "/sonnets");
for(var i=0; i<files.length; i++) {
	group4.push(fs.readFileSync(__dirname + "/sonnets/" + files[i], 'utf8'));	
}

console.log("loaded " +group4.length + " files in group4");

console.log("comparing group1 against group4...");
copyfind(group1, group4, options, function (err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	console.log("Comparison ran in " + data.executionTime + " ms\n");

	// console.log("data.matches:\n"+util.inspect(data.matches, {showHidden: false, depth: null}));

	console.log("data.html:\n"+data.html) ; 
	group4caches = data.hashesR;
});

console.log("re-running group1 against group4, using cached values...");
options.hashesR = group4caches;
copyfind(group1, group4, options, function (err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	console.log("Comparison ran in " + data.executionTime + " ms\n");

	// console.log("data.matches:\n"+util.inspect(data.matches, {showHidden: false, depth: null}));

	//console.log("data.html:\n"+data.html) ; 
});

console.log("comparing group4 against itself, using cached values...");
options.hashesL = group4caches;
options.hashesR = group4caches;
copyfind(group4, group4, options, function (err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	console.log("Comparison ran in " + data.executionTime + " ms\n");

	// console.log("data.matches:\n"+util.inspect(data.matches, {showHidden: false, depth: null}));

	//console.log("data.html:\n"+data.html) ; 
});

console.log("rerunning last comparison, using cached values, without html reports...");
options.bBuildReport = false;
copyfind(group4, group4, options, function (err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	console.log("Comparison ran in " + data.executionTime + " ms\n");

	// console.log("data.matches:\n"+util.inspect(data.matches, {showHidden: false, depth: null}));

	//console.log("data.html:\n"+data.html) ; // should return "undefined"
});

console.log("rerunning last comparison, without cached values, without html reports...");
delete options.hashesL;
delete options.hashesR;
copyfind(group4, group4, options, function (err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	console.log("Comparison ran in " + data.executionTime + " ms\n");

	// console.log("data.matches:\n"+util.inspect(data.matches, {showHidden: false, depth: null}));

	//console.log("data.html:\n"+data.html) ; // should return "undefined"
});

console.log("Total test script execution time = " + (Date.now()-startTime) + " ms");


