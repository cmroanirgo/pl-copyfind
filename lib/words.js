"use strict";
var _ = require("underscore");

;(function() {
	var root           = this;
	var previous_exports = root.words;


	//function ispunct(ch) { return /[!"#$%&'()*+,-.\/:;<=>?@\[\\\]^_`{|}~]/.test(ch); }
	function ispunct(ch) { 
		ch = ch.charCodeAt(0);
		return (ch>=0x21 && ch<=0x2F)  || (ch>=0x3a && ch<=0x40) || (ch>=0x5B && ch<=0x60) || (ch>=0x7F); 
		 }
	function isdigit(ch) { return /[0-9]/.test(ch); }
	function isalpha(ch) { return /[a-zA-Z]/.test(ch); }

	var _words = {

		removePunct: function(str)
		{
			var letters = [];
			
			for(var i=0;i<str.length;i++)
			{
				var ch = str.charAt(i);
				if(!ispunct(ch))
					letters.push(ch);
			}
			return letters.join("");
		},

		outerPunct: function(str)
		{
			var l=0, r=str.length-1;

			for(var i=0;i<str.length;i++)
			{
				var ch = str.charAt(i);

				if(ispunct(ch))
					l=i; 
				else 
					break;
			}
			for(var i=str.length-1;i>l;i--)
			{
				var ch = str.charAt(i);
				if(ispunct(ch))
					r=i-1;
				else break;
			}
			if (r<l) 
				return "";
			return str.substr(l, r-l+1);
		},

		removeNumbers: function(str)
		{
			var letters = [];
			
			for(var i=0;i<str.length;i++)
			{
				var ch = str.charAt(i);
				if(!isdigit(ch))
					letters.push(ch);
			}
			return letters.join("");
		},

		toLowerCase: function(str)
		{
			return str.toLowerCase();
		},

		isWord: function(str)
		{
			var wordlen = str.length;
			if(wordlen < 1) return false;
			if( !isalpha(str.charAt(0)) ) return false;
			if( !isalpha(str.charAt(wordlen-1)) ) return false;

			for(var i=1;i<wordlen-2;i++)
			{
				var ch = str.charAt(i);
				if( isalpha(ch) ) continue;
				if( ch == '-' ) continue;
				if( ch == '\'' ) continue;
				return false;
			}
			return true;
		},

		/*hash: function(s) {
			// using Java's hash method (except on empty string)
			var hash = 0, i, l, char;
	      if (s.length == 0) return 1;
	      for (i = 0, l = s.length; i < l; i++) {
	        char = s.charCodeAt(i);
	        hash = ((hash << 5) - hash) + char;
	        hash |= 0; // Convert to 32bit integer
	      }
	      return hash;			

		}*/
		hash: function(str)
		{
			var inhash = 0;
			var charcount = 0;
			var char;

			if(str.length == 0) 
				return 1;	// if word is null, return 1 as hash value
			else 
			for (var i=0; i<str.length; i++)
			{
				char = str.charCodeAt(i);
				inhash=	((inhash << 7)|(inhash >>> 25)) ^ char;	// xor into the rotateleft(7) of inhash
	       		inhash >>>= 0; // Convert to 32bit unsigned integer
			}
			return inhash;
		}

	};


	var words = root.words = _words;

	if( !_.isUndefined(exports)) {
		if( !_.isUndefined(module) && module.exports ) {
			exports = module.exports = words;
		}
		exports.words = words;
	} 
	else {
		root.words = words;
	}
}).call(this);

