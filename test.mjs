
import assert from 'assert';
import API from './demo.mjs';

// Some more tests needed
// Feel free to contribute
// I don't like writing automated tests

describe('Rests API Main', function () {
	it('Basic Request Test', async function () {
		const res = await API.user.login({
			username: 'testusername',
			password: 'testpassword'
		});
	
		assert.deepStrictEqual(res?.json?.json, {
			username: 'testusername',
			password: 'testpassword'
		})
	});

	it('Should allow endpoints without params & request method', async function () {
		let res = await API.empty()

		assert.strictEqual(res.json.url, 'https://httpbin.org/get');
	});

	const profile = new API.user.profile({
		authorization: 'tokentest'
	});

	it('Should not inherit sibling options', async function () {
		const res = await API.user.overview();
		assert.strictEqual(res.json.args.o, "1");
	});

	it('Should throw error for double initialization of root', async function () {
		try{
			const profile_two = new profile({
				authorization: 'tokentwo'
			});
		}
		catch(e){
			assert.match(e.message, /^This is already initialized/);
		}
	});

	it('Should throw error for required parameters', async function () {
		try{
			await API.user.profile.info();
		}
		catch(e){
			assert.strictEqual(e.field, 'authorization');
		}
	});

	it('Subcategories should inherit updated values', async function () {
		let res = await profile.about.me();

		assert.strictEqual(res.json.headers?.['X-Auth'], 'tokentest');
	});

	it('Subcategories should inherit updated options', async function () {
		profile.set({
			$options: {
				params: {
					secure: {
						name: 'X-Secure',
						required: true,
						location: 'headers',
					}
				}
			}
		});


		let res = await profile.about.me({
			authorization: 'tokencool',
			secure: 'yes'
		});

		assert.strictEqual(res.json.headers?.['X-Auth'], 'tokencool');
		assert.strictEqual(res.json.headers?.['X-Secure'], 'yes');
	});
	
	
});

