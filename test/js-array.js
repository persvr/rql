var assert = require("assert"),
	Query = require("../lib/query").Query,
    executeQuery = require("../lib/js-array").executeQuery;

var data = [
	{
		"with.dot": "dotted",
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
	assert.equal(executeQuery("with.dot=dotted", {}, data).length, 1); 
	assert.equal(executeQuery("not(in(price,(5,10)))", {}, data).length, 0); 
	assert.equal(executeQuery("not(in(price,(5)))", {}, data).length, 1); 
	assert.equal(executeQuery("any(tags,even)", {}, data).length, 1); 
	assert.equal(executeQuery("any(tags,fun)", {}, data).length, 2); 
	assert.equal(executeQuery("all(tags,fun)", {}, data).length, 1); 
	assert.equal(executeQuery("all(tags,even)", {}, data).length, 0); 
	assert.equal(executeQuery("not(all(tags,even))", {}, data).length, 2); 
};

exports.testFiltering1 = function() {
	var data = [{"path.1":[1,2,3]}, {"path.1":[9,3,7]}];
	assert.deepEqual(executeQuery("any(path,3)&sort()", {}, data), []); // path is undefined
	assert.deepEqual(executeQuery("any(path.1,3)&sort()", {}, data), data); // 3 found in both
	assert.deepEqual(executeQuery("not(any(path.1,3))&sort()", {}, data), []); // 3 found in both
	assert.deepEqual(executeQuery("not(any(path.1,7))&sort()", {}, data), [data[0]]); // 7 found in second
};


if (require.main === module)
    require("patr/runner").run(exports);
