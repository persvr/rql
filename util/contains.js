({define:typeof define!=='undefined'?define:function(deps, factory){module.exports = factory(exports);}}).
define([], function(){
return contains;

function contains(array, item){
	for(var i = 0, l = array.length; i < l; i++){
		if(array[i] === item){
			return true;
		}
	}
}
});
