Resource Query Language (RQL) is a query language designed for use in URIs with object
style data structures. This project includes the RQL specification and
provides a JavaScript implementation of query 
parsing and query execution implementation for JavaScript arrays. RQL can be thought as basically a set of
nestable named operators which each have a set of arguments. RQL is designed to
have an extremely simple, but extensible grammar that can be written in a URL friendly query string. A simple RQL
query with a single operator that indicates a search for any resources with a property of
"foo" that has value of 3 could be written:

    eq(foo,3)

RQL is a compatible superset of standard HTML form URL encoding. The following query
is identical to the query (it is sugar for the query above):

    foo=3

Such that this can be used in URIs like:

    http://example.org/data?foo=3

JavaScript Library
==============

Using the JavaScript library we can construct queries 
using chained operator calls in JavaScript. We could
write this query:

    var Query = require("rql/query").Query;
    var fooEq3Query = new Query().eq("foo",3);
    
    

The RQL grammar is based around standard URI delimiters. The standard rules for 
encoding strings with URL encoding (%xx) are observed. RQL also supersets FIQL. 
Therefore we can write a query that finds resources with a "price" property below
10 with a "lt" operator using FIQL syntax:

    price=lt=10

Which is identical (and sugar for call operator syntax known as the normalized form):

    lt(price,10)

One can combine conditions with multiple operators with "&":

    foo=3&price=lt=10

Is the same as:

    eq(foo,3)&lt(price,10)

Which is also the same as:

    and(eq(foo,3),lt(price,10))

We can execute a query against a JavaScript array:

	require("rql/js-array").executeQuery("foo=3&price=lt=10", {}, data)...

The | operator can be used to indicate an "or" operation. We can also use paranthesis
to group expressions. For example:

    (foo=3|foo=bar)&price=lt=10
    
Which is the same as:

    and(or(eq(foo,3),eq(foo,bar)),lt(price,10))
    
Values in queries can be strings (using URL encoding), numbers, booleans, null, undefined,
and dates (in ISO UTC format without colon encoding). We can also denote arrays
with paranthesis enclosed, comma separated values. For example to find the objects
where foo can be the number 3, the string bar, the boolean true, or the date for the
first day of the century we could write an array with the "in" operator:

    foo=in=(3,bar,true,2000-01-01T00:00:00Z)

We can also explicitly specify primitive types in queries. To explicitly specify a string "3",
we can do:

    foo=string:3

Any property can be nested by using an array of properties. To search by the bar property of
the object in the foo property we can do:

    (foo,bar)=3
    
We can also use slashes as shorthand for arrays, so we could equivalently write the nested
query:

    foo/bar=3

Another common operator is sort. We can use the sort operator to sort by a specified property.
To sort by foo in ascending order:
	
	price=lt=10&sort(+foo)

We can also do multiple property sorts. To sort by price in ascending order and rating in descending order:

    sort(+price,-rating)

The aggregate function can be used for aggregation. To calculate the sum of sales for
each department:

    aggregate(departmentId,sum(sales))
        
Here are definitions of the common operators (individual stores may have support
for more less operators). First are the filtering and sorting operations:

