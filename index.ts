/*!
 * Rests-CLI
 * Author: Elis <github@elis.cc>
 * License: MIT
 */
interface ResponseObject {
	statusCode: number,
	statusText: string,
	headers: any,
	type: "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect" ,
	ok: boolean,
	json?: any,
	text?: string,
	formData?: any,
	blob?: Blob,
	message?: string
}


type methodType = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "CONNECT" | "HEAD" | "get" | "post" | "put" | "delete" | "options" | "connect" | "head";

/**
 * Request parameters
 */
interface Params {

	[name: string]:{
		/** The parameter HTTP name */
		name?: string,
		
		/** Required or not */
		required?: boolean,

		/** A help message to throw in case of errors */
		help?: string,

		/** Param type (default: any)*/
		type?: "string" | "number" | "array" | "object" | "boolean" | "any",

		/** Example value */
		example?: any,

		/** Format functions that accepts supplied value and returns formatted value. */
		format?: (value: any)=>any,

		/** Regex validation */
		validate?: RegExp | string,

		/** Array validation */
		in?: any[],

		/** Default value */
		default?: any,

		/** HTTP Location (default: "query" for GET and "body" for "post") */
		location?: "body" | "headers" | "query" | "path",

	}
	
}

interface Hooks {
	/**
	 * A global hook function that is called on request.
	 * 
	 * 
	 * To modify request
	 * ```javascript 
	 * return {url, options}
	 * ``` 
	 * 
	 * To stop request 
	 * ```javascript 
	 * return false
	 * ```
	 */
	on_request?: (request: {url: string, options: any}) => ({url: string, options: any} | false | void),

	/**
	 * A hook function that is called on successful response, you can also modify and return a different response.
	 */
	 on_success?: (response: ResponseObject, request?: {url: string, options: any}) => any,
	
	/**
	 * A hook function that is called on errors.
	 * 
	 * 
	 * To return a different error:
	 * 
	 * 
	 * ```javascript
	 * return Promise.reject(CustomErrorResponse: ResponseObject)
	 * ```
	 * 
	 */
	
	on_error?: (error: ResponseObject | unknown, request?: {url: string, options: any}) => any,
}

interface Endpoint extends Hooks{
	
	/**
	 * The HTTP request path. (default: GET)
	 */
	path: string,

	/**
	 * The HTTP request method
	 */
	method?: methodType,


	/**
	 * The body encode type, only for requests that have a body.
	 * 
	 * **json** (application/json) *default*
	 * 
	 * **form** (multipart/form-data) 
	 * 
	 * **urlencoded** (application/x-www-form-urlencoded)
	 * 
     * **text** (text/plain)
	 */
	enctype?: "form" | "urlencoded" | "json" | "txt",

	params?: Params,

	/**
	 * A description used for documantation generation
	 */
	help?: string,

	/**
	 * Example response for documentation generation
	 */
	example_response?: any
}

interface Options extends Hooks{
	/**
	 * This will be prepended before the requests path. 
	 * 
	 * @example https://example.com
	 */
	base?: string,

	/**
	 * Key-value object of headers include in requests
	 */
	headers?: any,

	/**
	 * Params to include in requests
	 */
	params?: Params,
	
	/**
	 * Key-value object to set default values for params
	 */
	values?: {
		[param_name: string]: any
	}

	/**
	 * Node-Fetch option for adding a proxy
	 */
	fetch_agent?: any, 
}


interface CategorySchema {
	/**
	 * Override global options for this category
	 */
	 $options?: Options,

	 /**
	  * A help message, might be used for JSDoc & documentation generation
	  */
	 $help?: string,
 
}


/**
* A object consisting of Endpoint Objects or nested subcategories. 
*/
interface Schema extends CategorySchema {
	[name: string]: string | Options | Endpoint | Schema
};


interface ErrorConstructor {
    new(message?: string): Error & {
		field?: string
	};
    (message?: string): Error;
    readonly prototype: Error;
}

declare var Error: ErrorConstructor;


