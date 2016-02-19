var copyfind = require("../index.js");
var fs = require("fs");

var options = { 
	      PhraseLength:34
		, WordThreshold:100
		, bIgnorePunctuation:true
		, MismatchTolerance: 6
		, bSkipNonwords:true
		, bBuildReport: true
		, bBriefReport:true

	};
var roysoptions = {
	PhraseLength:4,
	WordThreshold:5,
	bIgnoreCase:true,
	bIgnorePunctuation:true,
	bIgnoreOuterPunctuation:true,
	MismatchPercentage:100,
	bBuildReport:true
};
var left = fs.readFileSync(__dirname + "/test2-left.txt", 'utf8');
var right = fs.readFileSync(__dirname + "/test2-right.txt", 'utf8');


function _callback(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	var html = "<!DOCTYPE html>\n" +
					"<html><head><meta charset=\"UTF-8\"><style>html,body { height:100%;}\n" +
					".doc { display:inline-block;width:45%; overflow:scroll;height:90%;max-height: 100%; border:1px solid #888; margin:1em;padding:1em;} \n"+
					".match { color:#ff0000 } .match-partial { color:#007F00 } .match-filtered { color:#0000FF}\n" +
					"</style></head><body>\n" +
					(data.html) + 
					"</body></html>";
	fs.writeFileSync(__dirname +'/test2.html', html, 'utf8');
	console.log("written test2.html")
}

copyfind(left, right, options, _callback);