* eq(&lt;property?>,&lt;value>+) - Filters for objects where the specified property's value is equal to the provided value or if the value is an array, equal to any of the values in the array.
* ne(&lt;property?>,&lt;value>+) - Filters for objects where the specified property's value is not equal to the provided value or if the value is an array, not equal to any of the values in the array.
* lt(&lt;property?>,&lt;value>) - Filters for objects where the specified property's value is less than the provided value
* le(&lt;property?>,&lt;value>) - Filters for objects where the specified property's value is less than or equal to the provided value
* gt(&lt;property?>,&lt;value>) - Filters for objects where the specified property's value is greater than the provided value
* ge(&lt;property?>,&lt;value>) - Filters for objects where the specified property's value is greater than or equal to the provided value
* and(&lt;query>,&lt;query>,...) - Applies all the given queries
* or(&lt;query>,&lt;query>,...) - The union of the given queries
* contains(&lt;property?>,&lt;value | expression>) - Filters for objects where the specified property's value is an array and the array contains any value that equals the provided value or satisfies the provided expression.
* excludes(&lt;property?>,&lt;value | expression>) - Filters for objects where the specified property's value is an array and the array does not contain any of value that equals the provided value or satisfies the provided expression.
* type(&lt;property?>,&lt;type>) - Filters for objects where the specified property's value is of the given type.
* rql(&lt;property?>,&lt;type>) - Filters for objects where the specified property's value matches the given RQL template.
* sort(&lt;+|->&lt;property) - Sorts by the given property in order specified by the prefix (+ for ascending, - for descending)  
* recurse(&lt;property?>) - Recursively searches, looking in children of the object as objects in arrays in the given property value

The next group of operators act on the list of the objects returned from the filtering and sorting operations:  
* limit(count,start,maxTotalCount) - Returns the given range of objects from the result set, where "count" is the maximum number of objects to return, "start" is an optional starting offset, and maxTotalCount is an optional limit on the max total count that needs to be computed.
* select(&lt;property>,&lt;property>,...) - Trims each object down to the set of properties defined in the arguments
* values(&lt;property>) - Returns an array of the given property value for each object
* aggregate(&lt;property|function>,...) - Aggregates the array, grouping by objects that are distinct for the provided properties, and then reduces the remaining other property values using the provided functions. When called with no arguments, returns a result set with duplicates removed 
* sum(&lt;property?>) - Finds the sum of every value in the array or if the property argument is provided, returns the sum of the value of property for every object in the array 
* mean(&lt;property?>) - Finds the mean of every value in the array or if the property argument is provided, returns the mean of the value of property for every object in the array 
* max(&lt;property?>) - Finds the maximum of every value in the array or if the property argument is provided, returns the maximum of the value of property for every object in the array 
* min(&lt;property?>) - Finds the minimum of every value in the array or if the property argument is provided, returns the minimum of the value of property for every object in the array 
* first() - Returns the first record of the query's result set
* one() - Returns the first and only record of the query's result set, or produces an error if the query's result set has more or less than one record in it.
* count() - Returns the count of the number of records in the query's result set

If you are writing an implementation of RQL for a database or other storage endpoint, or want to introspect queries, you can use the parsed query data 
structures. You can parse string queries with parser module's parseQuery function.
Query objects have a "name" property and an "args" with an array of the arguments.
For example:

	require("rql/parser").parseQuery("(foo=3|foo=bar)&price=lt=10") ->
	{
		name: "and",
		args: [
			{
				name:"or",
				args:[
					{
						name:"eq",
						args:["foo",3]
					},
					{
						name:"eq",
						args:["foo","bar"]
					}
				]
			},
			{
				name:"lt",
				args:["price",10]
			}
		]
	}
				
Installation
========

It is recommended that you install RQL such that it is available in require statements
under the "rql" path. This can easily be done with a package mapping compliant module
loader like [Nodules](http://github.com/kriszyp/nodules) by using a mapping in your 
package.json:

    "mappings": {
	  "rql": "http://github.com/kriszyp/perstore/zipball/master"
    }

RQL Templating
--------------

RQL 

Licensing
--------

The RQL implementation is part of the Persevere project, and therefore is licensed under the
AFL or BSD license. The Persevere project is administered under the Dojo foundation,
and all contributions require a Dojo CLA.

Project Links
------------

See the main Persevere project for more information:

### Homepage:

* [http://persvr.org/](http://persvr.org/)

### Source & Download:

* [http://github.com/kriszyp/perstore/](http://github.com/kriszyp/perstore)

### Mailing list:

* [http://groups.google.com/group/persevere-framework](http://groups.google.com/group/persevere-framework)

### IRC:

* [\#persevere on irc.freenode.net](http://webchat.freenode.net/?channels=persevere)
