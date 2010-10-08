require.def||(require.def=function(deps, factory){module.exports = factory(require, exports, modParser, modQuery, modArray);});
require.def(["require", "exports", "./parser", "./query", "./js-array"], function(require, exports, modParser, modQuery, modArray){

exports = {
    parse: modParser.parseQuery,
    exec: modArray.executeQuery,
    Query: modQuery.Query
};

return exports;
});
