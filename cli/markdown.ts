
const fs = require("fs");
const Rests = require('../index.js');

const { capitalize, mergeOptions, get, isInitializable} = require("./helpers");

import {
	Endpoint, Options, Schema
} from '../index';



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
	responses?: boolean,

	/**
	 * Sleep between requests 
	 * 
	 * @default 0
	 */
	responseSleep?: number,


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

/**
 * Generate a simple Markdown documentation
 */
async function generateDocs(schema: Schema, rests?: typeof Rests, options?: Options, docsOptions?: DocsOptions) {
		
	const config = {
		request: true,
		responses: false,
		responsesSleep: 0,
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
	};

	mergeOptions(global_options, options, true);

	const markdown = {
		reference: "",
		body: ""
	};


	const api = rests || Rests(schema, options);
	

	const getParams = function(params, default_values, initialize= false) {
		default_values = default_values || {};
		var code = "";
		
		for(var param_name in params) {
			var param = params[param_name];
			var value = param.example ?? param.default ?? default_values[param_name] ?? param.type ?? "<any>";

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
				param.validate ? "Validate: " + (typeof param.validate === "string" ? param.validate : param.validate.toString()) : null
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
		code += `const ${name} = new ${call_name}({\n`;
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
			if(!config.responses) {
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

				var res = await send({
					$sandbox: true
				});

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
	
	const generate = async function (categories: Schema, options: Options, selector: string, call_name: string, level: number, true_level = 0) {
		
		level += 1;	
		var head_level = Math.min(level, 6);

		for(var category in categories) {
			

			if(!categories[category] || typeof categories[category] !== 'object') {
				continue;				
			}

			
			if(category.startsWith('$')) {
				continue;	
			}

			var current_call_name = `${call_name}.${category}`;
			var current_selector = `${selector}-${category}`;
			var current_options = options;

			var items = categories[category];
			var isEndpoint = (items["path"] && typeof items["path"] === "string");
			

			var head = `<h${head_level} id="${current_selector}">${capitalize(category)}</h${head_level}>\r\n\r\n`,
				link = "	".repeat(true_level) + `- [${category}](#${current_selector})\r\n`,
				help_string = (items['$help'] || items['help']),
				help = typeof help_string === "string" ? help_string + "\r\n" : "",
				initialize = "",
				endpoint = "",
				request = "",
				response = "";
			
			if(items["$options"]) {

				if(isInitializable(items as Schema)) {
					initialize = getInitialize(category, current_call_name, items["$options"], options);
					current_call_name = category;
				}
				current_options = mergeOptions(options, items["$options"]);
			}


			if(isEndpoint) {
				endpoint = getCall(current_call_name, items["params"], current_options);
				if(config.request) {
					request = getRequest(items as Endpoint);
				}

				response = await getResponse(items as Endpoint, current_call_name);

			}
			
			markdown.reference += link;
			markdown.body += head + help + initialize + endpoint + request + response;

			if(!isEndpoint) {
				await generate(items as Schema, current_options, current_selector, current_call_name, level, true_level + 1)
			}
			
		}
	}

	await generate(schema, global_options, config.apiName, config.apiName, config.headStartLevel);

	if(fs && fs.writeFileSync && config.output) {
		fs.writeFileSync(config.output, markdown.reference + "\r\n\r\n" + markdown.body, {
			encoding: "utf8"
		});
	}

	return markdown;
}


module.exports = generateDocs;