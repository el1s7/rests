import Rests from './lib/index.js';

const API = Rests({
	$options: {
		base: 'https://postman-echo.com'
	},
	empty:{
		help: 'Default get without params',
		path: '/get'
	},
	user:{
        help: 'The user endpoints',
		login:{
            help: 'User login request',
			path: '/post',
			method: 'POST',
			params:{
				username:{
					required: true,
					type: "string",
					help: "A valid username is required",
					validate: /\w+/
				},
				password: {
					required:  true,
					help: "A valid password is required",
					type: "string",
					
					format: (password) => { 
						if(password.length < 8){
							throw new Error("The password must be at least 8 characters.");
						}
						return password;
					}

				}
			}
		},
		profile: {
            help: 'Logged in user',
			$options:{
				params:{
					//Set authentication parameters for all requests in this category
					authorization: {
                        name: 'X-Auth',
                        location: 'headers',
                        required: true,
                        help: "The user authorization is required.",
                        validate: /^token/
                    }
				}
			},
			info: {
                help: 'User info',
                path: '/headers'
			},
			about:{
				me:{
					help: 'User about',
					path: '/headers'
				}
			},
			update: {
                help: 'User update profile.',
                method: 'POST',
				path: '/status/403',
                enctype: 'form',
                params: {
                    username: {
                        required: true,
                        type: "string",
                        help: "A valid username is required",
                        validate: /\w+/
                    }
                }
			}
		},
		overview:{
			path: '/get?o=1',
		}
	}
});

export default API;