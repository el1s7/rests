#!/usr/bin/env node

/*!
 * Rests CLI v1.0.0
 * Author: Elis <github@elis.cc>
 * License: MIT
 */

const fs = require("fs");
const url = require('url');
const path = require("path");
const Rests = require('./index.js');
const getArgs = require('getarg');

interface DocsOptions {
	/**
	 * Generate requests example
	 * 
	 * @default true
	 */
	request?: boolean,
	
	
	/**
	 * Generate response examples?
	 * 
	 * @default false
	 */
	response?: boolean,

	/**
	 * Sleep between requests 
	 * 
	 * @default 0
	 */
	responseSleep?: number,
	
	/**
	 * Don't generate responses automatically
	 * @default true
	 */
	onlyExampleResponses?: boolean,


	/**
	 * Include optionial parameters on docs
	 */
	showOptional?: boolean,

	/**
	 * Add a markdown comment on optional parameters
	 */
	commentOptional?: boolean,

	/**
	 * API Title
	 */
	apiName?: string,
	
	headStartLevel?: number,
	
	/**
	 * File output
	 */
	output?: string,
}

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

		/** HTTP Location */
		location?: "body" | "headers" | "query" | "path",

	}
}

interface Endpoint {
	
	/**
	 * The HTTP request method
	 */
	method: methodType,

	/**
	 * The HTTP request path
	 */
	path: string,


	/**
	 * The body encode type, only for requests that have a body.
	 * 
	 * **form** (multipart/form-data) *default*
	 * 
	 * **url** (application/x-www-form-urlencoded)
	 * 
	 * **json** (application/json)
	 * 
	 * **text** (text/plain)
	 */
	enctype?: "form" | "urlencoded" | "json" | "txt",

	params?: Params,

	/**
	 * A hook function that is called on successful response, you can also modify and return a different response.
	 */
	on_success?: (response: any) => any,

	/**
	 * A hook function that is called on errors.
	 */

	on_error?: (error: any) => any,


	/**
	 * A hook function that is called on request.
	 */
	on_request?: (request: any) => any,

	/**
	 * A description used for documantation generation
	 */
	help?: string,

	/**
	 * Example response for documentation generation
	 */
	example_response?: any
}

interface Options {
	base?: string,

	headers?: any,

	params?: Params,
	
	/**
	 * Set default values for parameters
	 */
	 values?: {
		[param_name: string]: any
	}

	/**
	 * A global hook function that is called on request.
	 */
	on_request?: (request: {url: string, options: any}) => any,

	/**
	 * A hook function that is called on successful response, you can also modify and return a different response.
	 */
 	on_success?: (response: ResponseObject, request?: {url: string, options: any}) => any,

	/**
	 * A hook function that is called on errors.
	 */

	on_error?: (error: ResponseObject | unknown, request?: {url: string, options: any}) => any,

	/**
	 * Node-Fetch option for adding a proxy
	 */
	fetch_agent?: any, 
}

interface newSetObjectOptions {
	/**
	 * Override global options for this category
	 */
	$options: Options;
}
interface newSetObjectWithOptions extends newSetObjectOptions {
	[param: string]: any | Options;
}

type newSetObjectParams = {
	[param: string]: any
} | newSetObjectWithOptions;

interface newSetObject<T> {
	new(values: newSetObjectParams): T;
}

/**
* A object consisting of Endpoint Objects or nested subcategories. 
*/
interface CategorySchema {
	[endpointOrCategory: string]: Endpoint | CategorySchema,
}

/**
* A object consisting of Endpoint Objects or nested subcategories. 
*/
type Category = CategorySchema & {
	/**
	 * Override global options for this category
	 */
	$options?: Options,

	/**
	 * A help message, might be used for documentation generation
	 */
	$help?: string,

	path?: void
}

const capitalize = (string: string) => {
	return string.substr(0, 1).toUpperCase() + string.substr(1, string.length);
}

const getJSDoc = (string: string, tabs=0, tabFirst=false) => (
`${tabFirst ? '\t'.repeat(tabs) : ''}/**
${'\t'.repeat(tabs)} * ${string.replace(/^(\s|\r?\n)/,'').replace(/\r?\n/g,'\n * ')} 
${'\t'.repeat(tabs)} */`);


const dent = (str: string, size: number=4) =>{
	return str.replace((new RegExp(`^\t{${size}}`, 'gm')),'');
}

/**
 * Generate a simple Markdown documentation
 */
