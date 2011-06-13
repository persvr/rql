var assert = require("assert"),
	isValid = require("../lib/template").isValid,
    parseQuery = require("../lib/parser").parseQuery;

exports.testSubstitution = function() {
	assert.equal(parseQuery("price=lt={price}", {price:10}).toString(), "lt(price,10)"); 
	assert.equal(parseQuery("lt(price,{price:lt(500)&gt(0)})", {price:10}).toString(), "lt(price,10)"); 
	assert.equal(parseQuery("{op:eq(lt,gt,eq)}({field},{value})&sort({prop})?", {op:"lt", field:"price", value:10, prop:"foo"}).toString(), "lt(price,10)&sort(foo)"); 
//	assert.equal(parseQuery("{op:eq(lt,gt,eq)}({field},{value})&sort({prop})?", {op:"lt", field:"price", value:10}).toString(), "lt(price,10)"); 
};

exports.testValid = function() {
	assert.ok(isValid("price=lt=10", "price=lt={price}")); 
	assert.ok(isValid("price=lt=10", "price=lt={price:lt(500)}")); 
	assert.ok(isValid("price=lt=10", "price=lt={price:lt(500)&gt(0)}")); 
	assert.ok(isValid("price=lt=10", "price=lt={price:type(number)}")); 
	assert.ok(isValid("price=lt=10", "{query}")); 
	assert.ok(isValid("price=lt=10&rating=3&sort(+foo)", "{query}")); 
	assert.ok(isValid("price=lt=10&sort(+foo)", "{query}")); 
	assert.ok(isValid("price=lt=10&sort(+foo)", "price=lt={price}&{query}")); 
	assert.ok(isValid("price=lt=10&sort(+foo)", "price=lt={price}&sort({prop})")); 
	assert.ok(isValid("price=lt=10&sort(+foo)", "{op:eq(lt,gt,eq)}({field},{value})&sort({prop})")); 
	assert.ok(isValid("price=lt=10&sort(+foo)", "{op:eq(lt,gt,eq)}({field},{value})&sort({prop})?")); 
	assert.ok(isValid("price=lt=10", "{op:eq(lt,gt,eq)}({field},{value})&sort({prop})?")); 
	assert.ok(isValid("price=lt=10", "{op:eq(lt,gt,eq)}({field:eq(price,rating)},{value})&sort({prop})?")); 
	assert.ok(isValid("price=lt=10", "{op:eq(lt,gt,eq)}({field:eq(price,rating)},{value})+&sort({prop})?")); 
	assert.ok(isValid("price=lt=10&rating=3", "{op:eq(lt,gt,eq)}({field:eq(price,rating)},{value})*&sort({prop})?")); 
	assert.ok(isValid("", "{op:eq(lt,gt,eq)}({field:eq(price,rating)},{value})*&sort({prop})?")); 
	assert.ok(isValid("price=lt=10&rating=3", "{op:eq(lt,gt,eq)}({field:eq(price,rating)},{value})+&sort({prop})?")); 
	assert.ok(isValid("price=lt=10", "{term:or(rql({op:eq(lt,gt,eq)}(price,{value:type(number)}),rql(eq(name,{name:type(string)})))}+&sort({prop}?)")); 
	assert.ok(isValid("price=lt=10", "{term:or(rql({op:eq(lt,gt,eq)}(price,{value:type(number)}),rql(eq(name,{name:type(string)})))}&sort({prop}?)")); 
	assert.ok(isValid("price=10", "{term:or(rql({op:eq(lt,gt,eq)}(price,{value:type(number)}),rql(eq(name,{name:type(string)})))}&sort({prop}?)")); 
	assert.ok(isValid("name=foo", "{term:or(rql({op:eq(lt,gt,eq)}(price,{value:type(number)}),rql(eq(name,{name:type(string)})))}&sort({prop}?)")); 
};
/*
exports.testInvalid = function() {
	assert.ok(!isValid("price=gt=10", "price=lt={price}")); 
	assert.ok(!isValid("price=lt=test", "price=lt={price:lt(500)}")); 
	assert.ok(!isValid("price=lt=1000", "price=lt={price:lt(500)&gt(0)}")); 
	assert.ok(!isValid("price=lt=foo", "price=lt={price:type(number)}")); 
	assert.ok(!isValid("price=10&sort(+foo)", "price=lt={price}&{query}")); 
	assert.ok(!isValid("price=lt=10", "price=lt={price}&sort({prop})"));
	assert.ok(!isValid("price=ne=10&sort(+foo)", "{op:eq(lt,gt,eq)}({field},{value})&sort({prop})")); 
	assert.ok(!isValid("price=lt=10&limit(10)", "{op:eq(lt,gt,eq)}({field},{value})&sort({prop})?")); 
	assert.ok(!isValid("", "{op:eq(lt,gt,eq)}({field:eq(price,rating)},{value})+&sort({prop})?")); 
	assert.ok(!isValid("price=ne=10&rating=3", "{op:eq(lt,gt,eq)}({field:eq(price,rating)},{value})*&sort({prop})?")); 
	assert.ok(!isValid("foo=10", "{term:or(rql({op:eq(lt,gt,eq)}(price,{value:type(number)}),rql(eq(name,{name:type(string)})))}+&sort({prop}?)")); 
	assert.ok(!isValid("name=le=10", "{term:or(rql({op:eq(lt,gt,eq)}(price,{value:type(number)}),rql(eq(name,{name:type(string)})))}+&sort({prop}?)")); 
};
*/
if (require.main === module)
    require("patr/runner").run(exports);
