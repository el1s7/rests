
const fs = require("fs");
const path = require("path");
const url = require('url');

import {
   newCategoryValues, Options, Schema
} from '../index';

const capitalize = (string: string) => {
	return string.substr(0, 1).toUpperCase() + string.substr(1, string.length);
}

const formatModulePath = (s: string) => (
	/^([a-zA-Z]\:(?:\/|\\))/g.test(s) ? url.pathToFileURL(s) : s
);

const dent = (str: string, size: number=4) =>{
	return str.replace((new RegExp(`^\t{${size}}`, 'gm')),'');
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

	secondOptions.$other = {
		...firstOptions?.$other,
		...secondOptions?.$other,
		openapi:{
			...firstOptions?.$other?.openapi,
			...secondOptions?.$other?.openapi,
			fields:{
				...firstOptions?.$other?.openapi?.fields,
				...secondOptions?.$other?.openapi?.fields,
				parameters: [
					...(firstOptions?.$other?.openapi?.fields?.parameters || []),
					...(secondOptions?.$other?.openapi?.fields?.parameters || []),
				],
				security: [
					...(firstOptions?.$other?.openapi?.fields?.security || []),
					...(secondOptions?.$other?.openapi?.fields?.security || []),
				],
				responses: {
					...firstOptions?.$other?.openapi?.fields?.responses,
					...secondOptions?.$other?.openapi?.fields?.responses,
				}
			}
		}
	}

	Object.assign(firstOptions, secondOptions);

	return firstOptions;
}

const get = (t: any, path: string) => (
	path.split(".").reduce((r, k) => r?.[k], t)
);

const escapeRegExp = (string: string) => {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



const isInitializable = (category: Schema) => {
	return (
		category?.$options?.params && 
		Object.keys(category.$options.params).find((p)=> category.$options.params[p].$initsOnly)
	);
};

module.exports = {
    capitalize, dent, copyOptions, parseSet,
    mergeOptions, get, escapeRegExp, isInitializable,
	formatModulePath
}