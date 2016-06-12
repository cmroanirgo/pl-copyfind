/**
 * @license
 * Copyright (c) 2016 Craig Monro (kodespace.com)
 * No part of this file may be copied or retransmitted without adhering to the GPL license.
 * This copyright notice may not be removed, without express permission of the copyright holder.
 * 
 * This file is part of pl-copyfind, a Javascript fork of WCopyFind/CopyFind.
 *
 * pl-copyfind is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * pl-copyfind is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with pl-copyfind.  If not, see <http://www.gnu.org/licenses/> or
 * <https://github.com/cmroanirgo/pl-copyfind/blob/master/LICENSE.md/>
 */

"use strict";

var _ = require("underscore");
var wordlib = require("./lib/words");
var TextReader = require("./lib/textreader");

;(function() {

	var root           = this;
	var previous_exports = root.copyfind;


	/*
	USAGE:
		textL: txt (the original), or an array of texts 
		textR: txt (the 'other'), or an array
		options: { } // see 'defaultOptions' below
		callback: function(err, data) { 
			if (err) throw "An error occurred: " + err.message;
			// where data contains:
			data.hashesL: {} cacheable object data for re-use. put this in options to re-use
			data.hashesR: {}  ''
			// matches is a 2 dimensioned array
			data.matches[0][0]: [  // first index is array of 'left texts', 2nd index is 'right texts' 
					{ 
						textL { pos: 0..n, length: 0..n, wordCount: 0..n } 
						textR { pos: 0..n, length: 0..n, wordCount: 0..n } 
					}
			]
			//... if however, the source textL and textR are NOT arrays, then data.matches is reduced accordingly:
			data.matches: [  
					{ 
						textL { pos: 0..n, length: 0..n, wordCount: 0..n } 
						textR { pos: 0..n, length: 0..n, wordCount: 0..n } 
					}
			]
			data.html:  
				// this is available when options.bBuildReport = true
				// contains html "inner" text. You need to add styling and body tags. eg:
					<!DOCTYPE html>
					<html><head><meta charset="UTF-8"><style>html,body { height:100%;}
					.doc { display:inline-block;width:45%; overflow:scroll;height:90%;max-height: 100%; border:1px solid #888; margin:1em 1%;padding:1em;} 
					.match { color:#ff0000 } .match-partial { color:#007F00 }
					</style></head><body>

			data.executionTime: // in milliseconds

	


		}

		)
	*/

	var defaultOptions = {
			PhraseLength: 6, // Shortest Phrase to Match
			WordThreshold: 100, // Fewest Matches to Report
			SkipLength: 20, // if bSkipLongWords, this number used
			MismatchTolerance: 2, // #Most Imperfections to Allow
			MismatchPercentage: 80, // Minimum % of Matching Words

			bIgnoreCase: false, // Ignore Letter Case
			bIgnoreNumbers: false, // Ignore Numbers
			bIgnoreOuterPunctuation: false, // Ignore Outer Punctuation
			bIgnorePunctuation: false, // Ignore Punctuation
			bSkipLongWords: false, // Skip Long Words
			bSkipNonwords: false, // Skip Non-Words

			bBuildReport: true,
			bBriefReport: true
			// , bTerseReport: false // show ONLY the matching text
	};


	function _error(callback, message, returnCode) {
		var err = { message: message };
		callback(err);
		//return _.isUndefined(returnCode) ? 100 : returnCode;
		return false;
	}

	function _buildHashes(text, options, callback) {
			
		var indoc = new TextReader(text);

		var QWordHash = [];
		var WordPos = [];  // positions of the start of each word
		while( !indoc.isFinished() )				// loop until an eof
		{
			var pos = indoc.getPos();
			var word = indoc.getWord();				// get the next word
			if(options.bIgnorePunctuation) word = wordlib.removePunct(word);	// if ignore punctuation is active, remove punctuation
			if(options.bIgnoreOuterPunctuation) word = wordlib.outerPunct(word);	// if ignore outer punctuation is active, remove outer punctuation
			if(options.bIgnoreNumbers) word = wordlib.removeNumbers(word);			// if ignore numbers is active, remove numbers
			if(options.bIgnoreCase) word = word.toLowerCase(word);				// if ignore case is active, remove case
			if(options.bSkipLongWords && (word.length > options.SkipLength) ) continue;	// if skip too-long words is active, skip them
			if(options.bSkipNonwords && !(wordlib.isWord(word)) ) continue;		// if skip nonwords is active, skip them

			WordPos.push(pos);
			QWordHash.push(wordlib.hash(word));					// hash-code the word and save that hash
		}

		var Words = QWordHash.length;
		var data = {};
		data.WordsTotal = Words;							// save number of words in document entry
		data.WordHash =	QWordHash;		// allocate array for hash-coded words in doc entry
		data.WordPos = WordPos;
		data.SortedWords = [];
		data.DocLength = text.length;
		
		for (var i=0;i<Words;i++)			// loop for all the words in the document
		{
			data.SortedWords.push({ number:i, hash: QWordHash[i]});	// copy over hash-coded words
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

		data.i = { // todo. change how this works (ie use ranges instead)
			MatchMarkL: [],
			MatchMarkR: [],
			MatchAnchorL: [],
			MatchAnchorR: [],
			MatchMarkTempL: [],
			MatchMarkTempR: [],
			MatchingDocumentPairs: 0,
			MatchingWordsPerfect: 0,
			MatchingWordsTotalL: 0,
			MatchingWordsTotalR: 0,
		};
		var matches = [];


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
						
						var getTextLen = function(doc, first, last) { 
							var f = doc.WordPos[first];
							var l;
							if (last==doc.WordPos.length-1) //
								l = doc.DocLength;
							else
								l = doc.WordPos[last+1]; 
							return l-f; 
						};
						
						var imperfectPosL = [];
						var imperfectPosR = [];

						for(i=FirstLp;i<=LastLp;i++)				// loop for all left matched words
						{
							data.i.MatchMarkL[i]=data.i.MatchMarkTempL[i];	// copy over left matching markup
							if(data.i.MatchMarkTempL[i]==WORD_PERFECT) data.i.MatchingWordsPerfect++;	// count the number of perfect matching words (same as for right document)
							else imperfectPosL.push({pos:docL.WordPos[i],
									length: getTextLen(docL,i,i)});
							data.i.MatchAnchorL[i]=Anchor;				// identify the anchor for this phrase
						}
						data.i.MatchingWordsTotalL += LastLp-FirstLp+1;	// add the number of words in the matching phrase, whether perfect or flawed matches
						for(i=FirstRp;i<=LastRp;i++)				// loop for all right matched words
						{
							data.i.MatchMarkR[i]=data.i.MatchMarkTempR[i];	// copy over right matching markup
							data.i.MatchAnchorR[i]=Anchor;				// identify the anchor for this phrase
							if(data.i.MatchMarkTempR[i]!=WORD_PERFECT) 
								imperfectPosR.push({pos:docR.WordPos[i],
									length: getTextLen(docR,i,i)});
						}
						data.i.MatchingWordsTotalR += LastRp-FirstRp+1;	// add the number of words in the matching phrase, whether perfect or flawed matches



						var match = { 
								textL:{ 
										pos:docL.WordPos[FirstLp], 
										length:getTextLen(docL, FirstLp, LastLp), 
										wordCount: LastLp-FirstLp+1,
										skipped:imperfectPosL },
								textR:{ 
										pos:docR.WordPos[FirstRp], 
										length:getTextLen(docR, FirstRp, LastRp), 
										wordCount: LastRp-FirstRp+1,
										skipped:imperfectPosR }
							};
						matches.push(match);
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

		data.matches[docL.docNum][docR.docNum] = matches;
		return -1;
	}

	/*function _documentToHtml_old(text, MatchMark, MatchAnchor, words, hrefThis, hrefOther, options)
	{
		// delimiter types
		var DEL_TYPE_NONE 		= 0;
		var DEL_TYPE_WHITE 		= 1;
		var DEL_TYPE_NEWLINE 	= 2;
		var DEL_TYPE_EOF 		= 3;

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
						else if(indoc._delimiterType == DEL_TYPE_NEWLINE) m_fHtml.push("\n<br>\n");			// print a break for a new line
					}

					continue;
				}

				break;
			}
		
			if( (!options.bBriefReport) || (xMatch == WORD_PERFECT) || (xMatch == WORD_FLAW) )
			{
				m_fHtml.push(_.escape(word));			// print the character, using UTF8 translation
				if(indoc._delimiterType == DEL_TYPE_WHITE) m_fHtml.push(" ");					// print a blank for white space
				else if(indoc._delimiterType == DEL_TYPE_NEWLINE) m_fHtml.push("\n<br>\n");			// print a break for a new line
			}
		}
		if(LastMatch==WORD_PERFECT) m_fHtml.push("</span>");	// close out red markups if they were active
		else if(LastMatch==WORD_FLAW) m_fHtml.push("</span>");	// close out green italics if they were active
		else if(LastMatch==WORD_FILTERED)  m_fHtml.push("</span>");	// close out blue markups if they were active
		if(LastAnchor>0) m_fHtml.push("</a>");	// close out any active anchor
		return m_fHtml.join("");
	}


	function _reportMatchedPair_old(textL, textR, docL, docR, options, data)
	{
		var leftHtml  = _documentToHtml_old(textL[docL.docNum],data.i.MatchMarkL,data.i.MatchAnchorL,docL.WordsTotal,"docL", "docR", options); 
		var rightHtml = _documentToHtml_old(textR[docR.docNum],data.i.MatchMarkR,data.i.MatchAnchorR,docR.WordsTotal,"docR", "docL", options); 
		var html = "";
		if (textL.length>1 || textR.length>1)
			html += "<div class='doc-container'><h2>Comparison results of #" + docL.docNum + " and #"+docR.docNum+"</h2>";
		html += "<div class='doc' id='docL'>" + leftHtml + "</div>\n" +
				"<div class='doc' id='docR'>" + rightHtml + "</div>\n" +
					"";
		if (textL.length>1 || textR.length>1)
			html += "</div>";
		data.htmlmatches.push(html);
		return -1;
	}*/


	function ASSERT(bool, text) {
		if (!bool) 
			throw "ASSERTION! " + text;
	}

	function _briefKeepRight(str) { // given a text with paragraphs, keep the last para
		var i = str.lastIndexOf("\n\n");
		if (i>0)
			return str.slice(i+2);
		return str;
	}
	function _briefKeepLeft(str) { // give a text with paragraphs, keep the first one
		var i = str.indexOf("\n\n");
		if (i>0)
			return str.slice(0, i);
		return str;

	}
	function _brief(text, brieflen, bFirst, bLast) {
		if (brieflen>0) {
			if (brieflen==1) 
				return ""; // special case brieflen. (don't show any leadin/lead out)
			if (bFirst) return brieflen<(text.length+3) ? "..." + _briefKeepRight(text.slice(-brieflen)) : text;
			if (bLast) return brieflen<(text.length+3) ? _briefKeepLeft(text.slice(0,brieflen)) + "..." : text;
			if (text.length<(brieflen*2)) return text;
			return _briefKeepLeft(text.slice(0,brieflen)) + "...\n\n\n..." + _briefKeepRight(text.slice(-brieflen));
		}
		return text;
	}

	function _briefMatch(text, matchlen) {
		// shortens any matched text to something smaller, if it's particularly big
		if (matchlen>1 && text.length>matchlen*3) {
			var l = text.slice(0, matchlen);
			var r = text.slice(-matchlen);
			return _.escape(l) + "<span class='match-removed'>[ long matching section removed ]</span>" + _.escape(r); 
		}
		return _.escape(text);
	}

	function _buildDoc(text, idbase, side, otherside, matches, options) {
		if (!matches.length)
			return '';

		// sort the relevant matches in document order 
		var sorted = [];
		for (var i=0; i<matches.length; i++) {
			var match = matches[i]["text" + side]; // eg matches[i].textL
			match.num = i+1;
			sorted.push(match);
		}
		sorted.sort(function(a,b) {
			return a.pos - b.pos;
		});
		var brieflen = options.bBriefReport ? (options.bTerseReport ? 1 : options.PhraseLength*3*5) : 0; // = approx 100 words. (*3 is magic number, *5 is approx #letters per word)
		var matchlen = (options.PhraseLength*3*5) * 2;
		// split the text into sections
		var html = []; // it's more efficient this way (as a list of strings there's (apparently) less memory munging on big files)
		var lastpos = 0;
		for (var i=0; i<sorted.length; i++)
		{
			var m = sorted[i];
			ASSERT(m.pos>=lastpos, "sorted matches are out of order");
			ASSERT(m.length>0, "matches' length is invalid");
			var l = _.escape(_brief(text.slice(lastpos, m.pos),brieflen,lastpos==0, false)); // untreated text to the left of this match
			var t; // this matches' text
			if (!m.skipped || m.skipped.length==0) { // easy case. no skipped words
				t = '<span class="match">' + _briefMatch(text.slice(m.pos, m.pos+m.length), matchlen) + '</span>';
			} else { // need to further split into skipped words
				t = [];
				lastpos = m.pos;
				for (var j=0; j<m.skipped.length; j++) {
					var sk = m.skipped[j];
					ASSERT(sk.pos>=lastpos, "skipped matches are out of order");
					ASSERT(sk.pos>=m.pos && (sk.pos+sk.length)<=(m.pos+m.length), "sorted matches are outside expected range");
					var l2 = _briefMatch(text.slice(lastpos, sk.pos), matchlen); // untreated text to the left of this match
					var t2 = '</span><span class="match-partial">' + _.escape(text.slice(sk.pos, sk.pos+sk.length)) + '</span><span class="match">';
					lastpos = sk.pos + sk.length;
					t.push(l2 + t2);
				}
				if (lastpos < m.pos + m.length)
					t.push(_briefMatch(text.slice(lastpos,  m.pos + m.length), matchlen));

				t = '<span class="match">' + t.join("") + '</span>'; // flatten the list of strings
				//remove any empty spans (it can happen)
				t = t.split('<span class="match"></span>').join("");
			}
			//wrap this match in an anchor, pointing to the 'other side' (it will do the same in return)
			t = '<a href="#'+idbase+otherside+m.num + '" id="'+idbase+side + m.num + '" data-match="'+m.num+'">' + t + '</a>';
			html.push(l + t);

			lastpos = m.pos+m.length;
		}
		if (lastpos < text.length)
			html.push(_.escape(_brief(text.slice(lastpos),brieflen,false, true)));

		// flatten the list of strings
		html = html.join("").split("\n").join("\n<br>\n");
		return '\n\n<div class="doc" id="'+idbase+side+'">\n' + html + '</div>';
	}

	function _reportMatchedPair(textL, textR, docL, docR, options, data)
	{
		var idbase = 'doc';
		if (textL.length>1 || textR.length>1)
		 idbase += docL.docNum + "" +docR.docNum;

		var matches = data.matches[docL.docNum][docR.docNum];
		if (matches.length==0)
			return '';// nothing matched
		var numWords = 0;
		for (var i=0; i<matches.length; i++) {
			var match = matches[i]["textL"]; 
			numWords += match.wordCount;
		}
		var leftHtml  = _buildDoc(textL[docL.docNum], idbase, 'L', 'R', matches, options); 
		var rightHtml = _buildDoc(textR[docR.docNum], idbase, 'R', 'L', matches, options);
		var html = "";
		if (textL.length>1 || textR.length>1)
			html += "\n\n<div class='doc-container'><h2>Comparison results of #" + docL.docNum + " and #"+docR.docNum+"</h2>\n";
		html += "<div class='stats'>"+numWords+' Words in '+matches.length+" incidents</div>\n";
		html += leftHtml + rightHtml +
					"\n";
		if (textL.length>1 || textR.length>1)
			html += "</div>";
		return html;
	}


	function _copyfind(textL, textR, options, callback) {
		if (!Date.now) {
			Date.now = function now() {
				return new Date().getTime();
			};
		}

		var startTime = Date.now();

		if (_.isFunction(options)) {
		    callback = options;
		    options = {};
		}

		_.defaults(options, defaultOptions); 

		// turn sources into an array
		var singleDimensionedParams = _.isString(textL) && _.isString(textR);
		if (_.isString(textL)) textL = [textL];
		if (_.isString(textR)) textR = [textR]; 

		// check inputs
		if (!_.isArray(textL) || textL.length==0 || !_.isString(textL[0])) { return _error(callback, "'Left' source text must be a string or an array of strings.") }
		if (!_.isArray(textR) || textR.length==0 || !_.isString(textR[0])) { return _error(callback, "'Right' source text must be a string or an array of strings.") }

		var data = {
			matches: [],
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
				var hashdata = _buildHashes(textL[i], options, callback);
				if (!hashdata) return; 
				data.hashesL.push(hashdata);

			}
		}
		if (!data.hashesR.length) {
			for (var i=0; i<textR.length; i++) {
				var hashdata = _buildHashes(textR[i], options, callback);
				if (!hashdata) return; 
				data.hashesR.push(hashdata);

			}
		}

		// CompareDocument::SetupComparisons
		var htmlmatches = [];

		// compare each Left doc against each Right one:
		for (var l=0; l<data.hashesL.length; l++) {
			// build a 2d array for the matches
			data.matches[l] = [];

			for (var r=0; r<data.hashesR.length; r++) {
				data.hashesL[l].docNum = l;
				data.hashesR[r].docNum = r;
				data.matches[l][r] = []; 
				var nRc = _comparePair(data.hashesL[l], data.hashesR[r], options, data);
				if (nRc>0) {
					// erm. some error
					return _error(callback, "Error "+nRc+" occurred while comparing Document "+l+" and Document "+r, nRc);
				}
				if(options.bBuildReport && (data.i.MatchingWordsPerfect>=options.WordThreshold))		// if there are enough matches to report,
				{
					data.i.MatchingDocumentPairs++;				// increment count of matched pairs of documents
					var html = _reportMatchedPair(textL, textR, data.hashesL[l], data.hashesR[r], options, data);
					if (html.length) htmlmatches.push(html);
				}
			}
		}
		if (options.bBuildReport)
		{
			data.html = htmlmatches.join("");
		}

		if (singleDimensionedParams) {
			var matches00 = data.matches[0][0];
			data.matches = matches00; // remove the 2d array aspect, if not needed.
		}
		data.executionTime = Date.now()-startTime;
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



