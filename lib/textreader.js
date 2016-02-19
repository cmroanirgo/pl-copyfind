"use strict";
var _ = require("underscore");

;(function() {
	var root           = this;
	var previous_exports = root.TextReader;


	// delimiter types
	var DEL_TYPE_NONE 		= 0;
	var DEL_TYPE_WHITE 		= 1;
	var DEL_TYPE_NEWLINE 	= 2;
	var DEL_TYPE_EOF 		= 3;

	function isspace(ch) { return /[ \f\n\r\t\v\u00A0\u2028\u2029]/.test(ch); } // better cross browser stability than /\s/.  (IE <> firefox)
	function iscntrl(ch) { ch = ch.charCodeAt(0); return (ch>0 && ch < 0x1F) || (ch == 0xff) || (ch == 0x7f); }

	var TextReader = root.TextReader = function(text) { // similar to InputDocument.cpp
			this._text = text; 
			this._textpos = 0;
			this._gotWord = false;
			this._gotDelimiter = false;
			this._gotChar = false;
			this._char = '';
			this._delimiterType = DEL_TYPE_NONE;
	}
	TextReader.prototype.constructor = TextReader;
	TextReader.prototype.isFinished = function() { return this._delimiterType == DEL_TYPE_EOF; }
	
	TextReader.prototype.getCharTxt = function() {
/*
			// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt 'getWholeChar'
			function getWholeCharAndI(str, i) {
			  var code = str.charCodeAt(i);

			  if (isNaN(code)) {
			    return ''; // Position not found
			  }
			  if (code < 0xD800 || code > 0xDFFF) {
			    return [str.charAt(i), i]; // Normal character, keeping 'i' the same
			  }

			  // High surrogate (could change last hex to 0xDB7F to treat high private 
			  // surrogates as single characters)
			  if (0xD800 <= code && code <= 0xDBFF) {
			    if (str.length <= (i + 1)) {
			      return ''; //throw 'High surrogate without following low surrogate';
			    }
			    var next = str.charCodeAt(i + 1);
			      if (0xDC00 > next || next > 0xDFFF) {
			        return ''; //throw 'High surrogate without following low surrogate';
			      }
			      return [str.charAt(i) + str.charAt(i + 1), i + 1];
			  }
			  // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
			  if (i === 0) {
			    return ''; //throw 'Low surrogate without preceding high surrogate';
			  }
			  var prev = str.charCodeAt(i - 1);

			  // (could change last hex to 0xDB7F to treat high private surrogates
			  // as single characters)
			  if (0xD800 > prev || prev > 0xDBFF) {
			    return ''; //throw 'Low surrogate without preceding high surrogate';
			  }
			  // Return the next character instead (and increment)
			  return [str.charAt(i + 1), i + 1];
			}
			if (this._textpos<this._text.length)
			{
				var ci = getWholeCharAndI(this._text, this._textpos);
				if (!_.isArray(ci))
					return -1;
				this._textpos = ci[1]+1;
				return ci[0];
			}
			return -1;
*/
			
			if (this._textpos<this._text.length)
				return this._text.charAt(this._textpos++);
			return -1;
			
		}

	TextReader.prototype.getPos = function() {
		var pos = this._textpos; 
		//if (this._gotDelimeter) pos--;
		if (this._gotChar) pos--;
		return pos; 
	}
	TextReader.prototype.getWord = function() {
			var letters = [];

			this._gotWord = false;
			this._gotDelimiter = false;
			this._delimiterType = DEL_TYPE_NONE;

			while(true)
			{
				if(this._gotChar) this._gotChar = false; // check to see if we already have the next character
				else this._char=this.getCharTxt(); // otherwise, get the next character (normal or UTF-8)
				
				if(this._char < 0) // check for EOF encountered
				{
					this._delimiterType = DEL_TYPE_EOF;
					var s = letters.join(""); // finish the word off
					return s;
				}
				else if( (this._char == '\n') || (this._char == '\r') ) // check for newline characters
				{
					this._delimiterType = DEL_TYPE_NEWLINE;
					this._gotDelimiter=true;
				}
				else if(isspace(this._char)) // check for white space
				{
					if (DEL_TYPE_WHITE > this._delimiterType)
						this._delimiterType = DEL_TYPE_WHITE; // if delimiter isn't already at NEWLINE, set it to WHITE
					this._gotDelimiter=true;
				}
				else if( iscntrl(this._char) ) continue; // skip any other control characters
				else if(this._gotDelimiter) // have we just reached the end of one or more delimiters?
				{
					if(this._gotWord) // make sure that we have a word
					{
						this._gotChar=true;
						var s = letters.join(""); // finish the word off
						return s;
					}
					else // these were preliminary delimiters and we will ignore them
					{
						this._delimiterType = DEL_TYPE_NONE;
						this._gotDelimiter=false;
						this._gotChar=true; // CM should this be false?
					}
				}
				else if(letters.length<255) // don't let the string get too long
				{
					letters.push(this._char); // add this character to the word
					this._gotWord=true;
				}
			}

			return ""; // can't get here
	}

	if( !_.isUndefined(exports)) {
		if( !_.isUndefined(module) && module.exports ) {
			exports = module.exports = TextReader;
		}
		exports.TextReader = TextReader;
	} 
	else {
		root.TextReader = TextReader;
	}
}).call(this);

