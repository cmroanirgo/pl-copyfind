/**
 *
 * Copyright 2016 Craig Monro
 * 
 *  Licensed under the MIT License
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict";

var _ = require("underscore");
var wordlib = require("./lib/words");

;(function() {

	var root           = this;
	var previous_exports = root.copyfind;


	/*
	USAGE:
		textL: txt (the original), or an array of texts (see matches[n].textL.index to determine what matches made)
		textR: txt (the 'other'), or an array
		options: { } // see 'defaultOptions' below
		callback: function(err, data) { 
			if (err) throw "An error occurred: " + err.message;
			// where data contains:
			// data.hashesL: {} cacheable object data for re-use. put this in options to re-use
			// data.hashesR: {}  ''
			// data.matches: [
					{ 
						textL { index:0; pos: 0..n, len: 0..n } 
						textR { index:0; pos: 0..n, len: 0..n } 
				]
		}

		)
	*/

	var defaultOptions = {
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
	};

	// delimiter types
	var DEL_TYPE_NONE 		= 0;
	var DEL_TYPE_WHITE 		= 1;
	var DEL_TYPE_NEWLINE 	= 2;
	var DEL_TYPE_EOF 		= 3;

	function isspace(ch) { return /[ \f\n\r\t\v\u00A0\u2028\u2029]/.test(ch); } // better cross browser stability than /\s/.  (IE <> firefox)
	function iscntrl(ch) { ch = ch.charCodeAt(0); return (ch>0 && ch < 0x1F) || (ch == 0xff) || (ch == 0x7f); }

	var TextReader = function(text) { // similar to InputDocument.cpp
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
						this._gotChar=true;
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

	function _error(callback, message, returnCode) {
		var err = { message: message };
		callback(err);
		//return _.isUndefined(returnCode) ? 100 : returnCode;
		return false;
	}

	function _readHashes(text, options, callback) {
			
		var indoc = new TextReader(text);

		var QWordHash = [];
		var wordlist = [];  // *debug only*
		while( !indoc.isFinished() )				// loop until an eof
		{
			var word = indoc.getWord();				// get the next word
			if(options.bIgnorePunctuation) word = wordlib.removePunct(word);	// if ignore punctuation is active, remove punctuation
			if(options.bIgnoreOuterPunctuation) word = wordlib.outerPunct(word);	// if ignore outer punctuation is active, remove outer punctuation
			if(options.bIgnoreNumbers) word = wordlib.removeNumbers(word);			// if ignore numbers is active, remove numbers
			if(options.bIgnoreCase) word = word.toLowerCase(word);				// if ignore case is active, remove case
			if(options.bSkipLongWords && (word.length > options.SkipLength) ) continue;	// if skip too-long words is active, skip them
			if(options.bSkipNonwords && !(wordlib.isWord(word)) ) continue;		// if skip nonwords is active, skip them

			wordlist.push(word);
			QWordHash.push(wordlib.hash(word));					// hash-code the word and save that hash
		}

		var Words = QWordHash.length;
		var data = {};
		data.WordsTotal = Words;							// save number of words in document entry
		data.WordHash =	QWordHash;		// allocate array for hash-coded words in doc entry
		data.SortedWords = [];
			
		for (var i=0;i<Words;i++)			// loop for all the words in the document
		{
			data.SortedWords.push({ number:i, hash: QWordHash[i], word: wordlist[i]});	// copy over hash-coded words
		}

		data.SortedWords.sort(function(a,b) {
			return a.hash - b.hash;
		});

		if(options.PhraseLength == 1)	
			data.FirstHash = 0;		// if phraselength is 1 word, compare even the shortest words
		else														// if phrase length is > 1 word, start at first word with more than 3 chars
		{															
			var FirstLong=0;
			for (var i=0;i<Words;i++)									// loop for all the words in the document
			{
				if( (data.SortedWords[i].hash & 0xFFC00000) != 0 )	// if the word is longer than 3 letters, break
					{
						FirstLong=i;
						break;
					}
			}
			data.FirstHash = FirstLong;					// save the number of the first >3 letter word, or the first word
		}

		return data;
	}

var WORD_UNMATCHED 	= -1;
var WORD_PERFECT 	= 0;
var WORD_FLAW 		= 1;
var WORD_FILTERED 	= 2;

	function _comparePair(docL, docR, options, data)
	{
		var WordNumberL,WordNumberR;						// word number for left document and right document
		var WordNumberRedundantL,WordNumberRedundantR;		// word number of end of redundant words
		var iWordNumberL,iWordNumberR;						// word number counter, for loops
		var FirstL,FirstR;									// first matching word in left document and right document
		var LastL,LastR;									// last matching word in left document and right document
		var FirstLp,FirstRp;								// first perfectly matching word in left document and right document
		var LastLp,LastRp;									// last perfectlymatching word in left document and right document
		var FirstLx,FirstRx;								// first original perfectly matching word in left document and right document
		var LastLx,LastRx;									// last original perfectlymatching word in left document and right document
		var Flaws;											// flaw count
		var Hash;
		var MatchingWordsPerfect;							// count of perfect matches within a single phrase
		var Anchor;											// number of current match anchor
		var i;

		data.i.MatchingWordsPerfect=0;
		data.i.MatchingWordsTotalL=0;
		data.i.MatchingWordsTotalR=0;

		function PercentMatching(FirstL,FirstR,LastL,LastR,PerfectMatchingWords)
		{
			return (200*PerfectMatchingWords)/(LastL-FirstL+LastR-FirstR+2);
		}


		for(WordNumberL=0;WordNumberL<docL.WordsTotal;WordNumberL++)	// loop for all left words
		{
			data.i.MatchMarkL[WordNumberL]=WORD_UNMATCHED;		// set the left match markers to "WORD_UNMATCHED"
			data.i.MatchAnchorL[WordNumberL]=0;					// zero the left match anchors
		}
		for(WordNumberR=0;WordNumberR<docR.WordsTotal;WordNumberR++)	// loop for all right words
		{
			data.i.MatchMarkR[WordNumberR]=WORD_UNMATCHED;		// set the right match markers to "WORD_UNMATCHED"
			data.i.MatchAnchorR[WordNumberR]=0;					// zero the right match anchors
		}

		WordNumberL=docL.FirstHash;						// start left at first >3 letter word
		WordNumberR=docR.FirstHash;						// start right at first >3 letter word

		Anchor=0;											// start with no html anchors assigned
							
		while ( (WordNumberL < docL.WordsTotal)			// loop while there are still words to check
				&& (WordNumberR < docR.WordsTotal) )
		{
			// if the next word in the left sorted hash-coded list has been matched
			if( data.i.MatchMarkL[docL.SortedWords[WordNumberL].number] != WORD_UNMATCHED )
			{
				WordNumberL++;								// advance to next left sorted hash-coded word
				continue;
			}

			// if the next word in the right sorted hash-coded list has been matched
			if( data.i.MatchMarkR[docR.SortedWords[WordNumberR].number] != WORD_UNMATCHED )
			{
				WordNumberR++;								// skip to next right sorted hash-coded word
				continue;
			}

			// check for left word less than right word
			if( docL.SortedWords[WordNumberL].hash < docR.SortedWords[WordNumberR].hash )
			{
				WordNumberL++;								// advance to next left word
				if ( WordNumberL >= docL.WordsTotal) break;
				continue;									// and resume looping
			}

			// check for right word less than left word
			if( docL.SortedWords[WordNumberL].hash > docR.SortedWords[WordNumberR].hash )
			{
				WordNumberR++;								// advance to next right word
				if ( WordNumberR >= docR.WordsTotal) break;
				continue;									// and resume looping
			}

			// we have a match, so check redundancy of this words and compare all copies of this word
			Hash=docL.SortedWords[WordNumberL].hash;
			WordNumberRedundantL=WordNumberL;
			WordNumberRedundantR=WordNumberR;
			while(WordNumberRedundantL < (docL.WordsTotal - 1))
			{
				if( docL.SortedWords[WordNumberRedundantL + 1].hash == Hash ) WordNumberRedundantL++;
				else break;
			}
			while(WordNumberRedundantR < (docR.WordsTotal - 1))
			{
				if( docR.SortedWords[WordNumberRedundantR + 1].hash == Hash ) WordNumberRedundantR++;
				else break;
			}
			for(iWordNumberL=WordNumberL;iWordNumberL<=WordNumberRedundantL;iWordNumberL++)	// loop for each copy of this word on the left
			{
				if( data.i.MatchMarkL[docL.SortedWords[iWordNumberL].number] != WORD_UNMATCHED ) continue;	// skip words that have been matched already
				for(iWordNumberR=WordNumberR;iWordNumberR<=WordNumberRedundantR;iWordNumberR++)	// loop for each copy of this word on the right
				{
					if( data.i.MatchMarkR[docR.SortedWords[iWordNumberR].number] != WORD_UNMATCHED ) continue;	// skip words that have been matched already

					// look up and down the hash-coded (not sorted) lists for matches
					data.i.MatchMarkTempL[docL.SortedWords[iWordNumberL].number]=WORD_PERFECT;	// markup word in temporary list at perfection quality
					data.i.MatchMarkTempR[docR.SortedWords[iWordNumberR].number]=WORD_PERFECT;	// markup word in temporary list at perfection quality

					FirstL=docL.SortedWords[iWordNumberL].number-1;	// start left just before current word
					LastL=docL.SortedWords[iWordNumberL].number+1;	// end left just after current word
					FirstR=docR.SortedWords[iWordNumberR].number-1;	// start right just before current word
					LastR=docR.SortedWords[iWordNumberR].number+1;	// end right just after current word

					while( (FirstL >= 0) && (FirstR >= 0) )		// if we aren't at the start of either document,
					{

						// Note: when we leave this loop, FirstL and FirstR will always point one word before the first match
						
						// make sure that left and right words haven't been used in a match before and
						// that the two words actually match. If so, move up another word and repeat the test.

						if( data.i.MatchMarkL[FirstL] != WORD_UNMATCHED ) break;
						if( data.i.MatchMarkR[FirstR] != WORD_UNMATCHED ) break;

						if( docL.WordHash[FirstL] == docR.WordHash[FirstR] )
						{
							data.i.MatchMarkTempL[FirstL]=WORD_PERFECT;		// markup word in temporary list
							data.i.MatchMarkTempR[FirstR]=WORD_PERFECT;		// markup word in temporary list
							FirstL--;									// move up on left
							FirstR--;									// move up on right
							continue;
						}
						break;
					}

					while( (LastL < docL.WordsTotal) && (LastR < docR.WordsTotal) ) // if we aren't at the end of either document
					{

						// Note: when we leave this loop, LastL and LastR will always point one word after last match
						
						// make sure that left and right words haven't been used in a match before and
						// that the two words actually match. If so, move up another word and repeat the test.

						if( data.i.MatchMarkL[LastL] != WORD_UNMATCHED ) break;
						if( data.i.MatchMarkR[LastR] != WORD_UNMATCHED ) break;
						if( docL.WordHash[LastL] == docR.WordHash[LastR] )
						{
							data.i.MatchMarkTempL[LastL]=WORD_PERFECT;	// markup word in temporary list
							data.i.MatchMarkTempR[LastR]=WORD_PERFECT;	// markup word in temporary list
							LastL++;								// move down on left
							LastR++;								// move down on right
							continue;
						}
						break;
					}

					FirstLp=FirstL+1;						// pointer to first perfect match left
					FirstRp=FirstR+1;						// pointer to first perfect match right
					LastLp=LastL-1;							// pointer to last perfect match left
					LastRp=LastR-1;							// pointer to last perfect match right
					MatchingWordsPerfect=LastLp-FirstLp+1;	// save number of perfect matches

					if(options.MismatchTolerance > 0)				// are we accepting imperfect matches?
					{

						FirstLx=FirstLp;					// save pointer to word before first perfect match left
						FirstRx=FirstRp;					// save pointer to word before first perfect match right
						LastLx=LastLp;						// save pointer to word after last perfect match left
						LastRx=LastRp;						// save pointer to word after last perfect match right

						Flaws=0;							// start with zero flaws
						while( (FirstL >= 0) && (FirstR >= 0) )		// if we aren't at the start of either document,
						{

							// Note: when we leave this loop, FirstL and FirstR will always point one word before the first reportable match
							
							// make sure that left and right words haven't been used in a match before and
							// that the two words actually match. If so, move up another word and repeat the test.
							if( data.i.MatchMarkL[FirstL] != WORD_UNMATCHED ) break;
							if( data.i.MatchMarkR[FirstR] != WORD_UNMATCHED ) break;
							if( docL.WordHash[FirstL] == docR.WordHash[FirstR] )
							{
								MatchingWordsPerfect++;				// increment perfect match count;
								Flaws=0;							// having just found a perfect match, we're back to perfect matching
								data.i.MatchMarkTempL[FirstL]=WORD_PERFECT;			// markup word in temporary list
								data.i.MatchMarkTempR[FirstR]=WORD_PERFECT;			// markup word in temporary list
								FirstLp=FirstL;						// save pointer to first left perfect match
								FirstRp=FirstR;						// save pointer to first right perfect match
								FirstL--;							// move up on left
								FirstR--;							// move up on right
								continue;
							}

							// we're at a flaw, so increase the flaw count
							Flaws++;
							if( Flaws > options.MismatchTolerance ) break;	// check for maximum flaws reached
							
							if( (FirstL-1) >= 0 )					// check one word earlier on left (if it exists)
							{
								if( data.i.MatchMarkL[FirstL-1] != WORD_UNMATCHED ) break;	// make sure we haven't already matched this word
								
								if( docL.WordHash[FirstL-1] == docR.WordHash[FirstR] )
								{
									if( PercentMatching(FirstL-1,FirstR,LastLx,LastRx,MatchingWordsPerfect+1) < options.MismatchPercentage ) break;	// are we getting too imperfect?
									data.i.MatchMarkTempL[FirstL]=WORD_FLAW;	// markup non-matching word in left temporary list
									FirstL--;						// move up on left to skip over the flaw
									MatchingWordsPerfect++;			// increment perfect match count;
									Flaws=0;						// having just found a perfect match, we're back to perfect matching
									data.i.MatchMarkTempL[FirstL]=WORD_PERFECT;		// markup word in left temporary list
									data.i.MatchMarkTempR[FirstR]=WORD_PERFECT;		// markup word in right temporary list
									FirstLp=FirstL;					// save pointer to first left perfect match
									FirstRp=FirstR;					// save pointer to first right perfect match
									FirstL--;						// move up on left
									FirstR--;						// move up on right
									continue;
								}
							}

							if( (FirstR-1) >= 0 )					// check one word earlier on right (if it exists)
							{
								if( data.i.MatchMarkR[FirstR-1] != WORD_UNMATCHED ) break;	// make sure we haven't already matched this word

								if( docL.WordHash[FirstL] == docR.WordHash[FirstR-1] )
								{
									if( PercentMatching(FirstL,FirstR-1,LastLx,LastRx,MatchingWordsPerfect+1) < options.MismatchPercentage ) break;	// are we getting too imperfect?
									data.i.MatchMarkTempR[FirstR]=WORD_FLAW;	// markup non-matching word in right temporary list
									FirstR--;						// move up on right to skip over the flaw
									MatchingWordsPerfect++;			// increment perfect match count;
									Flaws=0;						// having just found a perfect match, we're back to perfect matching
									data.i.MatchMarkTempL[FirstL]=WORD_PERFECT;		// markup word in left temporary list
									data.i.MatchMarkTempR[FirstR]=WORD_PERFECT;		// markup word in right temporary list
									FirstLp=FirstL;					// save pointer to first left perfect match
									FirstRp=FirstR;					// save pointer to first right perfect match
									FirstL--;						// move up on left
									FirstR--;						// move up on right
									continue;
								}
							}

							if( PercentMatching(FirstL-1,FirstR-1,LastLx,LastRx,MatchingWordsPerfect) < options.MismatchPercentage ) break;	// are we getting too imperfect?
							data.i.MatchMarkTempL[FirstL]=WORD_FLAW;		// markup word in left temporary list
							data.i.MatchMarkTempR[FirstR]=WORD_FLAW;		// markup word in right temporary list
							FirstL--;								// move up on left
							FirstR--;								// move up on right
						}
			
						Flaws=0;							// start with zero flaws
						while( (LastL < docL.WordsTotal) && (LastR < docR.WordsTotal) ) // if we aren't at the end of either document
						{

							// Note: when we leave this loop, LastL and LastR will always point one word after last match
							
							// make sure that left and right words haven't been used in a match before and
							// that the two words actually match. If so, move up another word and repeat the test.
							if( data.i.MatchMarkL[LastL] != WORD_UNMATCHED ) break;
							if( data.i.MatchMarkR[LastR] != WORD_UNMATCHED ) break;
							if( docL.WordHash[LastL] == docR.WordHash[LastR] )
							{
								MatchingWordsPerfect++;				// increment perfect match count;
								Flaws=0;							// having just found a perfect match, we're back to perfect matching
								data.i.MatchMarkTempL[LastL]=WORD_PERFECT;	// markup word in temporary list
								data.i.MatchMarkTempR[LastR]=WORD_PERFECT;	// markup word in temporary list
								LastLp=LastL;						// save pointer to last left perfect match
								LastRp=LastR;						// save pointer to last right perfect match
								LastL++;							// move down on left
								LastR++;							// move down on right
								continue;
							}

							Flaws++;
							if( Flaws == options.MismatchTolerance ) break;	// check for maximum flaws reached
								
							if( (LastL+1) < docL.WordsTotal )		// check one word later on left (if it exists)
							{
								if( data.i.MatchMarkL[LastL+1] != WORD_UNMATCHED ) break;	// make sure we haven't already matched this word
								
								if( docL.WordHash[LastL+1] == docR.WordHash[LastR] )
								{
									if( PercentMatching(FirstLx,FirstRx,LastL+1,LastR,MatchingWordsPerfect+1) < options.MismatchPercentage ) break;	// are we getting too imperfect?
									data.i.MatchMarkTempL[LastL]=WORD_FLAW;		// markup non-matching word in left temporary list
									LastL++;						// move down on left to skip over the flaw
									MatchingWordsPerfect++;			// increment perfect match count;
									Flaws=0;						// having just found a perfect match, we're back to perfect matching
									data.i.MatchMarkTempL[LastL]=WORD_PERFECT;	// markup word in lefttemporary list
									data.i.MatchMarkTempR[LastR]=WORD_PERFECT;	// markup word in right temporary list
									LastLp=LastL;					// save pointer to last left perfect match
									LastRp=LastR;					// save pointer to last right perfect match
									LastL++;						// move down on left
									LastR++;						// move down on right
									continue;
								}
							}

							if( (LastR+1) < docR.WordsTotal )	// check one word later on right (if it exists)
							{
								if( data.i.MatchMarkR[LastR+1] != WORD_UNMATCHED ) break;	// make sure we haven't already matched this word

								if( docL.WordHash[LastL] == docR.WordHash[LastR+1] )
								{
									if( PercentMatching(FirstLx,FirstRx,LastL,LastR+1,MatchingWordsPerfect+1) < options.MismatchPercentage ) break;	// are we getting too imperfect?
									data.i.MatchMarkTempR[LastR]=WORD_FLAW;		// markup non-matching word in right temporary list
									LastR++;						// move down on right to skip over the flaw
									MatchingWordsPerfect++;			// increment perfect match count;
									Flaws=0;						// having just found a perfect match, we're back to perfect matching
									data.i.MatchMarkTempL[LastL]=WORD_PERFECT;	// markup word in left temporary list
									data.i.MatchMarkTempR[LastR]=WORD_PERFECT;	// markup word in right temporary list
									LastLp=LastL;					// save pointer to last left perfect match
									LastRp=LastR;					// save pointer to last right perfect match
									LastL++;						// move down on left
									LastR++;						// move down on right
									continue;
								}
							}

							if( PercentMatching(FirstLx,FirstRx,LastL+1,LastR+1,MatchingWordsPerfect) < options.MismatchPercentage ) break;	// are we getting too imperfect?
							data.i.MatchMarkTempL[LastL]=WORD_FLAW;		// markup word in left temporary list
							data.i.MatchMarkTempR[LastR]=WORD_FLAW;		// markup word in right temporary list
							LastL++;								// move down on left
							LastR++;								// move down on right
						}
					}
					if( MatchingWordsPerfect >= options.PhraseLength )	// check that phrase has enough perfect matches in it to mark
					{
						Anchor++;									// increment anchor count
						for(i=FirstLp;i<=LastLp;i++)				// loop for all left matched words
						{
							data.i.MatchMarkL[i]=data.i.MatchMarkTempL[i];	// copy over left matching markup
							if(data.i.MatchMarkTempL[i]==WORD_PERFECT) data.i.MatchingWordsPerfect++;	// count the number of perfect matching words (same as for right document)
							data.i.MatchAnchorL[i]=Anchor;				// identify the anchor for this phrase
						}
						data.i.MatchingWordsTotalL += LastLp-FirstLp+1;	// add the number of words in the matching phrase, whether perfect or flawed matches
						for(i=FirstRp;i<=LastRp;i++)				// loop for all right matched words
						{
							data.i.MatchMarkR[i]=data.i.MatchMarkTempR[i];	// copy over right matching markup
							data.i.MatchAnchorR[i]=Anchor;				// identify the anchor for this phrase
						}
						data.i.MatchingWordsTotalR += LastRp-FirstRp+1;	// add the number of words in the matching phrase, whether perfect or flawed matches
					}
				}
			}
			WordNumberL=WordNumberRedundantL + 1;			// continue searching after the last redundant word on left
			WordNumberR=WordNumberRedundantR + 1;			// continue searching after the last redundant word on right
		}

		/*
		data.i.Compares++;										// increment count of comparisons
		if( (data.i.Compares%data.i.CompareStep)	== 0 )				// if count is divisible by 1000,
		{
			fwprintf(data.i.fLog,L"Comparing Documents, %d Completed\n",data.i.Compares);
			fflush(data.i.fLog);
		}
		*/
		return -1;
	}

	function _documentToHtml(text, MatchMark, MatchAnchor, words, hrefThis, hrefOther, options)
	{
		var wordcount=0;								// current word number

		var word;
		var DelimiterType=DEL_TYPE_WHITE;

		var xMatch;
		var xAnchor;

		var LastMatch=WORD_UNMATCHED;
		var LastAnchor=0;

		var iReturn;
		var m_fHtml = [];

		var indoc = new TextReader(text);

		for(wordcount=0;wordcount<words;wordcount++)	// loop for every word
		{
			xMatch=MatchMark[wordcount];
			xAnchor=MatchAnchor[wordcount];

			if((LastMatch!=xMatch) || (LastAnchor!=xAnchor))	// check for a change of markup or anchor
			{
				if(LastMatch==WORD_PERFECT) m_fHtml.push("</span>");	// close out red markups if they were active
				else if(LastMatch==WORD_FLAW) m_fHtml.push("</span>");	// close out green italics if they were active
				else if(LastMatch==WORD_FILTERED)  m_fHtml.push("</span>");	// close out blue markups if they were active

				if(LastAnchor!=xAnchor)
				{
					if(LastAnchor>0)
					{
						m_fHtml.push("</a>");	// close out any active anchor
						LastAnchor=0;
					}
					if(xAnchor>0)
					{
						if(options.bBriefReport && (wordcount>0) ) m_fHtml.push("</p>\n<p>");	// print a paragraph mark for a new line
						var a = MatchAnchor[wordcount] + "";
						m_fHtml.push("<a id='"+hrefThis+a+"' href='#"+hrefOther+a+"'>");	// start new anchor
					}
				}

				if(xMatch==WORD_PERFECT) m_fHtml.push("<span class='match'>");	// start red for perfection
				else if(xMatch==WORD_FLAW) m_fHtml.push("<span class='match-partial'>");	// start green italics for imperfection
				else if(xMatch==WORD_FILTERED)  m_fHtml.push("<span class='match-filtered'>");	// start blue for filtered
			}

			LastMatch=xMatch;
			LastAnchor=xAnchor;

			while(true)
			{
				if(indoc.isFinished()) return m_fHtml.join("");			// shouldn't happen unless document changed during scan
				word = indoc.getWord(); // if(word.length<1) return m_fHtml.join("");	// get next word

				var tword = word;								// copy word to a temporary
				if(options.bIgnorePunctuation) tword = wordlib.removePunct(tword);	// if ignore punctuation is active, remove punctuation
				if(options.bIgnoreOuterPunctuation) tword = wordlib.outerPunct(tword);	// if ignore outer punctuation is active, remove outer punctuation
				if(options.bIgnoreNumbers) tword = wordlib.removeNumbers(tword);			// if ignore numbers is active, remove numbers
				// no point if(options.bIgnoreCase) tword = word.toLowerCase(tword);				// if ignore case is active, remove case
				if((options.bSkipLongWords && (tword.length > options.SkipLength) ) ||	// if skip too-long words is active, skip them
					(options.bSkipNonwords && !(wordlib.isWord(tword)) )){		// if skip nonwords is active, skip them

					if( (!options.bBriefReport) || (xMatch == WORD_PERFECT) || (xMatch == WORD_FLAW) )
					{
						m_fHtml.push("<span class='match-filtered'>" + _.escape(word) + "</span>");			// This is a filtered word.
						if(indoc._delimiterType == DEL_TYPE_WHITE) m_fHtml.push(" ");					// print a blank for white space
						else if(indoc._delimiterType == DEL_TYPE_NEWLINE) m_fHtml.push("<br>");			// print a break for a new line
					}

					continue;
				}

				break;
			}
		
			if( (!options.bBriefReport) || (xMatch == WORD_PERFECT) || (xMatch == WORD_FLAW) )
			{
				m_fHtml.push(_.escape(word));			// print the character, using UTF8 translation
				if(indoc._delimiterType == DEL_TYPE_WHITE) m_fHtml.push(" ");					// print a blank for white space
				else if(indoc._delimiterType == DEL_TYPE_NEWLINE) m_fHtml.push("<br>");			// print a break for a new line
			}
		}
		if(LastMatch==WORD_PERFECT) m_fHtml.push("</span>");	// close out red markups if they were active
		else if(LastMatch==WORD_FLAW) m_fHtml.push("</span>");	// close out green italics if they were active
		else if(LastMatch==WORD_FILTERED)  m_fHtml.push("</span>");	// close out blue markups if they were active
		if(LastAnchor>0) m_fHtml.push("</a>");	// close out any active anchor
		return m_fHtml.join("");
	}


	function _reportMatchedPair(textL, textR, L, R, docL, docR, options, data)
	{
		var leftHtml  = _documentToHtml(textL[L],data.i.MatchMarkL,data.i.MatchAnchorL,docL.WordsTotal,"docL", "docR", options); 
		var rightHtml = _documentToHtml(textR[R],data.i.MatchMarkR,data.i.MatchAnchorR,docR.WordsTotal,"docR", "docL", options); 
		var html = "";
		if (textL.length>1 || textR.length>1)
			html += "<div class='doc-container'><h2>Comparison results of #" + L + " and #"+R+"</h2>";
		html += "<div class='doc' id='docL'>" + leftHtml + "</div>\n" +
				"<div class='doc' id='docR'>" + rightHtml + "</div>\n" +
					"";
		if (textL.length>1 || textR.length>1)
			html += "</div>";
		data.htmlmatches.push(html);
		return -1;
	}

	function _copyfind(textL, textR, options, callback) {
		if (_.isFunction(options)) {
		    callback = options;
		    options = {};
		}

		_.defaults(options, defaultOptions); 

		// turn sources into an array
		if (_.isString(textL)) textL = [textL];
		if (_.isString(textR)) textR = [textR]; 

		// check inputs
		if (!_.isArray(textL) || textL.length==0 || !_.isString(textL[0])) { return _error(callback, "'Left' source text must be a string or an array of strings.") }
		if (!_.isArray(textR) || textR.length==0 || !_.isString(textR[0])) { return _error(callback, "'Right' source text must be a string or an array of strings.") }

		var data = {
			matches: [],
			htmlmatches: [],
			hashesL: [],
			hashesR: []
		};

		// try an apply existing hashes now.
		if (options.hashesL) {
			if (options.hashesL.length!=textL.length) { return _error(callback, "options.hashesL is invalid"); }
			data.hashesL = options.hashesL; 
		}
		if (options.hashesR) {
			if (options.hashesR.length!=textR.length) { return _error(callback, "options.hashesR is invalid"); }
			data.hashesR = options.hashesR; 
		}

		// convert the text to hashes (aka CompareDocument::LoadDocument)
		if (!data.hashesL.length) {
			for (var i=0; i<textL.length; i++) {
				var hashdata = _readHashes(textL[i], options, callback);
				if (!hashdata) return; 
				data.hashesL.push(hashdata);

			}
		}
		if (!data.hashesR.length) {
			for (var i=0; i<textR.length; i++) {
				var hashdata = _readHashes(textR[i], options, callback);
				if (!hashdata) return; 
				data.hashesR.push(hashdata);

			}
		}

		// CompareDocument::SetupComparisons
		data.i = { // todo. change how this works (ie use ranges instead)
			MatchMarkL: [],
			MatchMarkR: [],
			MatchAnchorL: [],
			MatchAnchorR: [],
			MatchMarkTempL: [],
			MatchMarkTempR: [],
			MatchingDocumentPairs: 0
		};

		// compare each Left doc against each Right one:
		for (var l=0; l<data.hashesL.length; l++) {
			for (var r=0; r<data.hashesR.length; r++) {
				var nRc = _comparePair(data.hashesL[l], data.hashesR[r], options, data);
				if (nRc>0) {
					// erm. some error
					return _error(callback, "Error "+nRc+" occurred while comparing Document "+l+" and Document "+r, nRc);
				}
				if(data.i.MatchingWordsPerfect>=options.WordThreshold)		// if there are enough matches to report,
				{
					data.i.MatchingDocumentPairs++;				// increment count of matched pairs of documents
					_reportMatchedPair(textL, textR, l, r, data.hashesL[l], data.hashesR[r], options, data);
				}
			}
		}

		callback(false, data);
		return true;

	}

	var copyfind = root.copyfind = _copyfind;

	if( !_.isUndefined(exports)) {
		if( !_.isUndefined(module) && module.exports ) {
			exports = module.exports = copyfind;
		}
		exports.copyfind = copyfind;
	} 
	else {
		root.copyfind = copyfind;
	}

}).call(this);



