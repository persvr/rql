var assert = require("assert"),
    Query = require("../lib/query").Query,
    parseQuery = require("../lib/parser").parseQuery;


exports.testBehavior = function() {
    //assert.error(parseQuery(), "parseQuery requires a string");
    assert.ok(parseQuery("") instanceof Query, "should inherit from Query");
    assert.ok(parseQuery("a=b") instanceof Query, "should inherit from Query");
    //assert.error(parseQuery("?a=b"), "cannot begin with a ?");
};

var queryPairs = {
    "arrays": [
        {"a": {name:"and", args:["a"]}},
        {"(a)": {name:"and", args:["a"]}},
        {"a,b,c": {name:"and", args:["a", "b", "c"]}},
        {"(a,b,c)": {name:"and", args:[["a", "b", "c"]]}},
        {"a(b)": {name:"and", args:[["a", "b", "c"]]}},
        {"a(b,c)": {name:"and", args:[{name:"a", args:["b", "c"]}]}},
        {"a((b),c)": {"name": "and", args:[{name:"a", args:[["b"], "c"]}]}},
        {"a((b,c),d)": {name:"and", args:[{name:"a", args:[["b", "c"], "d"]}]}},
        {"a(b),c(d(e))": {name:"and", args:[
            {name:"a", args:["b"]}, 
            {name:"c", args:[{name:"d", args:["e"]}]}
        ]}},
        {"(a(b),c(d(e)))": {name:"and", args:[[
            {name:"a", args:["b"]}, 
            {name:"c", args:[{name:"d", args:["e"]}]}
        ]]}}
    ],
    "equality": [
        {"eq(a,b)": {name:"and", args:[{name:"eq", args:["a","b"]}]}},
        {"a=eq=b": "eq(a,b)"},
        {"a=b": "eq(a,b)"}
    ],
    "inequality": [
        {"ne(a,b)": {name:"and", args:[{name:"ne", args:["a", "b"]}]}},
        {"a=ne=b": "ne(a,b)"},
        {"a!=b": "ne(a,b)"}
    ],
    "less-than": [
        {"lt(a,b)": {name:"and", args:[{name:"lt", args:["a", "b"]}]}},
        {"a=lt=b": "lt(a,b)"},
        {"a<b": "lt(a,b)"}
    ],
    "less-than-equals": [
        {"le(a,b)": {name:"and", args:[{name:"le", args:["a","b"]}]}},
        {"a=le=b": "le(a,b)"},
        {"a<=b": "le(a,b)"}
    ],
    "greater-than": [
        {"gt(a,b)": {name:"and", args:[{name:"gt", args:["a", "b"]}]}},
        {"a=gt=b": "gt(a,b)"},
        {"a>b": "gt(a,b)"}
    ],
    "greater-than-equals": [
        {"ge(a,b)": {name:"and", args:[{name:"ge", args:["a", "b"]}]}},
        {"a=ge=b": "ge(a,b)"},
        {"a>=b": "ge(a,b)"}
    ],
    "nested comparisons": [
        {"a(b(le(c,d)))": {name:"and", args:[{name:"a", args:[{name:"b", args:[{name:"le", args:["c", "d"]}]}]}]}},
        {"a(b(c=le=d))": "a(b(le(c,d)))"},
        {"a(b(c<=d))": "a(b(le(c,d)))"}
    ],
    "arbitrary FIQL desugaring": [
        {"a=b=c": {name:"and", args:[{name:"b", args:["a", "c"]}]}},
        {"a(b=cd=e)": {name:"and", args:[{name:"a", args:[{name:"cd", args:["b", "e"]}]}]}}
    ],
    "and grouping": [
        {"a&b&c": {name:"and", args:["a", "b", "c"]}},
        {"a(b)&c": {name:"and", args:[{name:"a", args:["b"]}, "c"]}},
        {"a(b&c)": {}},
        {"a(b&(c))": {}},
        {"a(b&c)": {}}
    ],
    "or grouping": [
        {"a|b|c": {name:"and", args:[{name:"or", args:["a", "b", "c"]}]}},
        {"a(b)|c": {name:"and", args:[{name:"or", args:[{name:"a", args:["b"]}, "c"]}]}}
    ],
    "complex grouping": [
        {"a&b|c": {name:"and", args:["a", {name:"or", args:["b", "c"]}]}},
        {"a|b&c": {name:"and", args:[{name:"or", args:["a", {name:"and", args:["b", "c"]}]}]}},
        
        {"a(b(c<d,e(f=g)))": {}}
    ],
    "complex comparisons": [
        
    ],
    "string coercion": [
        {"a(string)": {name:"and", args:[{name:"a", args:["string"]}]}},
        {"a(string:b)": {name:"and", args:[{name:"a", args:["b"]}]}},
        {"a(string:1)": {name:"and", args:[{name:"a", args:["1"]}]}}
    ],
    "number coercion": [
        {"a(number)": {name:"and", args:[{name:"a", args:["number"]}]}},
        {"a(number:1)": {name:"and", args:[{name:"a", args:[1]}]}},
        {"a(number:b)": {name:"and", args:[{name:"a", args:[NaN]}]}}
    ],
    "date coercion": [
        //FIXME do we need proper ISO date subset parsing?
        {"a(date)": {name:"and", args:[{name:"a", args:["date"]}]}},
        {"a(date:2009)": {name:"and", args:[{name:"a", args:[(new Date(2009))]}]}},
        {"a(date:b)": {name:"and", args:[{name:"a", args:[(new Date(NaN))]}]}} // XXX?
    ],
    "true coercion": [
        {"a(true)": {name:"and", args:[{name:"a", args:[true]}]}},
        {"a(true:b)": {name:"and", args:[{name:"a", args:[true]}]}}
    ],
    "false coercion": [
        {"a(false)": {name:"and", args:[{name:"a", args:[false]}]}},
        {"a(false:b)": {name:"and", args:[{name:"a", args:[false]}]}}
    ],
    "null coercion": [
        {"a(null)": {name:"and", args:[{name:"a", args:[null]}]}},
        {"a(null:b)": {name:"and", args:[{name:"a", args:[null]}]}},
        {"a(string:null)": {name:"and", args:[{name:"a", args:["null"]}]}}
    ],
    "complex coercion": [
        {"a=b|c=d&e=f|g=1": {name:"and", args:[ // XXX?
            {name:"or", args:[
                {name:"eq", args:["a", "b"]}, 
                {name:"and", args:[
                    {name:"eq", args:["c", "d"]}, 
                    {name:"or", args:[
                        {name:"eq", args:["e", "f"]}, 
                        {name:"eq", args:["g", 1]}
                    ]}
                ]}
            ]}
        ]}}
    ],
    "complex grouping": [
        
    ]
};

exports.testParsing = function() {
    for (var group in queryPairs) {
        queryPairs[group].forEach(function(pair) {
            var key = Object.keys(pair)[0];
            assert.deepEqual(parseQuery(key), parseQuery(pair[key]), group);
        });
    }
};

exports.testBindParameters = function() {
    // TODO 
};

exports.testExecution = function() {
    // TODO
};

exports.testStringification = function() {
    // TODO
};

if (require.main === module)
    require("patr/runner").run(exports);
