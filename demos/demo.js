/**
 * Copyright (c) 2016 Craig Monro (kodespace.com)
 * No part of this file may be copied or retransmitted without adhering to the GPL license
 * This copyright notice may not be removed, without express permission of the copyright holder.
 * Demo/support functions for the pl-copyfind demonstration package.
 * @module pl-copyfind/demos/demo.js
 * @license GPL
 * https://github.com/cmroanirgo/pl-copyfind/blob/master/LICENSE.md
 */


/**
 * @param {Blob} file - File or Blob object. This parameter is required.
 * @param {string} fileName - Optional file name e.g. "image.png"

// from http://muaz-khan.blogspot.com.au/2012/10/save-files-on-disk-using-javascript-or.html
// eg:


var html = "<!DOCTYPE html>\n" +
            "<html><body>Hi There!</body></html>";

var textFile = new Blob([html], { 
   type: 'text/html'
});
invokeSaveAsDialog(textFile, 'results.html');

 */
function invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        file.type = 'text/html';
    }

    var fileExtension = file.type.split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.target = '_blank';
    hyperlink.download = fileFullName;

    if (!!navigator.mozGetUserMedia) {
        hyperlink.onclick = function() {
            (document.body || document.documentElement).removeChild(hyperlink);
        };
        (document.body || document.documentElement).appendChild(hyperlink);
    }

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    if (!navigator.mozGetUserMedia) {
        URL.revokeObjectURL(hyperlink.href);
    }
}


function fetchUrl(url,callback) {
    // if the URL starts with http
    if(!url.match('^http')) 
        url = 'http://' + url;

  // assemble a YQL call, which allows cross domain requests
  console.log("fetching yql request for: " + url);
  $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22"+
            encodeURIComponent(url)+
            "%22&format=xml'&callback=?",

    function(data) {
        if(data.results[0]) 
        {
          console.log("got yql '" + (data.results[0]+"").slice(0,"20") + "'...");
          callback(false, data.results[0]);
        } 
        else 
        {
            callback( {message:'Error: could not load the page.'} );
        }
    });

}


function stripHtml(html) 
{
    // a poor man's way of sanitising html. It makes mistakes, especially when ">" is in an attribute
    html = html.replace(/\r/g, '').replace(/\t{2,}/g, '\t').replace(/\n/g, ' '); // make it all one big line, space delimited rather than new lines
    html = html.replace(/<\!DOCTYPE [^>]*?>/g, ''); // !DOCTYPE
    html = html.replace(/<!-- .*?-->/g, ''); // remove comments
    html = html.replace(/<\!\[CDATA\[(.*?)\]\]/g, '$1'); // de-XML-ify
    html = html.replace(/<([a-zA-Z]+) [^>]*?\/>/gi, '<$1\/>'); // remove all attributes from self closed elems (eg <img some="noise" /> to <img/>)
    html = html.replace(/<([a-zA-Z]+) [^>]*?>/gi, '<$1>'); // remove all attributes (eg <div some="noise"> to <div>)
    html = html.replace(/<head.*?<\/head>/gi, ''); // remove all metadata
    html = html.replace(/<body>/gi, '').replace(/<\/body>/gi,'').replace(/<html>/gi, '').replace(/<\/html>/gi,''); // remove body & html tags
    html = html.replace(/<script[^>]*?\/>/gi, ' '); // remove self closed script tags: < script src="abc" /> 
    html = html.replace(/<script.*?<\/script>/gi, ' '); // remove inline scripts: < script type="...">...</ script>
    html = html.replace(/<noscript.*?<\/noscript>/gi, ''); // remove noscript
    html = html.replace(/<canvas.*?<\/canvas>/gi, ' '); // remove canvas
    html = html.replace(/<style.*?<\/style>/gi, ' '); // remove style
    html = html.replace(/<footer.*?<\/footer>/gi, ' '). // remove html5 elements that don't contain content
                replace(/<nav.*?<\/nav>/gi, ' ').
                replace(/<header.*?<\/header>/gi, ' ').
                replace(/<figure.*?<\/figure>/gi, ' ');
    var tempDiv = $('<div>' + html + '</div>');
    html = tempDiv.text().replace(/\r/g, '').replace(/ {2,}/g, ' ').replace(/\n{2,}/g, '\n').replace(/\t{2,}/g, '\t');
    return html;
}




var demo = {
    invokeSaveAsDialog: invokeSaveAsDialog,
    fetchUrl:fetchUrl,
    stripHtml:stripHtml
}
if (module)
    module.exports = demo;
