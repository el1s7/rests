/*!
 * Wrape v1.2.61
 * Author: Elis <contact@elis.cc>
 * License: MIT
 */


/**
 * Initialize
 * @param {Fetch} fetch Fetch API
 * @param {FormData} FormData FormData API
 * @param {Object} endpoints 
 * @param {Object|*} global_options 
 */

function Wrape(fetch, FormData, endpoints, global_options){
	
	/**
	 * Initalization options
	 */
	endpoints = endpoints || {};
	
	var default_global = {
		"base": "",
		"headers":{}, //Append Headers to All Requests
		"values": {}, //Store default Values for All Params (Key: Value)
		"sender": false, //Use a custom function to send request -> custom_fetch(url, options, wrape_options, response_middleware?)
		"request_middleware": null, //Pre-Request Middleware | Can Modify Request (Function)
		"response_middleware": null, //After-Response Middleware | Can Format Response (Function)

		"fetch_parse": true, //Parse Fetch Response (await JSON body\await body text) (bool)
		"fetch_agent": false, //node-fetch only, able to add proxy,
		"fetch_error_handler": false, //Function to handle fetch erros, (Function)
	}
	
	global_options = Object.assign(default_global, global_options);
	

	/**
	 * Constants
	 */

	const def_param_enctypes = {
		"form": "multipart/form-data",
		"url": "application/x-www-form-urlencoded",
		"json": "application/json",
		"text": "text/plain"
	};
	const allowed_param_enctypes = Object.values(def_param_enctypes);

	const allowed_param_locations = ["headers", "body", "query", "path"];
	const def_param_locations = {
		'POST': 'body',
		'GET': 'query',
	};


	const serializers = {
		'multipart/form-data': (function () {
			var formData = new FormData();
			formData.toString = function () { return this; };
			return formData;
		}),
		'application/x-www-form-urlencoded': (function () { return new URLSearchParams() }),
		'application/json': (function () {
			return {
				append: function (key, value) { this.data = this.data || {}; this.data[key] = value; },
				toString: function () { return JSON.stringify(this.data); },
				isEmpty: function () {
					return (!this.data || Object.keys(this.data).length == 0)
				}
			}
		}),
		'text/plain': (function () {
			return {
				append: function (_, value) { this.data = this.data || []; return this.data.push(value); },
				toString: function () { return this.data.join(''); },
				isEmpty: function () {
					return (!this.data || this.data.length == 0)
				}
			}
		})
	};


	/**
	 * Some helper functions
	 */

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


	/**
	 * Fetch Wrapper 
	 * @param {string} url 
	 * @param {Object} options 
	 * @param {Function} responseFormatter 
	 * @return {Promise|*}
	 */
	function ajax(url, options, stored_options, response_middleware) {
		
		//Custom Sender
		if(typeof stored_options.sender === "function") {
			return stored_options.sender(url, options, response_middleware, stored_options);
		}

		return fetch(url, options)
			.then(async function (res) {
				
				var resobj = {},
					do_parse_response = stored_options.fetch_parse,
					do_format_response = typeof response_middleware === "function" ? response_middleware : null,
					do_handle_errors = typeof stored_options.fetch_error_handler === "function" ? stored_options.fetch_error_handler : null;
				
				try {
					if(do_parse_response) {
						var content_type = res.headers.get('Content-Type');
						resobj = {
							'status_code': res.status,
							'status': res.status,
							'statusText': res.statusText,
							'headers': res.headers,
						}
					
						if(content_type && (new RegExp("application\/json")).test(content_type)) {
							resobj['json'] = await res.json();
						}
						else {
							resobj['text'] = await res.text();
						}

						var default_msg = (res.ok ? "Success." : "Something went wrong.");
						resobj['message'] = (resobj['json'] && resobj['json']['message']) ? resobj['json']['message'] : default_msg;
					}
					else {
						resobj = res;
					}
				
					if(!res.ok) {
						throw new Error("Request failed.");
					}
				}
				catch(err) {
					if(do_handle_errors) {
						return do_handle_errors(err,
							{
								url: url,
								options: options
							},
							resobj);
					}
					return Promise.reject(err);
				}

				return do_format_response ?
					do_format_response(resobj) :
					resobj;
			});
	}
	

	/**
	 * Constructor Maker Wrapper
	 * @param {*} root 
	 * @param {*} name 
	 */
	function newSetObject(root, name, category_options){
		name = name || "Wrape";
		var New = {
			[name]: (function(options){
				if(!(this instanceof New[name])){
					throw new Error("You must initalize this object using 'new' command.");
				}
				Object.assign(this, root);
				
				const setter = (function(options){
					if ((this instanceof setter)) { throw new Error("This object is already initialized.");}
					this.$options = Object.assign({}, global_options, category_options, options);
				}).bind(this);
				
				this.set = setter;

				this.set(options);

				return this;
			})
		}
		return New[name];
	}
	
	/**
	 * Main Wrapper
	 * @param {Object} request 
	 */
	function fetcher(request, category_options){
		
		request.method = (typeof request.method === "string" ? request.method.toUpperCase() : "GET");
		
		request.enctype = def_param_enctypes[request.enctype] || (allowed_param_enctypes.includes(request.enctype) ? request.enctype : allowed_param_enctypes[0]);

		if(category_options) {
			category_options = Object.assign({}, global_options, category_options);
		}

		return async function (params) {
		
			var stored_options = this.$options || category_options || global_options ;

			var url = `${stored_options.base}${request.path}`;

			var options = {
				method: request.method,
				headers: stored_options.headers,
				agent: stored_options.fetch_agent
			}
			
			
			var request_params = Object.keys(request.params);
			var argument_params = Array.from(arguments);

			
			var request_middleware = request.request || stored_options.request_middleware;
			var response_middleware = request.response || stored_options.response_middleware;
			
			var bodySerializer = serializers[request.enctype](),
				querySerializer = new URLSearchParams();
			
			
			/**
			 * Parse Params
			 */
			
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
			
			for (var param_name in request.params){
				var param = request.params[param_name];
				var param_value = params[param_name] || param.default || stored_options.values[param_name];
				var param_dest = param.name || param_name;
				
				//Required Param or not
				if(param.required && isNull(param_value)){ 
					var error = new Error(param.help || `The '${param_name}' field is required.`);
					error.field = error.param = param_name;
					throw error;
				}
	
				//Skip, not required
				if(isNull(param_value)) continue;
				
				//Formatter function?
				if(typeof param.formatter === "function" || typeof param.format === "function"){var formatFunc = (param.format || param.formatter); param_value = formatFunc(param_value);}
				
				//Validate
				if(param.validate){
					var isValid = (typeof param.validate === "function") ? param.validate(param_value) : (new RegExp(param.validate).test(param_value));
					if(!isValid){
						var error = new Error(param.help || `The '${param_name}' field is invalid.`);
						error.field = error.param = param_name;
						throw error;
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
					bodySerializer.append(param_dest,param_value);
					continue;
				}
				if(param_location == "query"){
					querySerializer.append(param_dest,param_value);
					continue;
				}
				if(param_location == "path"){
					url = url.replace(new RegExp(`\:${escapeRegExp(param_name)}`),param_value);
				}
			}

			//Set Query
			var hasQuery = querySerializer.toString();
			
			if(hasQuery){
				url = `${url}?${hasQuery}`;
			}
			
			//Set Body
			var isEmptyBody = (bodySerializer.keys && isEmptyIterable(bodySerializer.keys())) ||
				(bodySerializer.getLengthSync && bodySerializer.getLengthSync() == 0) ||
				(bodySerializer.isEmpty && bodySerializer.isEmpty());

			if(!isEmptyBody){
				options['body'] = bodySerializer.toString();
			}
			
			//Set content-type header, (not set for multipart/form-data because it overrides the multpart key)
			if(options['body'] && request.enctype !== allowed_param_enctypes[0]){
				options['headers'] = options['headers'] || {};
				options['headers']['Content-Type'] = request.enctype;
			}

			//Pre-Request Middleware
			if(typeof request_middleware === "function") {
				var override = await Promise.resolve(request_middleware(url,
					options,
					querySerializer,
					bodySerializer));
				
				if(override === false) {
					return false;
				}

				if(override && override.url) {
					url = override.url;
				}
				
				if(override && override.options) {
					options = returns.options;
				}
			}

			
			return ajax(url, options, stored_options, response_middleware);
		}
	}
	

	/**
	 * Recursive Loop schema and make wrappers
	 * @param {*} root 
	 * @param {*} tree 
	 * @param {*} name 
	 */
	function ocreater(root, tree, name, category_options){
		for(var category in tree){
			var category_tree = tree[category];
			
			if(!category_tree || typeof category_tree !== 'object') {
				continue;				
			}

			//Is Endpoint
			if(category_tree.hasOwnProperty('path')){
				var request = category_tree;
				root._ne = true; //Not empty
				
				//Skip duplicate keys in main object root
				if(typeof root[category] !== "undefined"){
						console.warn(`Skipping ${category} as it confilicts with another key in the object, avoid using keys like ('set') because they are reserved constructor words.`);
						continue;
				}
				root[category] = fetcher(request, category_options);
		
			}
			//Is Category, recursion
			else {
				
				if(category === '$options') { //Special Options
					category_options = category_tree;
				}

				root[category] = category.substr(0, 1) === '$' ? //Special Object (i.e Options)
					category_tree :
					ocreater({}, category_tree, category, category_options)
			}
		}
		
		//If it has endpoints , add the 'set' constructor function.
		root = (root._ne) ? Object.assign(root,{'set': newSetObject(root, name, category_options)}) : root;
		
		return root;
	}

	return ocreater({},endpoints,true);
}


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define("wrape",[], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Wrape = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
	const fetch = (typeof module === 'object' && module.exports) ? require("node-fetch") : window.fetch;
	const FormData = (typeof module === 'object' && module.exports) ? require("form-data") : window.FormData;

	if(!fetch) {
		console.warn("Fetch API is not installed. If you are using Node please install node-fetch.");
		return false;
	}
	if(!FormData) {
		console.warn("FormData is not installed. If you are using Node please install form-data.");
		return false;
	}
	
    return Wrape.bind(null,fetch,FormData);
}));
