/**
 * not_.js
 * license AGPL
 * Copyright (c) 2017 Craig Monro (cmroanirgo), kodespace.com. All rights reserved.
 * v1.4
 **/
// a lighter use for underscore. ie just helper functions, really

var n_ = {
  isString: function (x) { return typeof x == 'string'; }
, isUndefined: function (x) { return (typeof x == 'undefined'); }
, isDefined: function (x) { return !_isUndefined(x); }
, isBool: function (x) { return typeof x == 'boolean'; }
, isString: function (x) { return typeof x == 'string'; }
, isObject: function (x) { return x !== null && typeof x === 'object'}
, isFunction: function (x) { return typeof x == 'function'; }
, isArray: Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
}
, isEmpty: function(x) { return n_.isString(x) && !x.length; }
, forEach: function(obj, cb) {
	return Array.prototype.forEach.call(obj, cb);
}

, toRealArray: function (arrayIsh) {
		if (n_.isArray(arrayIsh)) return arrayIsh;
		var ar = [];
		for (var i=0; i<arrayIsh.length; i++)
			ar.push(arrayIsh[i]);
		return ar;
	}
, extend: function() {
    var target = arguments[0];

    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        if (!source) continue;

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }

    return target;
}
, htmlEncode: function(html) { return html.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/&/g, "&amp;"); }
, min: function (x,y) { return x<y ? x : y; }
, max: function (x,y) { return x>=y ? x : y; }
, dump: function (obj) { 
	var cache = [];
	return JSON.stringify(obj, function(key, value) {
		    if (typeof value === 'object' && value !== null) {
		        if (cache.indexOf(value) !== -1) {
		            // Circular reference found, discard key
		            return;
		        }
		        // Store value in our collection
		        cache.push(value);
		    }
		    if (key == 'parent')
		    	return '[parent]'; // this will always generate unwanted recursion
		    return value;
		}
	, 4); }
};

module.exports = n_;