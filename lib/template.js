/**
 * This module provides RQL parsing. For example:
 * var parsed = require("./parser").parse("b=3&le(c,5)");
 */
(function(define){
define(["./js-array", "./parser"], function(jsArray, parser){
var executeQuery = jsArray.executeQuery,
	operators = jsArray.operators,
	parseQuery = parser.parseQuery;
return {
	isValid: function(query, template){
		query = parseQuery(query);
		template = parseQuery(template);
		if(query && query.name){
			return query.name == template.name &&
				operators[name].commutative ? 
					setMatch(query.args, template.args) : 
					query.args.every(function(arg, i){ return isValid(arg, template.args[i]);});
		}
		if(query === template){
			return true;
		}
		if(template && template.variable){
			return executeQuery(template, {}, [value]).length;
		}
	},
	substitute: function(template, variables){
		return template.replace(/\{([^\{]*)\}/g, function(t, name){
			return encodeURIComponent(variables[name]);
		});
	}
};
function setMatch(queryArgs, templateArgs){
	templateArgs = templateArgs.concat(); // clone
	var found = [];
	var allMatched = queryArgs.every(function(arg){
		return templateArgs.some(function(templateArg, i){
			if(isValid(arg, templateArg)){
				if(templateArg.multiple){
					found.push(templateArg);
				}else{
					templateArgs.splice(i, 1);
				}
				return true;
			}
		});
	});
	return allMatched && !templateArgs.some(function(arg){
		return !arg.optional && found.indexOf(arg)  == -1;
	});
}
});
})(typeof define!="undefined"?define:function(factory){module.exports = factory(require("./js-array"))});