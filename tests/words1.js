var wordlib = require("../lib/words");


//var util = require('util');
//console.log(util.inspect(wordlib, {showHidden: false, depth: null}));

//var text = "Clave litter'atura da con, de con clave esseva durante, via tempore tentation le. Debitas international duo o, uno e asia voluntate? Pan auxiliar flexione de, svedese millennios ha pro!";
var text = "Don't blame8 me!"
console.log("original text> " + text);
console.log("removePunct> " + wordlib.removePunct(text));
console.log("outerPunct> " + wordlib.outerPunct(text));
console.log("removeNumbers> " + wordlib.removeNumbers(text));
console.log("toLowerCase> " + wordlib.toLowerCase(text));
console.log("hash> " + wordlib.hash(text));
console.log("check('aword')> " + wordlib.check("aword"));
console.log("check('not aword')> " + wordlib.check("not aword"));
