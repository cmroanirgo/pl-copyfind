var copyfind = require("../index.js");
var util = require("util");

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
			bBasic_Characters: false

*/
var options = { PhraseLength:4,
	WordThreshold:16,
		bIgnoreOuterPunctuation:true }; 
var src_text = "original text is here. Lor'em ipsum dolor sit amet, consectetur adipiscing elit\nEuropee linguas vocabulario del se, un computator vocabulario primarimente sia? Millennios unidirectional lo via, usate medical anteriormente duo o! Iste vices intermediari qui su, un nos russo original! De vices interlingua sia, qui su brevissime interlingua. Ha gode union duo, es del maximo historia!\nDuo veni clave westeuropee al, tu lingua internet grammatica sed. Da post quales tentation non, illo post lingua uso ha. Prime union qualcunque su per. Su tamben flexione immediatemente pan, in lateres utilitate publicationes sia. Sia de articulo qualcunque conferentias? Non pote libere historia es, duo message extrahite tu.\nUso al usate distinguer. De nos vista maximo computator? Europeo introductori con il. Il uso medio parlar! Su vide facto essentialmente que, ha anque cinque association via, lo tres regno sed.\nDe sitos lingua instruite nos. Nos proposito articulos principalmente tu, articulo demonstrate non un! Inviar religion vocabulario que e, al occidental methodicamente per? Sia origine grammatica angloromanic al, del veni paternoster independente de? Super spatios del su. ";
var check_text = "I plagiarised lorem ipsum dolor sit amet and I reckon I can get away with it. un computator vocabulario primarimente sia? Milennios unidirectional lo via, \nusate medical anteriormente duo o! Iste vices intermediari";

copyfind(src_text, check_text, options, function(err, data) {
	if (err) 
		throw "Failed to compare: " + err.toString();

	//console.log(util.inspect(data, {showHidden: false, depth: null}));

	/*
	if (!data.matches.length)
		return false; // no comparison found

	for (var i=0; i<data.matches.length; i++) {
		var match = data.matches[i]; 
		var orig_text = src_text.substr(match.text1.pos, match.text1.len);
		var copied_text = check_text.substr(match.text2.pos, match.text2.len);
		console.log("Match found: \n" + orig_text + "\nvs. \n" + copied_text + "\nat position : " + match.text2.pos);
	}*/
	var html = "<!DOCTYPE html>\n" +
					"<html><head><style>html,body { height:100%;}\n" +
					".doc { display:inline-block;width:45%; overflow:scroll;height:90%;max-height: 100%; border:1px solid #888; margin:1em;padding:1em;} \n"+
					".match { color:#ff0000 } .match-partial { color:#007F00 } .match-filtered { color:#0000FF}\n" +
					"</style></head><body>\n" +
					data.htmlmatches.join("") + 
					"</body></html>";
	console.log(html);
});