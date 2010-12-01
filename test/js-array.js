var assert = require("assert"),
	Query = require("../lib/query").Query,
    executeQuery = require("../lib/js-array").executeQuery;

var data = [
	{
		"with/slash": "slashed",
		"nested": {
			"property": "value"
		},
		"price": 10,
		"name": "ten",
		"tags": ["fun", "even"]
	},
	{
		"price": 5,
		"name": "five",
		"tags": ["fun"]
	}];

exports.testFiltering = function() {
	assert.equal(executeQuery("price=lt=10", {}, data).length, 1); 
	assert.equal(executeQuery("price=lt=11", {}, data).length, 2); 
	assert.equal(executeQuery("nested/property=value", {}, data).length, 1); 
	assert.equal(executeQuery("with%2Fslash=slashed", {}, data).length, 1); 
	assert.equal(executeQuery("out(price,(5,10))", {}, data).length, 0); 
	assert.equal(executeQuery("out(price,(5))", {}, data).length, 1); 
	assert.equal(executeQuery("contains(tags,even)", {}, data).length, 1); 
	assert.equal(executeQuery("contains(tags,fun)", {}, data).length, 2); 
	assert.equal(executeQuery("excludes(tags,fun)", {}, data).length, 1); 
	assert.equal(executeQuery("excludes(tags,ne(fun))", {}, data).length, 1); 
	assert.equal(executeQuery("excludes(tags,ne(even))", {}, data).length, 0); 
	assert.equal(executeQuery("excludes(tags,ne(even))", {}, data).length, 2); 
};


if (require.main === module)
    require("patr/runner").run(exports);
