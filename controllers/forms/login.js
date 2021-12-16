'use strict';

const loginAccount = require(__dirname+'/../../models/forms/login.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username', 'password'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: 'ユーザー名がありません' },
			{ result: existsBody(req.body.password), expected: true, error: 'パスワードがありません' },
			{ result: lengthBody(req.body.username, 0, 50), expected: false, error: 'ユーザー名は1〜50文字である必要があります' },
			{ result: lengthBody(req.body.password, 0, 100), expected: false, error: 'パスワードは1〜100文字である必要があります' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/login.html'
			})
		}

		try {
			await loginAccount(req, res, next);
		} catch (err) {
			return next(err);
		}

	},

}
