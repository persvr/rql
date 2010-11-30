/**
 * Provides a Query constructor with chainable capability. For example:
 * var Query = require("./query").Query;
 * query = Query();
 * query.executor = function(query){
 *		require("./js-array").query(query, params, data); // if we want to operate on an array
 * };
 * query.eq("a", 3).le("b", 4).forEach(function(object){
 *	 // for each object that matches the query
 * });
 */
({define:typeof define!="undefined"?define:function(deps, factory){module.exports = factory(exports, require("./parser"), require("./js-array"));}}).
define(["exports", "./parser", "./js-array"], function(exports, parser, jsarray){

var parseQuery = parser.parseQuery;
try{
	var when = require("promised-io/promise").when;
}catch(e){
	when = function(value, callback){callback(value)};
}

parser.Query = function(seed, params){
	if (typeof seed === 'string')
		return parseQuery(seed, params);
	var q = new Query();
	if (seed && seed.name && seed.args)
		q.name = seed.name, q.args = seed.args;
	return q;
};
exports.Query = parser.Query;
//exports.knownOperators = ["and", "or", "eq", "ne", "le", "lt", "gt", "ge", "sort", "in", "notin", "select", "exclude", "contains", "notcontains", "values","aggregate","distinct","limit","recurse"];
exports.knownOperators = Object.keys(jsarray.operators).concat(Object.keys(jsarray.jsOperatorMap));
exports.knownScalarOperators = ["mean", "sum", "min", "max", "count", "first", "one"];
exports.arrayMethods = ["forEach", "reduce", "map", "filter", "indexOf", "some", "every"];

function Query(name){
	this.name = name || "and";
	this.args = [];
}
exports.Query.prototype = Query.prototype;
Query.prototype.toString = function(){
	return this.name === "and" ?
		this.args.map(queryToString).join("&") :
		queryToString(this);
};

function queryToString(part) {
		if (part instanceof Array) {
				return '('+part.map(function(arg) {
						return queryToString(arg);
				}).join(",")+')';
		}
		if (part && part.name && part.args) {
				return [
						part.name,
						"(",
						part.args.map(function(arg, pos) {
								// N.B. args[0] should be joined with '/' if it's an array
								if (pos === 0 && arg instanceof Array)
									return arg.map(function(x){return queryToString(x);}).join('/');
								return queryToString(arg);
						}).join(","),
						")"
				].join("");
		}
		return exports.encodeValue(part);
};

function encodeString(s) {
		if (typeof s === "string") {
				s = encodeURIComponent(s);
				if (s.match(/[\(\)]/)) {
						s = s.replace("(","%28").replace(")","%29");
				};
		}
		return s;
}

exports.encodeValue = function(val) {
		var encoded;
		if (val === null) val = 'null';
		if (val !== parser.converters["default"]('' + (
				val.toISOString && val.toISOString() || val.toString()
		))) {
				var type = typeof val;
				if(val instanceof RegExp){
					// TODO: control whether to we want simpler glob() style
					val = val.toString();
					var i = val.lastIndexOf('/');
					type = val.substring(i).indexOf('i') >= 0 ? "re" : "RE";
					val = encodeString(val.substring(1, i));
					encoded = true;
				}
				if(type === "object"){
						type = "epoch";
						val = val.getTime();
						encoded = true;
				}
				if(type === "string") {
						val = encodeString(val);
						encoded = true;
				}
				val = [type, val].join(":");
		}
		if (!encoded && typeof val === "string") val = encodeString(val);
		return val;
};

exports.updateQueryMethods = function(){
	exports.knownOperators.forEach(function(name){
		Query.prototype[name] = function(){
			var newQuery = new Query();
			newQuery.executor = this.executor;
			var newTerm = new Query(name);
			newTerm.args = Array.prototype.slice.call(arguments);
			newQuery.args = this.args.concat([newTerm]);
			return newQuery;
		};
	});
	exports.knownScalarOperators.forEach(function(name){
		Query.prototype[name] = function(){
			var newQuery = new Query();
			newQuery.executor = this.executor;
			var newTerm = new Query(name);
			newTerm.args = Array.prototype.slice.call(arguments);
			newQuery.args = this.args.concat([newTerm]);
			return newQuery.executor(newQuery);
		};
	});
	exports.arrayMethods.forEach(function(name){
		Query.prototype[name] = function(){
			var args = arguments;
			return when(this.executor(this), function(results){
				return results[name].apply(results, args);
			});
		};
	});

};

exports.updateQueryMethods();

/* recursively iterate over query terms calling 'fn' for each term */
Query.prototype.walk = function(fn, options){
	options = options || {};
	function walk(name, terms){
		(terms || []).forEach(function(term, i, arr) {
			var args, func, key, x;
			term != null ? term : term = {};
			func = term.name;
			args = term.args;
			if (!func || !args) {
				return;
			}
			if (args[0] instanceof Query) {
				walk.call(this, func, args);
			} else {
				fn.call(this, func, args);
			}
		});
	}
	walk.call(this, this.name, this.args);
};

/* disambiguate query */
Query.prototype.normalize = function(options){
	options = options || {};
	options.primaryKey = options.primaryKey || 'id';
	var result = {
		original: this,
		sort: [],
		limit: [Infinity, 0, Infinity],
		skip: 0,
		limit: Infinity,
		select: [],
		values: false
		// TODO: cache conditions
		// TODO: flag for non-void conditions
	};
	function normal(func, args){
		if (func === 'sort' || func === 'select') {
			result[func] = args;
			result[func+'1'] = result[func].map(function(x){
				var o = {};
				var a = /([-+]*)(.+)/.exec(x);
				o[a[2]] = a[1].charAt(0) === '-' ? -1 : 1;
				return o;
			});
			result[func+'2'] = {};
			result[func].forEach(function(x){
				var a = /([-+]*)(.+)/.exec(x);
				result[func+'2'][a[2]] = a[1].charAt(0) === '-' ? -1 : 1;
			});
		} else if (func === 'limit') {
			var limit = args;
			result.skip = +limit[1] || 0;
			limit = +limit[0] || 0;
			if (options.hardLimit && limit > options.hardLimit)
				limit = options.hardLimit;
			result.limit = limit;
			result.needCount = true;
		} else if (func === 'values') {
			result.values = true;
		} else if (func === 'eq') {
			// cache primary key equality -- useful to distinguish between .get(id) and .query(query)
			var t = typeof args[1];
			if (args[0] === options.primaryKey && ['string','number'].indexOf(t) >= 0) {
				result.id = String(args[1]);
			}
		}
	}
	this.walk(normal);
	return result;
};

return exports;
});
