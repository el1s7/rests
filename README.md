
# Wrape
[![license](https://img.shields.io/github/license/elis-k/wrape)](https://github.com/elis-k/wrape/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/wrape)](https://www.npmjs.com/package/wrape)
[![npm](https://img.shields.io/npm/dw/wrape)](https://www.npmjs.com/package/wrape)

Easily generate API client's SDK — organize and simplify API Requests — OOP-ish way.

## Features  
- No dependencies, using Fetch API
- Multiple API categories & subcategories
- Elegant parameter handling
- Universal support, small size (2.9KB)

& much more.

## Installation
`npm i wrape`

## Quick  Documentaion
### Usage
```javascript
import Wrape from 'wrape';
import {api_configuration,options} from './config';
const api = Wrape(api_configuration,options);
```

### API Configuration

#### Categories
 An API category is an object consisting of [Endpoint Object](#endpoint-object)s or subcategories.

#### Endpoint Object
  - **`method`**: The request method ,GET,POST etc.
  - **`path`**: The request path, can also contain named parameters,  check [exmaple](#another-example) below. 
  - **`enctype`**: The body encode type for *requests that have body* parameters:
	 - `multipart/form-data` *(default)*
	 - `application/x-www-form-urlencoded`
	 - `application/json`
  - **`params`**: An object consisting of [Params Object](#params-object)s.

#### Params Object
 - **`name`**: By default the param name is the object key. Here you can specify another name for the param which will be sent on the request, though still the key will be used for reference when calling endpoint and passing param.
 - **`required`**: If the param is required or not, error will be thrown if required params are not specified.
 - **`format`**: A function to format the parameter value.
 - **`validate`**: Validate the param values, it can be:
     - A Regular expression string.
     - A function, that returns a boolean.
 - **`help`** : An error message to throw if param is not valid, or required and not specified.
 - **`default`**: A default value when value for this param was not specified.
 - **`location`**: The location where this parameter will be in http request fields, it can be:
     - `body` the param will be encoded in body as form data *(default for POST request)*
     - `query` the param will be URL encoded in URL query *(default for GET request)*
     - `headers` the param will be set in request headers
     - `path` the param will be set in request path, you must declare the named parameters in   path, check [exmaple](#another-example) below. 

### Global Options
This is the global options you set when you initalize Wrape, `Wrape(api_config,global_options)`
  - **`base`**: The base URL for this API, will be prepended to each request path, default is empty.
  - **`defaultHeaders`**: The global headers to add to all requests.
  - **`defaultParamValues`**: An object of `{param_key : param_value}`, useful for setting default values for all categories and endpoints.
  - **`parseResponse`**: Parse response and throw errors, if disabled the response will be the default Fetch API response.
  - **`agent`**: You can use this option to set proxy if you're using node-fetch.
	
### Responses
The response of request is parsed based by default, returning an object like this:
```javascript
{
	status: 200,
	statusText: 'OK',
	headers: {...},
	json: {'message': 'success'},
}	
```
Depending on the content type, you can get the body as `text`,`json` or `arrayBuffer`.
	HTTP statuses other than OK, with throw an promise reject error with the response object.

## Examples

#### Basic Example
```javascript
import Wrape from 'wrape';

(async function(){

//The JSON API Configuration object that Wrape uses to create the API model 
const api_config = {
	user:{
		info:{
			path: '/user/info',
			method: 'GET',
			params:{
				id:{
					required: true,
					help: "The user ID is required.",
					validate: "^[0-9]+$",
				},
				authorization:{
					required: true,
					help: "The user authorization token is required.",
					location: "headers"
				}
			}
		}
		/* You can add other endpoints for the user category
		edit:{...}
		*/
	}
	/* You can add other categories 
	analytics:{...}
	*/
	
}
const api = Wrape(api_config,{base: 'https://httpbin.org/anything'});
const User = new api.user.set({authorization: 'login_token'}); /* Initialzing with set function */
var userInfo = await User.info({id: 1});
var userInfo = await api.user.info({id: 1,authorization:'login_token'}) /* Without initalizing */

})


```
In the example above, we have have created a `user` category with a `info` endpoint. 
You can call endpoint by passing an object of params, if params are invalid or required it will throw an error with the param help message.
Categories can be initalized by using the `set` function to store param values, the param values are readable by each endpoint of that category. You can also call the endpoint directly without initalization.

#### Another Example
```javascript
import Wrape from 'wrape';

(async function(){

const api_configuration = {
	analytics:{
			log:{
				path: '/analytics/log',
				method:'GET',
				params:{}
			}
	},
	user:{
		profile:{
			path: '/profile/:id',
			method: 'GET',
			params:{
				id:{
					required: true,
					help: "The user ID is required.",
					validate: "^[0-9]+$",
					location: "path"
				},
				key:{
					name: 'Authorization',
					required: true,
					help: "The user authorization token is required.",
					validate: "^Bearer (.*?)$",
					location: "headers"
				}
			}
		},
		comment:{
			path: '/user/feed',
			method: 'POST',
			params:{
				comment:{
					required: true,
					help: "The comment text is required.",
				},
				key:{
					name: 'Authorization',
					required: true,
					help: "The user authorization token is required.",
					validate: "^Bearer (.*?)$",
					location: "headers"
				}
			}
		}
		
	}

}

const api = Wrape(api_configuration,{
	base: 'https://example.com',
});

//Call Analytics Log Endpoint
api.analytics.log();

//Initialize User category and set the key 
const user = new api.user.set({key: "Bearer ..."});


user.comment({
	comment: 'This is a comment.'
}).then((res)=> console.log(res))
}).catch((err)=> console.log(err));


try{
	var userInfo = await user.info({id:'1'});
}
catch(err){ console.log(err)}	

});

```