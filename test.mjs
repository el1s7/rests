import Rests from './lib/index.js';
import assert from 'assert';

const API = Rests({
	$options: {
		base: 'https://httpbin.org'
	},
	user:{
        $help: 'The user endpoints',
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
            $help: 'Logged in user',
			$options:{
				params:{
					//Set authentication parameters for all requests in this category
					authorization: {
                        name: 'Authorization',
                        location: 'headers',
                        required: true,
                        help: "The user authorization is required.",
                        validate: /^token/
                    }
				}
			},
			info: {
                help: 'User info',
                path: '/anything/user/info'
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
		}
	}
});


// TODO - Add some tests
// Feel free to contribute

const minimalTest =  async () => {
    const res = await API.user.login({
        username: 'testusername',
        password: 'testpassword'
    });

    assert.deepStrictEqual(res?.json?.json, {
        username: 'testusername',
        password: 'testpassword'
    })

    console.log('[*] Basic request test - PASS');
}

minimalTest();