/*!
 * Rests v{restsVersion}
 * Author: Elis <github@elis.cc>
 * License: MIT
 */
export interface ResponseObject {
	statusCode: number,
	statusText: string,
	headers: Headers,
	type: "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect" ,
	ok: boolean,
	json?: any,
	text?: string,
	formData?: FormData,
	blob?: Blob,
	message?: string
}


type methodType = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "CONNECT" | "HEAD" | "get" | "post" | "put" | "delete" | "options" | "connect" | "head";


export type paramOptions = {
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

	/** Format functions that accepts supplied value and returns formatted value, you can also throw an error. */
	format?: (value: any)=>any,

	/** Regex validation */
	validate?: RegExp | string,

	/** Array validation */
	in?: any[],

	/** Maximum for number type values  */
	max?: number,

	/** Minimum for number type values */
	min?: number,

	/** Default value */
	default?: any,

	/** HTTP Location (default: "query" for GET and "body" for "post") */
	location?: "body" | "headers" | "query" | "path",

};

/**
 * Request parameters
 */
 export interface Params {
	[name: string]: paramOptions
}

export interface OptionsParams{ 
	[name: string]: paramOptions & {

		/** This parameter should only be set on initialization of the category */
		$initsOnly?: boolean
	}
}

export type HookRequest = {
	/**
	 * Fetch URL
	 */
	url: string, 

	/**
	 * Fetch Options
	 */
	options: any,
	
	/**
	 * The parameters supplied for this request
	 */
	params: any

	/**
	* Endpoint Key, e.g "user.login"
	*/
	key: string


	/**
	 * Rests instance
	 */
	instance: any


	/**
	 * Current Endpoint Method
	 */
	self: any
	
};

export interface Hooks {
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
	on_request?: (request: HookRequest) => any,

	/**
	 * A hook function that is called on successful response, you can also modify and return a different response.
	 */
	 on_success?: (response: ResponseObject, request?: HookRequest) => any,
	
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
	
	on_error?: (error: ResponseObject | unknown, request?: HookRequest) => any,
}

export type codeTemplateVars = {
	packageName: string,
	endpoint: Endpoint,
	initsJs: string[],
	initsPy: string[],
	categoryName: string,
	requestKey: string,
	rootCategoryKey: string,
	rootRequestKey: string,
	requestParamsJs: string,
	requestParamsPy: string,
}

export interface openAPIOpts {

	/** Hide this endpoint */
	hide?: boolean,

	/** Neccesary for request code samples */
	packageName?: string,

	/** Code samples template */
	jsTemplate?: (codeTemplateVars: codeTemplateVars) => string,

	/** Code samples template */
	pyTemplate?: (codeTemplateVars: codeTemplateVars) => string,

	/** Any field to include in endpoints object */
	fields?: {
		parameters?: any[],
		responses?: any,
		security?: any,
		tags?: any[]
	} | {
		[key: string]: any
	}
}

type $other = {
	openapi: openAPIOpts
} | {
	[key: string]: any | openAPIOpts;
};

export interface Endpoint extends Hooks{
	
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
	 * A short description of the endpoint
	 */
	help?: string,

	/**
	 * A long description of the endpoint
	 */
	comment?: string
	
	/**
	 * Example response for documentation purposes. This can also be generated automatically.
	 */
	example_response?: any

	/**
	 * Any other thing for settings purposes/third-party plugins
	 */
	$other?: $other
}

export interface Options extends Hooks{
	/**
	 * This will be prepended before the requests path. 
	 * 
	 * @example https://example.com
	 */
	base?: string,


	/**
	 * This will be used for sending sandbox requests (useful for automatic response generation mockups)
	 */
	sandboxBase?: string

	/**
	 * Key-value object of headers include in requests
	 */
	headers?: any,

	/**
	 * Params to include in requests
	 */
	params?: OptionsParams,
	
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

	/**
	 * Any other settings for external purposes/third-party plugins
	 */
	$other?: $other
}


export interface CategorySchema {
	/**
	  * A help message, might be used for JSDoc & documentation
	  */
	 help?: string,

	/**
	  * A help message, might be used for JSDoc & documentation
	  */
	$help?: string,

