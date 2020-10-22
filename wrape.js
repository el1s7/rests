/*!
 * Wrape v1.1.7
 * Author: Elis <contact@elis.cc>
 * License: MIT
 */

function Wrape(endpoints,global_options){
	
	//Parse Global Options
	endpoints = endpoints || {};
	
	var default_global = {
		"base": "",
		"defaultHeaders":{},
		"defaultParamValues":{},
		"parseResponse": true,
		"agent": false, //node-fetch, able to add proxy
	}
	
	global_options = Object.assign(default_global,global_options);
	
	function ajax(url, options,type) {
		return fetch(url, options)
			.then(async function(res){
				if(global_options.parseResponse){
					var resobj = {};
					var content_type = res.headers.get('Content-Type');
					resobj = {
						'status_code': res.status,
						'status': res.status,
						'statusText': res.statusText,
						'headers': res.headers,
					}
					if(content_type && (new RegExp("application\/json")).test(content_type)){resobj['json'] = await res.json();}
					else if(content_type && (new RegExp("text\/")).test(content_type)){resobj['text'] = await res.text();}
					else{resobj['arrayBuffer'] = await res.arrayBuffer()}
				}
				else{
					resobj = res;
				}
				
				if (!res.ok) {
					return Promise.reject(resobj);
				}
				return resobj
			});
	}
	
	//The set constructor
	function newSetObject(root,name){
		name = name || "Wrape";
		var New = {
			[name]: (function(def_values){
				if(!(this instanceof New[name])){
					throw new Error("You must initalize this object using 'new' command.");
				}
				Object.assign(this,root);
				this.def_values = def_values;
				//Set for the current initalized object
				var child_setter = (function(def_values){
					if ((this instanceof child_setter)) { throw new Error("You can't initalize this object.");}
					this.def_values = def_values;}
					).bind(this);
				this.set = child_setter;
				
				
				return this;
			})
		}
		return New[name];
	}
	
	function isNull(value){
		return value === null || value === undefined;
	}
	
	function isEmptyIterable(iterable){
		for (var _ of iterable) {
			return false;
		}
	
		return true;
	};
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	

	
	function fetcher(request){
		
		request.method = (typeof request.method === "string" ? request.method.toUpperCase() : "GET");
		
		
		var allowed_param_locations = ["headers","body","query","path"];
		var allowed_param_enctypes = ['multipart/form-data','application/x-www-form-urlencoded','application/json'];
		request.enctype = ((request.enctype && allowed_param_enctypes.includes(request.enctype)) ? request.enctype : allowed_param_enctypes[0]);
		
		var def_param_locations = {
			'POST': 'body',
			'GET': 'query',
		}
		
		
		return async function(params){
			var url = `${global_options.base}${request.path}`;
			var options = {
				method: request.method,
				headers: global_options.defaultHeaders,
				agent: global_options.agent
			}
			
			
			var request_params = Object.keys(request.params);
			var argument_params = Array.from(arguments);
			
			//Parse the params object
			
			//Support passing multiple arguments, create param object ordered by param order. (Not recommended)
			if(argument_params.length > 1){
				params = argument_params.reduce(function(o,k,i){
					if(!request_params[i]){
						return o;
					}
					o[request_params[i]] = k;
					return o;
				},{});
			}
			//FormData
			else if(argument_params[0] instanceof FormData){
				params = {}
				argument_params[0].forEach(function(value, key){
					params[key] = value;
				});
			}
			//Single argument & Single Needed Param, not object
			else if(argument_params.length == 1 && request_params.length == 1 && argument_params[0] && !argument_params[0][request_params[0]] && !(argument_params[0] instanceof FormData)){
				params = {
					[request_params[0]]: argument_params[0]
				}
			}
			else{
				params = params || {};
			}
			
	
			this.def_values = this.def_values || {};
			var bodyTypes = {
				'multipart/form-data': function(){return new URLSearchParams()},
				'application/x-www-form-urlencoded': function(){ return new FormData();},
				'application/json': function(){
					return {
						append: function(key,value){ return this[key] = value;},
						toString: function(){ return JSON.stringify(this);}
					}
				}
			}
			var body = bodyTypes[request.enctype]();
			var query = new URLSearchParams();
			
	
			for (var param_name in request.params){
				var param = request.params[param_name];
				var param_value = params[param_name] || this.def_values[param_name] || global_options.defaultParamValues[param_name] || param.default;
				var param_dest = param.name || param_name;
				
				//Required Param or not
				if(param.required && isNull(param_value)){ throw new Error(param.help || `The '${param_name}' field is required.`);}
	
				//Skip, not required
				if(isNull(param_value)) continue;
				
				//Formatter function?
				if(typeof param.formatter === "function" || typeof param.format === "function"){var formatFunc = (param.format || param.formatter); param_value = formatFunc(param_value);}
				
				//Validate
				if(param.validate){
					var isValid = (typeof param.validate === "function") ? param.validate(param_value) : (new RegExp(param.validate).test(param_value));
					if(!isValid){
						throw new Error(param.help || `The '${param_name}' field is invalid.`);
					}
				}
	
				//Location
				var param_location = (typeof param.location === "string" ? param.location.toLowerCase() : def_param_locations[options.method]);
				if(!param_location || !allowed_param_locations.includes(param_location)){ throw new Error(`Invalid location for '${param_name}' field.`);}
				
	
				if(param_location == "headers"){
					options['headers'] = options['headers'] || {};
					options['headers'][param_dest] = param_value;
					continue;
				}
				if(param_location == "body"){
					body.append(param_dest,param_value);
					continue;
				}
				if(param_location == "query"){
					query.append(param_dest,param_value);
					continue;
				}
				if(param_location == "path"){
					url = url.replace(new RegExp(`\:${escapeRegExp(param_name)}`),param_value);
				}
			}
			var hasQuery = query.toString();
			
			if(hasQuery){
				url = `${url}?${hasQuery}`;
			}
			
			//Get Body
			if((body.keys && !isEmptyIterable(body.keys())) || body.toString().length > 1){
				options['body'] = ((request.enctype == allowed_param_enctypes[0]) ? body : body.toString());
			}
			
			//Set content-type header, (not set for multipart/form-data because it overrides the multpart key)
			if(options['body'] && request.enctype !== allowed_param_enctypes[0]){
				options['headers'] = options['headers'] || {};
				options['headers']['Content-Type'] = request.enctype;
			}
	
			return ajax(url,options);
		}
	}
	
	function ocreater(root,tree,name){
		for(var category in tree){
			var category_tree = tree[category];
			
			//Is Endpoint
			if(category_tree.hasOwnProperty('path')){
				var request = category_tree;
				root._ne = true; //Not empty
				
				//Skip duplicate keys in main object root
				if(typeof root[category] !== "undefined"){
						console.warn(`Skipping ${category} as it confilicts with another key in the object, avoid using keys like ('set') because they are reserved constructor words.`);
						continue;
				}
				root[category] = fetcher(request);
		
			}
			//Is Category, recursion
			else{
				root[category] = ocreater({},category_tree,category)
			}
		}
		
		//If it has endpoints , add the 'set' constructor function.
		root = (root._ne) ? Object.assign(root,{'set': newSetObject(root,name)}) : root;
		
		return root;
	}
	return ocreater({},endpoints,true);
}

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Wrape = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
    return Wrape;
}));