function Rests(
		endpoints: Schema, 
		options?: Options,
	){
	
	const fetch = (typeof window !== 'undefined')  ?  window?.fetch : require("node-fetch"),
		FormData = (typeof window !== 'undefined') ?  window?.FormData : require("form-data");

	if(!fetch) {
		throw new Error("Fetch API is not installed. If you are using Node please run `npm install node-fetch`");
	}

	if(!FormData) {
		throw new Error("FormData is not installed. If you are using Node please run `npm install form-data`");
	}
	
	let global_options: Options = {
		base: "",
		headers: {},
		params: {}, 
		on_error: void 0,
		on_success: void 0,
		on_request: void 0, 
		fetch_agent: null,
		...options
	};
	
	const def_param_enctypes = {
			"json": "application/json",
			"form": "multipart/form-data",
			"urlencoded": "application/x-www-form-urlencoded",
			"text": "text/plain"
		},
		allowed_param_enctypes = Object.values(def_param_enctypes),
		allowed_param_locations = ["headers", "body", "query", "path"],
		def_param_locations = {
			'POST': 'body',
			'GET': 'query',
		};
	
	const serializers = {
		'multipart/form-data': (function () {
			var formData = new FormData();
			formData.toString = function () { return this; };
			return formData;
		}),
		'application/x-www-form-urlencoded': (function () { return new URLSearchParams(); }),
		'application/json': (function () {
			return {
				append: function (key: string, value) { this.data = this.data || {}; this.data[key] = value; },
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

	const isNull = (value: any) => {
		return value === null || value === undefined;
	}
	
	const isEmptyIterable = (iterable: any[]) => {
		for (var _ of iterable) {
			return false;
		}
	
		return true;
	};

	const escapeRegExp = (string: string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}	

	const capitalize = (string: string) => {
		return string.substr(0, 1).toUpperCase() + string.substr(1, string.length);
	}


	const sendRequest = (url: string, options: any, restOptions: Options): ResponseObject => {
		
		return fetch(url, options)
			.then(async function (res: Response) {
				
				try {
					var contentType = res.headers.get('Content-Type') || '';
					let formattedResponse: ResponseObject = {
						statusCode: res.status,
						statusText: res.statusText,
						headers: res.headers,
						type: res.type,
						ok: res.ok
					}
					
					let responseTypes = {
						'application\/json': 'json',
						'text\/plain': 'text',
						'(multipart\/form\-data|application\/x\-www\-form\-urlencoded)': 'formData',
					}
					
					let currentResponseType = Object.keys(responseTypes).find((responseType) => (new RegExp(responseType)).test(contentType)) || "blob";

					formattedResponse[responseTypes[currentResponseType]] = await res[responseTypes[currentResponseType]]();
					

					formattedResponse['message'] = formattedResponse?.json?.message || (
						res.ok ? "Success." : "Something went wrong."
					);
			
					if(!res.ok) {
						throw formattedResponse;
					}

					if(restOptions.on_success) {
						let successCallbackRes = restOptions.on_success(formattedResponse, {url, options});
						if(successCallbackRes !== undefined){
							return successCallbackRes;
						}
					}
					return formattedResponse
				}
				catch(err) {
					if(restOptions.on_error) {
						let errorCallbackRes = restOptions.on_error(err, {url, options});
						if(errorCallbackRes !== undefined){
							return errorCallbackRes;
						}
					}
					return Promise.reject(err);
				}
			});
	}

	/**
	 * Constructor Maker Wrapper
	 * Initalize a category and set values for it's endpoints. (Full category options can be updated with special $options key) 
	 * @param {*} root 
	 * @param {*} name 
	 */
	function newSetObject(root: any, name: string, category_options: Options){
		name = name || "Rests";
		var New = {
			[name]: (function(values){
				if(!(this instanceof New[name])){
					throw new Error("You must initalize this object using 'new' command.");
				}
				Object.assign(this, root);
				
				const setter = (function(values){
					if((this instanceof setter)) { throw new Error("This object is already initialized."); }
					
					// Special Options object
					if(values["$options"]) {
						if(typeof values["$options"] === "string" || typeof values["$options"] === "function" || typeof values["$options"] === "number" || typeof values["$options"] === "boolean") {
							throw new Error("Invalid $options object received.");
						}

						Object.assign(category_options, values["$options"]);

						delete values["$options"];
					}

					// Set Values for endpoints
					category_options.values = {
						...category_options.values,
						...values
					};
				}).bind(this);

				

				this.set = setter;

				this.set(values);

				return this;
			})
		}
		return New[name];
	}
	
	/**
	 * Main Wrapper
	 * @param {Object} request 
	 */


	function wrap(request: Endpoint, category_options: Options, testing = false){
		
			request.method = (request.method || "get").toUpperCase() as methodType,
			request.params = request.params || {};
		
		return async function (params: {
			[key in keyof typeof request.params]: any
		} | FormData) {
			var stored_options = category_options || global_options;

			stored_options.on_request = request.on_request || stored_options.on_request;
			stored_options.on_success = request.on_success || stored_options.on_success;
			stored_options.on_error = request.on_error || stored_options.on_error;

			var url = `${stored_options.base}${request.path}`;

			var options = {
				method: request.method,
				headers: { ...stored_options.headers },
				agent: stored_options.fetch_agent
			}

			var enctype = allowed_param_enctypes.includes(request.enctype) ? request.enctype : def_param_enctypes[request.enctype || "json"];
			
			var request_params = Object.assign({}, stored_options.params, request.params)

			var bodySerializer = serializers[enctype](),
				querySerializer = new URLSearchParams();
			
			
			/**
			 * Parse Params
			 */
			if(params?.constructor?.name == 'FormData'){
				let buildParams = {}
				params.forEach(function(value:string, key: string){
					buildParams[key] = value;
				});
				params = buildParams;
			}
			else{
				params = params || {};
			}


			for (var param_name in request_params){
				var param = request_params[param_name];
				var param_value = !isNull(params[param_name]) ? params[param_name] : (param.hasOwnProperty('default') ? param.default : ((stored_options.values && stored_options.values[param_name]) || (testing ? param.example : undefined)));
				var param_dest = param.name || param_name;
				var param_error = param.help || `The '${param_name}' field is invalid.`;

				//Required Param or not
				if(param.required && isNull(param_value)){ 
					var error = new Error(param_error);
					error.field = param_name;
					throw error;
				}
	
				//Skip, not required
				if(isNull(param_value)) continue;
				
				//Formatter function?
				if(typeof param.format === "function"){
					try{
						param_value = param.format(param_value);
					}
					catch(e){
						var error = new Error(e.message || param_error);
						error.field = param_name;
						throw error;
					}
				}


				//Type
				if(param.type && param.type !== "any"){
					var error = new Error(param_error);
					error.field = param_name;

					if(
						(["string", "boolean", "number"].includes(param.type) && typeof param_value != param.type) ||
						(param.type == "array" && !Array.isArray(param_value)) ||
						(param.type == "object" && (!param_value || param_value.__proto__.constructor.name !== "Object"))
					){
						throw error;
					}

					
				}
				
				//Validate
				if(param.validate){
					if(!(new RegExp(param.validate).test(param_value))){
						var error = new Error(param_error);
						error.field = param_name;
						throw error;
					}
				}

				//In
				if(param.in && Array.isArray(param.in) && !param.in.includes(param_value)) {
					var error = new Error(param_error);
					error.field = param_name;
					throw error;
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
					url = url.replace(new RegExp(`\:${escapeRegExp(param_dest)}`),param_value);
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
			
			//Set content-type header, (not set for multipart/form-data because it overrides the automatically generated multipart key)
			if(options['body'] && enctype !== 'multipart/form-data'){
				options['headers'] = options['headers'] || {};
				options['headers']['Content-Type'] = enctype;
			}

			//Pre-Request Middleware
			if(stored_options.on_request) {
				var requestCallbackRes = await Promise.resolve(stored_options.on_request({url, options}));
				
				if(requestCallbackRes === false){
					return false;
				}
				
				if(requestCallbackRes && requestCallbackRes?.url) {
					url = requestCallbackRes.url;
				}
				
				if(requestCallbackRes && requestCallbackRes?.options) {
					options = requestCallbackRes.options;
				}

			}

			
			return sendRequest(url, options, stored_options);
		}
	}
	

	/**
	 * Recursive loop on schema and make wrappers
	 * @param {*} root 
	 * @param {*} tree 
	 * @param {*} name 
	 */
	function traverse(root: any, tree: Schema, name: string, category_options: Options){
		for(var category in tree){
			var category_tree = tree[category];
			
			if(!category_tree || typeof category_tree !== 'object') {
				continue;				
			}

			//Is Endpoint
			if(category_tree.hasOwnProperty('path')){
				var request = category_tree as Endpoint;
				root._ne = true; //Not empty
				
				//Skip duplicate keys in main object root
				if(typeof root[category] !== "undefined"){
						console.warn(`Skipping ${category} as it confilicts with another key in the object, avoid using keys like ('set') because they are reserved constructor words.`);
						continue;
				}
				root[category] = wrap(request, category_options);
		
			}
			//Is Category, recursion
			else {
				
				var subcategory = category_tree as Schema;

				if(category === '$options') { //Special Options
					var options = subcategory;
					category_options = Object.assign({}, category_options, options);
				}

				// Skip Special Object (i.e Options)
				if(category.substr(0, 1) === '$') {
					continue;
				}

				root[category] = traverse({}, subcategory, category, category_options);
			}
		}
		
		//If it has endpoints , add the 'set' constructor function.
		root = (root._ne) ? Object.assign(root, {
			'set': newSetObject(root, name, category_options)
		}) : root;
		
		return root;
	}

	const instanceRoot = Object.defineProperty({}, '__schema__', {
		value:{
			schema: endpoints,
			options: global_options
		},
		writable: false,
		enumerable: false
	});

	
	return traverse(instanceRoot, endpoints, "Rests", global_options);
}

module.exports = Rests;

export {Schema, Options, ResponseObject};

export default Rests;