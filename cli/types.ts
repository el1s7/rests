const fs = require("fs");
const path = require("path");

const { capitalize, dent, mergeOptions} = require("./helpers");

import {
	Endpoint, Options,  Schema
} from '../index';


/**
 * Generate typescript interface
 */
 function generateTypes(schema: Schema, options?:{
	output: string,
	includeExamples?: boolean,
	template?: string,
}){
	let types = fs.readFileSync('./types.file', 'utf-8');

	let config = {
		output: null,
		includeExamples: true,
		template: null,
		...options
	}

	if(config.template){
		types = fs.readFileSync(path.join(process.cwd(), config.template), 'utf-8');
	}

	const getJSDoc = (string: string, tabs=0, tabFirst=false) => {
		let padding = '\t'.repeat(tabs);
		return(
`${tabFirst ? padding : ''}/**
${padding} * ${string.replace(/^(\s|\r?\n)/,'').replace(/\r?\n/g,`\n${padding} * `)} 
${padding} */`);
	}
	
	function makeTypes(tree: Schema, parent: string[], categoryOptions: Options={}, parentTreeKey?: string){

		let category_help: string;

		for(var category in tree){
			var category_tree = tree[category];
			
			if((category == 'help' || category == '$help') && typeof category_tree === "string"){
				//@ts-ignore
				category_help = tree[category] as string;
			}

			if(!category_tree || typeof category_tree !== 'object') {
				continue;				
			}

			let helpMessage = '';

			let treeKey = parentTreeKey ? parentTreeKey + capitalize(category) : capitalize(category); 

			//Is Endpoint
			if(category_tree.hasOwnProperty('path')){
				
				let endpoint = category_tree as Endpoint;

				let endpointParams = {
					...categoryOptions?.params,
					...endpoint.params
				};

		
				let parseEndpointParams = 
				
				Object.keys(endpointParams || {})
				.sort((b, a)=> (
					endpointParams[a].required && !endpointParams[b].required ? 1 : (
						!endpointParams[a].required && endpointParams[b].required ? -1 : (
							!endpoint?.params?.[a] && endpoint?.params?.[b] ? -1 : (
								!endpoint?.params?.[b] && endpoint?.params?.[a] ? 1 : 0
							)
						)
					)
				))
				.map((param)=>{
					let ps = endpointParams[param];
					
					if(ps['$initsOnly']){
						return null;
					}

					let help = ps.help ? ps.help : '',
						exampleValue = ps.example ?? ps.default ?? categoryOptions?.values?.[param],
						helpWithExample = config.includeExamples && exampleValue ? dent(`
							${help}	

							@example
							
							\`${JSON.stringify(exampleValue)}\`
						`,7) : '',
						required = ps.required && false ? '' : '?',
						type = (ps.type || "any").replace(/("|')/g,'').replace("array","any[]").replace("object", "json");
					
					return dent(`
						${getJSDoc(helpWithExample || help, 1, true)}
							${param}${required}: ${type}
					`, 6);

				}).filter(p => p).join('\n');

				let endpointParamsType = parseEndpointParams ? `params?: {${parseEndpointParams}\n} | FormData`: '';

				helpMessage = endpoint.help || `${capitalize(category)} - ${(endpoint?.method || 'get').toUpperCase()} request`;

				let endpoint_type = dent(`
					${getJSDoc(helpMessage, 1)}
					${category}: (${endpointParamsType}) => Promise<ResponseObject>;
				`,4);

				parent.push(endpoint_type);
				
		
			}
			//Is Category, recursion
			else {
				
				// Skip Special Object (i.e Options)
				if(category.substr(0, 1) === '$') {
					continue;
				}

				let subcategory = category_tree as Schema;

				let nextOptions = categoryOptions;
				if(subcategory.$options){
					nextOptions = mergeOptions(
						categoryOptions, 
						subcategory.$options
					);
				}

				helpMessage = category_help || `${capitalize(category)} Endpoints Category`;

				let category_type = dent(`
					export interface ${treeKey} extends newCategory<${treeKey}> {
					`,5);
				
				let children = [];

				makeTypes(subcategory, children, nextOptions, treeKey);

				category_type += children.join('\n');

				category_type += '\n}\n';

				types += category_type;

				parent.push(dent(
					`	${getJSDoc(helpMessage, 1)}
						${category}: ${treeKey}
					`, 5));
				
			}
		}

		return types;
	}

	let rootType: string = dent(
		`export interface API extends updateOptions<API> {
		`, 2);

	let rootChildren = [];

	const generated = makeTypes(schema, rootChildren, schema?.$options || {}, "API");

	rootType += rootChildren.join('\n');

	rootType += '\n}';

	types += dent(`
		${rootType}

		declare const API: API;

		export default API;
	`, 2);

	if(fs && fs.writeFileSync && options.output) {
		fs.writeFileSync(config.output, types, {
			encoding: "utf8"
		});
	}

	return types;
}

module.exports = generateTypes;