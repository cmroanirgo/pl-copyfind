var copyfind = require("../index.js");
var fs = require("fs");
var util = require("util");
var _ = require("underscore");

var options = { 
	      PhraseLength:34
		, WordThreshold:100
		, bIgnorePunctuation:true
		, MismatchTolerance: 6
		//, bSkipNonwords:true
		, bBuildReport: false

	};

var left = fs.readFileSync(__dirname + "/test2-left.txt", 'utf8');
var right = fs.readFileSync(__dirname + "/test2-right.txt", 'utf8');


copyfind([left], [right], options, function (err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	console.log("Comparison ran in " + data.executionTime + " ms\n");

	console.log("datamatches[0][0]:\n"+util.inspect(data.matches[0][0], {showHidden: false, depth: null}));

	console.log("data.html:\n"+data.html) ; // should return "undefined"
}
);