async function generateDocs(schema: Category, rests?: typeof Rests, options?: Options, docsOptions?: DocsOptions) {
		
	const config = {
		request: true,
		response: false,
		responseSleep: 0,
		onlyExampleResponses: true,
		showOptional: true,
		commentOptional: true,
		apiName: "api",
		headStartLevel: 1,
		output: "./API.md",
		...docsOptions
	};

	let global_options = {
		base: "",
		headers: {},
		params: {}, 
		on_error: void 0,
		on_success: void 0,
		on_request: void 0, 
		fetch_agent: null,
		...options
	};

	const markdown = {
		reference: "",
		body: ""
	};

	const special_categories = ["$options", "$help"];

	const api = rests || Rests(schema, options);
	
	const get = (t: any, path: string) => (
		path.split(".").reduce((r, k) => r?.[k], t)
	);
  

	const getParams = function(params, default_values, initialize= false) {
		default_values = default_values || {};
		var code = "";
		
		for(var param_name in params) {
			var param = params[param_name];
			var value = param.example || param.default || default_values[param_name] || param.type || "<any>";

			if(!param.required && !config.showOptional) {
				continue;
			}
			if(default_values[param_name] && initialize) {
				continue;
			}
			
			var commentOptional = config.commentOptional && !param.required ? "//" : "";

			var helpers = [
				param.required ? "required" : "optional",
				param.in && Array.isArray(param.in) ? "Allowed: " + param.in.join(", ") : null,
				param.min ? "Min: " + param.min : null,
				param.mix ? "Max: " + param.max : null,
				param.validate ? "Validate: " + (typeof param.validate === "string" ? param.validate : "<custom>") : null
			].filter(h => h).join(" | ");
			
			value = typeof value === "string" ? '"' + value + '"' : value;
			
			code += `	${commentOptional}${param_name}: ${value}, //${helpers}\n`
		}
		return code;
	}

	const getInitialize = function (name, call_name, item_options, options) {
		var params = item_options.params || {};

		var default_values = Object.assign({}, item_options.values, options.values);

		var code = "```javascript\n";
		code += `const ${name} = new ${call_name}.set({\n`;
		code += getParams(params, default_values, true);
		code +="})\n";
		code += "```\r\n\r\n";
		return code;
	}

	const getCall = function (call_name, params, options) {
		params = params || {};
		var code = "```javascript\n";
		code += `${call_name}({\n`;
		code += getParams(params, options.values);
		code +="})\n";
		code += "```\r\n\r\n";
		return code;
	}

	const getRequest = function (item: Endpoint) {
		var code = "<details>\n<summary>Request</summary>\r\n\r\n";

		var method = (item["method"] || "get").toUpperCase();
		var default_location = method === "GET" ? "query" : "body";  
		var params = item["params"] || {};

		code += `**${method}** ${item["path"]}\n`;

		if(Object.keys(params).length) {
			code += "|Parameter|Location|Required|Description|\n|--|--|--|--|\n";
		
			var parameters = Object.keys(params).map(function (name) {
				return [
					params[name].name || name,
					params[name].location || default_location,
					params[name].required ? true : false,
					params[name].help
				].join("|");
			}).join("\n");

			code += parameters + "\n";
		}

		code += "</details>\r\n\r\n";

		return code;
	}

	const getResponse = async function (item: Endpoint, current_call_name: string) {
		var code = "<details>\n<summary>Response</summary>\r\n\r\n";
		var body = item.example_response;

		if(!body) {
			if(config.onlyExampleResponses) {
				return "";
			}
			var send = get(api, current_call_name);
			try {
				console.log(`[*] Generating response for ${item['path']}`);
				//Sleep Between Requests when generating responses to avoid hitting rate limits
				await new Promise(function (res, rej) {
					setTimeout(function () {
						res(true)
					}, config.responseSleep);
				});

				var res = await send();
				body = res.json;
			}
			catch(err) {
				console.log(err);
				return "";
			}
		}

		code += "```json\r\n";
		code += typeof body === "string" ? body : JSON.stringify(body, null, "\t");
		code += "\r\n```\r\n";
		code += "</details>\r\n\r\n";

		return code;
	}
	
	const generate = async function (categories: Category, options: Options, selector: string, call_name: string, level: number, true_level = 0) {
		
		level += 1;	
		var head_level = Math.min(level, 6);

		for(var category in categories) {
			
			if(special_categories.includes(category)) {
				continue;	
			}

			if(!categories[category] || typeof categories[category] !== 'object') {
				continue;				
			}

			var current_call_name = `${call_name}.${category}`;
			var current_selector = `${selector}-${category}`;
			var current_options = options;

			var items = categories[category];
			var isEndpoint = (items["path"] && typeof items["path"] === "string");
			

			var head = `<h${head_level} id="${current_selector}">${capitalize(category)}</h${head_level}>\r\n\r\n`,
				link = "	".repeat(true_level) + `- [${category}](#${current_selector})\r\n`,
				help_string = (items['$help'] || items.help),
				help = typeof help_string === "string" ? help_string + "\r\n" : "",
				initialize = "",
				endpoint = "",
				request = "",
				response = "";
			
			if(items["$options"]) {
				if(items["$options"].params) {
					initialize = getInitialize(category, current_call_name, items["$options"], options);
					current_call_name = category;
				}
				current_options = Object.assign({}, options, items["$options"]);
			}


			if(isEndpoint) {
				endpoint = getCall(current_call_name, items["params"], current_options);
				if(config.request) {
					request = getRequest(items as Endpoint);
				}
				if(config.response) {
					response = await getResponse(items as Endpoint, current_call_name);
				}
			}
			
			markdown.reference += link;
			markdown.body += head + help + initialize + endpoint + request + response;

			if(!isEndpoint) {
				await generate(items as Category, current_options, current_selector, current_call_name, level, true_level + 1)
			}
			
		}
	}

	await generate(schema, global_options, config.apiName, config.apiName, config.headStartLevel);

	if(fs && fs.writeFileSync && config.output) {
		fs.writeFileSync(config.output, markdown.reference + "\r\n\r\n" + markdown.body);
	}

	return markdown;
}


