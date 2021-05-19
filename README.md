  

# Wrape

[![license](https://img.shields.io/github/license/elis-k/wrape)](https://github.com/elis-k/wrape/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/wrape)](https://www.npmjs.com/package/wrape) [![npm](https://img.shields.io/npm/dw/wrape)](https://www.npmjs.com/package/wrape)


Easily generate API client's SDK — organize and simplify API Requests.
If you find yourself repeating HTTP requests code blocks, then this library is for you.
  
  ### Transform this
 ```javascript
fetch("https://example.com/login",{
	'method': 'POST',
	'headers': {
		'Content-Type': 'application/x-www-form-urlencoded'
	},
	'data': 'user=test&password=test'
}).then((res) => (if(!res.ok){ throw new Error("error")})
.then((res) => res.json())
.catch((err) => console.warn)
.then(data)=> (console.log("Finally the response")));
```

### Into this

```javascript
api.login({
	user: 'test',
	password: 'test'
})
.then((data)=>(console.log(`Logged in!`)));

```

## Features

- No dependencies, using Fetch API
- Documentation Generator
- Multiple API categories & subcategories
- Elegant parameter handling
- Universal support, small size (2.9KB)
- For Browsers & Node.js


  
## Installation

`npm i wrape`

  
## Usage

You start by writing a JSON schema of all your API endpoints. 
You can split requests into categories and subcategories.
```javascript
import  Wrape  from  'wrape';

const endpoints = {
	user:{
		login:{
			path:  '/user/login',
			method:  'POST',
			params:{
				username:{
					required:  true,
				},
				password: {
					required:  true,
					help:  "The password must be at least 8 characters.",
					validate: (password) => { return  password.length >= 8;}

				}
			}
		}
	}
}

const  api = Wrape(api_config,{ base:  'https://example.com'});

api.user.login({username:  'john', password:'short'}).catch((err) => {
	console.log(err.message); //The password must be at least 8 characters.
});

api.user.login({username:  'john', password:'wrong_password'})
.catch((res) => {
	console.log(res.json.message); //User password is invalid.
	console.log(res.status); //401
});
```

  ##  Real-life Usages
Some projects using Wrape:

- https://github.com/tikapi-io/tiktok-api

## Quick  Documentaion

### API Configuration

#### Categories
 An API category is an object consisting of [Endpoint Object](#endpoint-object)s or subcategories.
A category can also contain special keys:
  - **`$options`**: Set options for this category, same object as  [Gloabl Options](#global-options)
  - **`$help`**:  A  description used for documentation generation 

#### Endpoint Object
  - **`method`**: The request method ,GET,POST etc.
  - **`path`**: The request path or full URL, which can also contain named parameters,  check [exmaple](#another-example) below. 
  - **`enctype`**: The body encode type for \*only for *requests that have body* parameters:
	 - **`form`**` (multipart/form-data)` *(default)*
	 - **`url`**` (application/x-www-form-urlencoded)`
	 - **`json`**` (application/json)`
	 - **`text`**` (text/plain)`
  - **`params`**: An object consisting of [Params Object](#params-object)s.
  - **`response`**: A hook function for modifying the response.
  - **`request`**: A hook function for modifying the request.
  - **`help`**: A description used for documantaion generation
  - **`example_response`**: Example response used for documentation generation

#### Params Object
 - **`name`**: By default the param name is the Param object key. 
 - **`required`**: If this param is required or not.
 - **`format`**: A function to format the parameter value.
 - **`validate`**: Validate the param values, it can be:
     - A Regular expression string.
     - A function, that returns a boolean.
 - **`in`**:  Array of valid allowed values
 - **`help`** : An error message to throw if param is not valid, or required.
 - **`default`**: A default value for this param.
 - **`location`**: The location where this parameter will be in http request fields, it can be:
     - **`body`** the param will be encoded in body as form data *(default for POST request)*
     - **`query`** the param will be URL encoded in URL query *(default for GET request)*
     - **`headers`** the param will be set in request headers
     - **`path`** the param will be set in request path, you must declare the named parameters in   path. 
  - **``example``** : Example values used for documentation generation

### Global Options
This is the global options you set when you initalize Wrape, these options can be overridden by Category options.

`Wrape(endpoints,global_options)`
  - **`base`**: The base Origin for all endpoints, will be prepended to each request path, default is empty.
  - **`headers`**:  Append Headers to all requests
  - **`values`**: An object of `{param_key : param_value}`, useful for setting default values for all categories and endpoints.
   - **`sender`**: Use a custom function to send request -> `custom_fetch(url, options, wrape_options, response_middleware?)`
   - **`request_middleware`**:  Global hook pre-request function
   - **`response_middleware`**: Global hook on response function
  - **`fetch_parse`**: Parse Fetch Response (await JSON body\await body text) *(default true)*
  - **`fetch_error_handler`**:  Function to handle fetch errors
  - **`fetch_agent`**: You can use this option to set proxy if you're using node-fetch. 
  

### Documentation Generator
You can generate a Markdown reference of the API, just like this:

```javascript
api.$docs({
	output: "API.md",
});
```

  
### Responses
The response of request is parsed based when `fetch_parse` option is true, returning an object like this:
```javascript
{
	status: 200,
	statusText: 'OK',
	headers: {...},
	json: {'message': 'success'},
}	
```
Depending on the content type, you can get the body as `text` or `json`.


## Advanced Example

In this example we declare a user category and set it's options with the special `$options` key.
We also declare a `information` endpoint which contains `path` parameters.
```javascript
import Wrape from 'wrape';

const endpoints = {
	user:{
		//This $options: A special key which overrides Global Options for this category and it's subcategories
		$options:{
			base: 'https://example.com/login'
		},
		
		profile:{
			information:{
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
			edit: {...} //Other Endpoint/Subcategories for this category
		}		   
	}
}
const api = Wrape(api_config);
```
#### Setting Variables
You can set enviroment variables for a category by initializing it with `set` function. 
```javascript
const User = new api.user.set({
	authorization: 'default_auth_token'
}); 

User.info({id: 1}).then((res) => {
	console.log(res.json);
});
```
