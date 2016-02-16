var copyfind = require("../index.js");
var util = require("util");
var fs = require("fs");

/*
			PhraseLength: 6, // Shortest Phrase to Match
			WordThreshold: 100, // Fewest Matches to Report
			SkipLength: 20, // if bSkipLongWords, this number used
			MismatchTolerance: 2, // #Most Imperfections to Allow
			MismatchPercentage: 80, // Minimum % of Matching Words

			bBriefReport: false,
			bIgnoreCase: false, // Ignore Letter Case
			bIgnoreNumbers: false, // Ignore Numbers
			bIgnoreOuterPunctuation: false, // Ignore Outer Punctuation
			bIgnorePunctuation: false, // Ignore Punctuation
			bSkipLongWords: false, // Skip Long Words
			bSkipNonwords: false, // Skip Non-Words

*/
var options = { 
	      PhraseLength:34
		, WordThreshold:100
		, bIgnorePunctuation:true
		, MismatchTolerance: 6
		//, bSkipNonwords:true
		, bBriefReport:true

	};
var roysoptions = {
	PhraseLength:4,
	WordThreshold:5,
	bIgnoreCase:true,
	bIgnorePunctuation:true,
	bIgnoreOuterPunctuation:true,
	MismatchPercentage:100
};
var left = fs.readFileSync(__dirname + "/test2-left.txt", 'utf8');
var right = fs.readFileSync(__dirname + "/test2-right.txt", 'utf8');


copyfind(left, right, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	var html = "<!DOCTYPE html>\n" +
					"<html><head><meta charset=\"UTF-8\"><style>html,body { height:100%;}\n" +
					".doc { display:inline-block;width:45%; overflow:scroll;height:90%;max-height: 100%; border:1px solid #888; margin:1em;padding:1em;} \n"+
					".match { color:#ff0000 } .match-partial { color:#007F00 } .match-filtered { color:#0000FF}\n" +
					"</style></head><body>\n" +
					(data.htmlmatches.join("")) + 
					"</body></html>";
	fs.writeFileSync(__dirname +'/test2.html', html, 'utf8');
	console.log("written test2.html")
});