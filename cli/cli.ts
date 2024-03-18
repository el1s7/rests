#!/usr/bin/env node

/*!
 * Rests CLI v{restsVersion}
 * Author: Elis <github@elis.cc>
 * License: MIT
 */

const fs = require("fs");
const cp = require('child_process');
const YAML = require("yaml");

const path = require("path");
const Rests = require('../index.js');
const getArgs = require('getarg');

const ts = require("typescript");
const package_info = require("../../package.json");

const { capitalize, dent, copyOptions, parseSet,
	mergeOptions, get, escapeRegExp, isInitializable, formatModulePath, tsToJs} = require("./helpers");

import {
	ResponseObject, paramOptions, Params, 
	OptionsParams, codeTemplateVars, 
	openAPIOpts, Endpoint, Options, newCategoryOptions, 
	newCategoryValues, Schema
} from '../index';


const generateDocs = require("./markdown");
const generateTypes = require("./types");

const privateMessage = async (...args: any)=>(
	console.log("This feature is only available on the private edition :)"),
	process.exit()
);

const getModule = (name: string) => {
	const globalRoot = cp.execSync('npm root -g').toString().trim();
	const globalModulePath = path.join(globalRoot, name);

	try {
		return require(globalModulePath)
	}
	catch(e){
	}


	try {
		return require(name)
	}catch(e){}

	return false;
}




const privateModule = getModule('rests-private');

const generatePython = privateModule ? privateModule.generatePython : privateMessage;
const generateOpen = privateModule ? privateModule.generateOpen : privateMessage;

const main = async () =>{

	const ascii_art = decodeURIComponent("%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20_%20%20%20%20%20%20%20%0A%20_%20__%20___%20%20___%7C%20%7C_%20___%20%0A%7C%20%27__%2F%20_%20%5C%2F%20__%7C%20__%2F%20__%7C%0A%7C%20%7C%20%7C%20%20__%2F%5C__%20%5C%20%7C_%5C__%20%5C%0A%7C_%7C%20%20%5C___%7C%7C___%2F%5C__%7C___%2F%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A");

	const usage = dent(`${ascii_art}
		V.${package_info.version} by ${package_info.author}

		\u001b[0m\u001b[94mUsage:\u001b[0m rests ./api.js --types --watch
		
		The schema file can be a .js/.jsm/.ts file that has a default export of a Rests instance 'API' \u001b[33m(i.e export default API)\u001b[0m, or it can be a json file.\u001b[94m
		`, 2);
	
	const args: any = getArgs({
		types:{
			help: "Generate types, optionally pass the output file dir",
			alias: "t"
		},
		docs:{
			help: "Generate markdown docs, optionally pass the output file dir",
			alias: "d",
		},
		python:{
			help: "Generate Python API SDK",
			alias: "p"	
		},
		openapi:{
			help: "Generate open API file",	
		},
		watch:{
			help: "Watch for changes and automatically generate",
			alias: "w"
		},
		print:{
			help: "Print to console instead of saving",
		},
		types_template:{
			help: "The types file template path",
			type: "string"
		},
		python_template:{
			help: "The python file template path",
			type: "string"
		},
		openapi_template:{
			help: "The openapi template file, JSON or YAML object.",
			type: "string"
		},
		responses:{
			help: "Automatically make responses schema examples for documentation",
			type: "boolean",
		},
		code_samples:{
			help: "Automatically generate code samples for documentation",
			type: "boolean",
			default: true
		},
		use_cache:{
			help: "OpenAPI: Use cached responses/request samples",
		},
		examples:{
			help: "Include examples in documentation and comments",
			type: "boolean",
			default: true
		},
		
	}, {
		usage
	});

	const schemaFile = path.join(process.cwd(), process.argv[0] === 'rests' ? process.argv[1] : process.argv[2]);

	if(!schemaFile){
		console.error(usage);
		process.exit();
	}

	const schemaName = path.basename(schemaFile).replace(/\.[^\.]+$/g,''),
		schemaImportPath = formatModulePath(schemaFile);


	//@ts-ignore
	const isJSON = /\.json$/.test(schemaFile),
		isJS = /\.(m?jsx?|tsx?)$/.test(schemaFile),
		isTS = /\.tsx?$/.test(schemaFile) && tsToJs(schemaFile),
		tsImportPath = formatModulePath(isTS),
		importFile = isJS ? 
			(
				isTS 
				? (await import(tsImportPath)).default
				: (await import(schemaImportPath)).default
			)
			:
			(
				isJSON ? JSON.parse(fs.readFileSync(schemaFile, "utf-8")) : null
			),
		parseFile = importFile.__esModule && importFile.default ? importFile.default : importFile;

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
			responses: args.responses,
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
			output: args.print ? false : typesOutFile,
			includeExamples: args.examples,
			template: args.types_template
		});

		console.info("[+] " + (new Date()).toLocaleTimeString() + " Types have been generated.");

		if(args.print){
			console.log(generatedTypes);
			return generatedTypes;
		}

		return typesOutFile;
	}

	const makePython = async ()=>{
		const pythonOutFile = (
			typeof args.python == "string" ? 
			path.join(process.cwd(),args.python) : 
			path.join(process.cwd(), schemaName + '.py')
		);

		const generatedAPI = generatePython(schema, {
			output: args.print ? false : pythonOutFile,
			includeExamples: args.examples,
			template: args.python_template
		});

		console.info("[+] " + (new Date()).toLocaleTimeString() + " Python API has been generated.");

		if(args.print){
			console.log(generatedAPI);
			return generatedAPI;
		}

		return pythonOutFile;
	}

	const makeOpenAPI = async ()=>{
		const openAPIOut = (
			typeof args.openapi == "string" ? 
			path.join(process.cwd(), args.openapi) : 
			path.join(process.cwd(), schemaName + '-openapi.yaml')
		);

		const generatedOpenAPI = generateOpen(schema, restsInstance, {
			output: args.print ? false : openAPIOut,
			template: args.openapi_template,
			responses: args.responses,
			codeSamples: args.code_samples,
			useCache: args.use_cache,
			includeExamples: args.examples
		});

		console.info("[+] " + (new Date()).toLocaleTimeString() + " Open API schema has been generated.");

		if(args.print){
			generatedOpenAPI.then(console.log);
			return generatedOpenAPI;
		}

		return generatedOpenAPI;
	}

	if(args.docs){
		makeDocs();
	}

	if(args.types){
		makeTypes();
	}

	if(args.python){
		makePython();
	}

	if(args.openapi){
		makeOpenAPI();
	}

	if(args.watch){
		const watchFile = isTS || schemaFile;

		if(isTS){
			(async function watchTs() {
				tsToJs(schemaFile,true);
			})();
		}

		console.info("[*] Watching for changes..");

		let lastStats = (await fs.promises.stat(watchFile));

		while(true){
			await new Promise((res,rej)=> setTimeout(res.bind(null, true), 1000));

			let currentStats = (await fs.promises.stat(watchFile));

			if(currentStats.mtimeMs !== lastStats.mtimeMs){
				
				if(args.docs){
					makeDocs();
				}
			
				if(args.types){
					makeTypes();
				}

				if(args.python){
					makePython();
				}

				if(args.openapi){
					makeOpenAPI();
				}
			}

			lastStats = currentStats;
		}
	}
}

main();