	/**
	 * Override global options for this category
	 */
	 $options?: Options,
}

export interface newCategoryOptions {
	/**
	 * Override global options for this category
	 */
	$options: Options;
}

export interface newCategoryWithOptions extends newCategoryOptions {
	[param: string]: any | Options;
}

export type newCategoryValues = {
	[param: string]: any
} | newCategoryWithOptions;


/**
* A object consisting of Endpoint Objects or nested subcategories. 
*/
export interface Schema extends CategorySchema {
	[name: string]: string | Options | Endpoint | Schema;
};

/*
Alternative type:

export type Schema = CategorySchema | {
	[name: string]: Endpoint
} | {
	[name: string]: Schema
}
 */


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
	): unknown {
	
	const fetch = (typeof window !== 'undefined')  ?  window?.fetch : require("node-fetch"),
		FormData = (typeof window !== 'undefined') ?  window?.FormData : require("form-data");

	if(!fetch) {
		throw new Error("Fetch API is not installed. If you are using Node please run `npm install node-fetch`");
	}

	if(!FormData) {
		throw new Error("FormData is not installed. If you are using Node please run `npm install form-data`");
	}
	
	const copyOptions = (o: Options)=>({
		...o,
		headers: {
			...o.headers
		},
		params: {
			...o.params
		},
		values: {
			...o.values
		},
	});

	const parseSet = (values: newCategoryValues)=>{

		if(values?.__proto__?.constructor?.name != "Object"){
			throw new Error("Invalid $options object.");
		}

		let saveOptions = copyOptions(values.$options || {});
		delete values['$options'];

		return {
			...saveOptions,
			values: {
				...saveOptions.values,
				...values
			}
		};
	}

	const mergeOptions = (
		prevOptions: Options, 
		currentOptions: Options, 
		mutate=false //Mutate the previous options?
	) : Options =>{
		let firstOptions = mutate ? prevOptions || {}: copyOptions(prevOptions || {});

		let secondOptions = copyOptions(currentOptions || {});

		secondOptions.headers = {
			...firstOptions.headers,
			...secondOptions.headers
		}

		secondOptions.params = {
			...firstOptions.params,
			...secondOptions.params
		}

		secondOptions.values = {
			...firstOptions.values,
			...secondOptions.values
		}

		Object.assign(firstOptions, secondOptions);

		return firstOptions;
	}

	endpoints = {...endpoints};

	let global_options: Options = {
		base: "",
		headers: {
			'User-Agent': 'Rests JS (v{restsVersion})'
		},
		params: {}, 
		values: {},
		on_error: void 0,
		on_success: void 0,
		on_request: void 0, 
		fetch_agent: null,
	};

	mergeOptions(global_options, (endpoints?.$options as Options || {}), true);

	mergeOptions(global_options, options, true);

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

	const formToJson = (f: FormData) => {
		return Object.fromEntries(
			Array.from(
				f.keys(), 
				(k:string) => (
					k.endsWith('[]') ? [k.slice(0, -2), f.getAll(k)] : [k, f.get(k)]
				)
			)
		);
	}

	const get = (t: any, path: string) => (
		path.split(".").reduce((r, k) => r?.[k], t)
	);

	const getOne = (...args: any)=>{
		for(var i=0; i < args.length; i++){
			if(args[i] !== null && args[i] !== undefined){
				return args[i];
			}
		}
		return null;
	}
	
	/**
	 * Fetch API
	 */
	const sendRequest = async (url: string, options: any, currentOptions: Options, requestInfo?: HookRequest): Promise<ResponseObject> => {
		
		return fetch(url, options)
			.then(async function (res: Response) {
				
				try {
					var contentType = res.headers.get('Content-Type') || '';

					let corsType: any;
					try{
						corsType = res.type
					}catch(err){
						//prevent errors on cloudflare workers 
					}

					let formattedResponse: ResponseObject = {
						statusCode: res.status,
						statusText: res.statusText,
						headers: res.headers,
						type: corsType,
						ok: res.ok
					}
					
					let responseTypes = {
						'application\/json': 'json',
						'text\/plain': 'text',
						'(multipart\/form\-data|application\/x\-www\-form\-urlencoded)': 'formData',
						'blob': 'blob'
					}
					
					let currentResponseType = Object.keys(responseTypes).find((responseType) => (new RegExp(responseType)).test(contentType)) || "blob";

					formattedResponse[responseTypes[currentResponseType]] = await res[responseTypes[currentResponseType]]();
					

					formattedResponse['message'] = formattedResponse?.json?.message || (
						res.ok ? "Success." : "Something went wrong."
					);
			
					if(!res.ok) {
						throw formattedResponse;
					}

					if(currentOptions.on_success) {
						let successCallbackRes = currentOptions.on_success(formattedResponse, requestInfo);
						if(successCallbackRes !== undefined){
							return successCallbackRes;
						}
					}
					return formattedResponse
				}
				catch(err) {
					if(currentOptions.on_error) {
						let errorCallbackRes = currentOptions.on_error(err, requestInfo);
						if(errorCallbackRes !== undefined){
							return errorCallbackRes;
						}
					}
					return Promise.reject(err);
				}
			});
	}


	/**
	 * Request Wrapper
	 */
	function wrap(endpoint: Endpoint, categoryOptions: Options, categoryKey?: string){
		
		endpoint.method = (endpoint.method || "get").toUpperCase() as methodType,
		endpoint.params = endpoint.params || {};

		const sender = async function (params: {
			[key in keyof typeof endpoint.params]: any
		} | FormData): Promise<ResponseObject | unknown> {

			if(this instanceof sender){
				throw new Error("This is an endpoint, you can't initialize this.");
			}

			var currentOptions: Options = mergeOptions(global_options, categoryOptions);

			currentOptions.on_request = endpoint.on_request || currentOptions.on_request;
			currentOptions.on_success = endpoint.on_success || currentOptions.on_success;
			currentOptions.on_error = endpoint.on_error || currentOptions.on_error;

			var url = `${currentOptions.base}${endpoint.path}`;

			if(params?.['$sandbox'] || currentOptions?.values?.['$sandbox']){
				url = `${currentOptions.sandboxBase || currentOptions.base}${endpoint.path}`;
			}

			var options = {
				method: endpoint.method,
				headers: { ...currentOptions.headers },
				agent: currentOptions.fetch_agent
			}

			var enctype = allowed_param_enctypes.includes(endpoint.enctype) ? endpoint.enctype : def_param_enctypes[endpoint.enctype || "json"];
			
			var request_params = Object.assign({}, currentOptions.params, endpoint.params)

			var bodySerializer = serializers[enctype](),
				querySerializer = new URLSearchParams();
			
			
			/**
			 * Parse Params
			 */
			if(params?.constructor?.name == 'FormData'){
				params = formToJson(params as FormData);
			}
			else{
				params = params || {};
			}


			for (var param_name in request_params){
				var param = request_params[param_name];

				var current_param_value = params[param_name],
					options_param_value = currentOptions?.values?.[param_name],
					default_param_value = param.default,
					example_param_value = (params?.['$sandbox'] || currentOptions?.values?.['$sandbox']) ? param.example : undefined;

				var param_value = getOne(
					current_param_value, 
					options_param_value, 
					example_param_value,
					default_param_value
				);

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

					if(param.validate?.constructor?.name == "RegExp"){
						param.validate['toJSON'] = function(){
							return param.validate.toString().replace(/^\//g,'').replace(/\/$/g,'');
						}
					}
					if(!(new RegExp(param.validate).test(param_value))){
						var error = new Error(param_error);
						error.field = param_name;
						throw error;
					}
				}

				//Max/Min
				if(param.type == "number"){

					if(param.hasOwnProperty('max') && !isNaN(param.max) && Number(param_value) > Number(param.max)){
						var error = new Error(`The maximum allowed value allowed for the ${param_dest} parameter is ${param.max}`);
						error.field = param_name;
						throw error;	
					}

					if(param.hasOwnProperty('min') && !isNaN(param.min) && Number(param_value) < Number(param.min)){
						var error = new Error(`The minimum allowed value allowed for the ${param_dest} parameter is ${param.min}`);
						error.field = param_name;
						throw error;	
					}
				}

				//In
				if(param.in && Array.isArray(param.in) && !param.in.includes(param_value)) {
					var error = new Error(`The ${param_dest} parameter should be one of these values: ${param.in}`);
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
					url = url.replace(new RegExp(`\{${escapeRegExp(param_dest).trim()}\}`),param_value);
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
			

			let requestInfo: HookRequest = {
				url: url,
				options: options,
				params: params,
				key: categoryKey,
				instance: global_options['__$root_instance__'],
				self: wrap(endpoint, categoryOptions, categoryKey)
			}

			//Pre-Request Middleware
			if(currentOptions.on_request) {
				var requestCallbackRes = await Promise.resolve(
					currentOptions.on_request(requestInfo)
				);
				
				if(requestCallbackRes) {
					if(requestCallbackRes?.url || requestCallbackRes?.options){
						url = requestCallbackRes.url || url;
						options = requestCallbackRes.options || options;
					}
					else{
						return requestCallbackRes;
					}
				}

				if(requestCallbackRes === false){
					return false;
				}
			}

			
			return sendRequest(url, options, currentOptions, requestInfo);
		}

		return sender;
	}
	
	/**
	 * Initalize a category and set values for it's endpoints. (Full category options can be updated with special $options key) 
	 */
	function newCategory(name: string, categoryOptions: Options, categoryName?: string, isRoot?: boolean){
		name = name || "Rests";
		var New = {
			[name]: (function(values: newCategoryValues){
				
				if(!(this instanceof New[name])){
					throw new Error("This is a category, you can initalize this category to update values using 'new' command.");
				}

				if(isRoot){
					throw new Error("This is already initialized, you can use 'set' instead.")
				}

				let currentOptions = mergeOptions(global_options, categoryOptions);

				let updateOptions = parseSet(values);
				
				let newOptions = mergeOptions(currentOptions, updateOptions);

				return Rests(categoryName ? get(endpoints, categoryName) : endpoints, newOptions);
			})
		}

		if(isRoot){
			/**
			 * Root object can update it's options
			 */
			New[name]['set'] = function(values: newCategoryValues){

				if(this instanceof New[name]['set']){
					throw new Error("The set object can't be initialized.");
				}
				
				let updateOptions = parseSet(values);

				//Mutate Global Options
				mergeOptions(
					global_options, 
					updateOptions, 
					true
				);
	
				return New[name];
			}
		}
		

		return New[name];
	}


	/**
	 * Recursive loop on schema and make wrappers
	 */
	function traverse<T>(root: T, schema: Schema, categoryOptions: Options, categoryKey?: string): T{

		for(var category in schema){
			var tree = schema[category];
			
			if(!tree || typeof tree !== 'object') {
				continue;				
			}

			//Skip duplicate keys in main object root
			if(typeof root[category] !== "undefined"){
				console.warn(`Skipping ${category} as it confilicts with another key in the object`);
				continue;
			}

			let categoryName = `${categoryKey ? categoryKey + '.' : ''}${category}`

			//Is Endpoint
			if(tree.hasOwnProperty('path')){

				var endpoint = tree as Endpoint;
		
				root[category] = wrap(endpoint, categoryOptions, categoryName);
			}

			//Is Category, recursion
			else {
				
				
				// Don't make category for special objects
				if(category.substr(0, 1) === '$') {
					continue;
				}

				let nextOptions = categoryOptions;

				if(tree?.['$options']){
					nextOptions = mergeOptions(
						categoryOptions, 
						tree?.['$options'] as Options
					)
				}

				root[category] = traverse(
					newCategory(
						category, 
						nextOptions, 
						categoryName
					), 
					tree as Schema, 
					nextOptions,
					categoryName
				);
			}
		}
		
		return root;
	}

	const rootCategory = Object.defineProperty(newCategory("Rests", global_options, undefined, true), '__schema__', {
		value:{
			schema: endpoints,
			options: global_options
		},
		writable: false,
		enumerable: false
	});

	global_options['__$root_instance__'] = rootCategory;

	return traverse(rootCategory, endpoints, {});
}

Rests.default = Rests;

export default Rests;

module.exports = Rests;