/**
 * Generate typescript interface
 */
function generateTypes(schema: Category, options?:{
	output: string
}){
	let types = dent(`
	type json = 
 			| string
 			| number
 			| boolean
 			| null
 			| json[]
 			| {[key: string]: json};
	
	interface FormData {
		[Symbol.iterator](): IterableIterator<[string, File | string]>;
		/** Returns an array of key, value pairs for every entry in the list. */
		entries(): IterableIterator<[string, File | string]>;
		/** Returns a list of keys in the list. */
		keys(): IterableIterator<string>;
		/** Returns a list of values in the list. */
		values(): IterableIterator<File | string>;
	}

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
	
			/** HTTP Location */
			location?: "body" | "headers" | "query" | "path",
	
		}
	}
	interface Options {
		base?: string,
	
		headers?: any,
	
		params?: Params,
		
		/**
		 * Set default values for parameters
		 */
		 values?: {
			[param_name: string]: any
		}
	
		/**
		 * A global hook function that is called on request.
		 */
		on_request?: (request: {url: string, options: any}) => any,
	
		/**
		 * A hook function that is called on successful response, you can also modify and return a different response.
		 */
		 on_success?: (response: ResponseObject, request?: {url: string, options: any}) => any,
	
		/**
		 * A hook function that is called on errors.
		 */
	
		on_error?: (error: ResponseObject | unknown, request?: {url: string, options: any}) => any,
	
		/**
		 * Node-Fetch option for adding a proxy
		 */
		fetch_agent?: any, 
	}
	
	interface newSetObjectOptions {
		/**
		 * Override global options for this category
		 */
		$options: Options;
	}
	interface newSetObjectWithOptions extends newSetObjectOptions {
		[param: string]: any | Options;
	}
	
	type newSetObjectParams = {
		[param: string]: any
	} | newSetObjectWithOptions;

	interface newSetObject<T> {
		new(values: newSetObjectParams): T;
	}`,1);

	let config = {
		output: "./api.d.ts",
		...options
	}
	
	function makeTypes(tree: Category, parent: string[] | boolean){

		let category_help: string;

		for(var category in tree){
			var category_tree = tree[category];
			
			if(category === '$help'){
				//@ts-ignore
				category_help = tree[category] as string;
			}

			if(!category_tree || typeof category_tree !== 'object') {
				continue;				
			}

			let helpMessage = '';

			//Is Endpoint
			if(category_tree.hasOwnProperty('path')){
				
				let endpoint = category_tree as Endpoint;

				let endpointParams = Object.keys(endpoint.params || {}).map((param)=>{
					let ps = endpoint.params[param],
						help = ps.help ? getJSDoc(ps.help, 1) : '',
						required = ps.required ? '' : '?',
						type = (ps.type || "any").replace(/("|')/g,'').replace("array","any[]").replace("object", "json");
					
					return dent(`
						${help}
						${param}${required}: ${type}
					`, 6);

				}).join('\n');

				let endpointParamsType = endpointParams ? `params: {${endpointParams}\n} | FormData`: '';

				helpMessage = endpoint.help || `${capitalize(category)} - ${(endpoint?.method || 'get').toUpperCase()} request`;

				let endpoint_type = dent(`
					export type ${capitalize(category)} = (${endpointParamsType}) => Promise<ResponseObject>;
				`,5);

				types += endpoint_type;
		
			}
			//Is Category, recursion
			else {
				
				// Skip Special Object (i.e Options)
				if(category.substr(0, 1) === '$') {
					continue;
				}

				let subcategory = category_tree as Category;

				helpMessage = category_help || `${capitalize(category)} Endpoints`;

				let category_type = dent(`
					export interface ${capitalize(category)} {
						/**
						 *	Set paramater values or \`$options\` 
						 */
						set: newSetObject<${capitalize(category)}>
					`,5);
				
				let children = [];

				makeTypes(subcategory, children);

				category_type += children.join('\n');

				category_type += '\n}\n';

				types += category_type;
			}

			if(Array.isArray(parent)){
				parent.push(dent(
					`	${getJSDoc(helpMessage, 1)}
						${category}: ${capitalize(category)}
					`, 5));
			}
		}

		return types;
	}

	let rootType: string = dent(
		`export interface API {
			set: newSetObject<API>
		`, 2);

	let rootChildren = [];

	const generated = makeTypes(schema, rootChildren);

	rootType += rootChildren.join('\n');

	rootType += '\n}';

	types += dent(`
		${rootType}

		declare const API: API;

		export default API;
	`, 2);

	if(fs && fs.writeFileSync && options.output) {
		fs.writeFileSync(config.output, types);
	}

	return types;
}

const main = async () =>{
	const args: any = getArgs({
		types:{
			help: "Generate types, optionally pass the output file dir",
			alias: "t"
		},
		docs:{
			help: "Generate markdown docs, optionally pass the output file dir",
			alias: "d",
		},
		response:{
			help: "Docs: Automatically send requests and create response example",
			requires: ['docs']
		},
		watch:{
			help: "Watch for changes and automatically generate",
			alias: "w"
		},
		print:{
			help: "Print to console instead of saving",
			alias: "p"
		}
	}, {
		usage: dent(`\u001b[0m
		\u001b[94mUsage:\u001b[0m rests ./api.js --types --watch
		
		The schema file can be a .js/.ts/.jsx/.tsx file that has a default export of a Rests instance 'API' \u001b[33m(i.e export default API)\u001b[0m, or it can be a json file.\u001b[94m
		`, 2)
		
	});

	const schemaFile = path.join(process.cwd(), process.argv[0] === 'rests' ? process.argv[1] : process.argv[2]),
		schemaName = path.basename(schemaFile).replace(/\.[^\.]+$/g,''),
		schemaImportPath = /^([a-zA-Z]\:(?:\/|\\))/g.test(schemaFile) ? url.pathToFileURL(schemaFile) : schemaFile;


	//@ts-ignore
	const isJSON = /\.json$/.test(schemaFile),
		isJS = /\.(m?jsx?|tsx?)$/.test(schemaFile),
		parseFile = isJS ? 
		(await import(schemaImportPath)).default :
		(
			isJSON ? JSON.parse(fs.readFileSync(schemaFile, "utf-8")) : null
		);

	if(isJS && !parseFile){
		console.error("We couldn't import the Rests instance. Make sure you have exported it correctly, i.e \u001b[33mexport default API\u001b[0m");
		process.exit();
	}

	if(!parseFile){
		console.error("Invalid schema file");
		process.exit();
	}

	const restsInstance = isJS && parseFile,
		schema = restsInstance ? restsInstance.__schema__.schema : parseFile,
		options = restsInstance ? restsInstance.__schema__.options : undefined;

	const makeDocs = async ()=>{
		const docsOutFile = (
			typeof args.types == "string" ? 
			path.join(process.cwd(), args.types) : 
			path.join(process.cwd(), 'API.md')
		);
		const generatedDocs = await generateDocs(schema, restsInstance, options, {
			response: args.response || false,
			output: args.print ? false : docsOutFile
		});

		console.info("[+] " + (new Date()).toLocaleTimeString() + " Docs have been generated.");

		if(args.print){
			console.log(generatedDocs);
			return generatedDocs;
		}

		return docsOutFile;
	};

	const makeTypes = async ()=>{
		const typesOutFile = (
			typeof args.types == "string" ? 
			path.join(process.cwd(),args.types) : 
			path.join(process.cwd(), schemaName + '.d.ts')
		);

		const generatedTypes = generateTypes(schema, {
			output: args.print ? false : typesOutFile
		});

		console.info("[+] " + (new Date()).toLocaleTimeString() + " Types have been generated.");

		if(args.print){
			console.log(generatedTypes);
			return generatedTypes;
		}

		return typesOutFile;
	}

	if(args.docs){
		makeDocs();
	}

	if(args.types){
		makeTypes();
	}

	if(args.watch){
		
		console.info("[*] Watching for changes..");

		let lastStats = (await fs.promises.stat(schemaFile));

		while(true){
			await new Promise((res,rej)=> setTimeout(res.bind(null, true), 1000));

			let currentStats = (await fs.promises.stat(schemaFile));

			if(currentStats.mtimeMs !== lastStats.mtimeMs){
				
				if(args.docs){
					makeDocs();
				}
			
				if(args.types){
					makeTypes();
				}
			}

			lastStats = currentStats;
		}
	}
}



main();