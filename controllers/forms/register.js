'use strict';

const alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, registerAccount = require(__dirname+'/../../models/forms/register.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username', 'password', 'passwordconfirm'],
	}),

	controller: async (req, res, next) => {

		const { enableUserAccountCreation } = config.get;

		const errors = await checkSchema([
			{ result: (enableUserAccountCreation === true), blocking: true, permLevel: 1, expected: true, error: 'Account creation is currently disabled' },
			{ result: existsBody(req.body.username), expected: true, error: 'ユーザー名がありません' },
			{ result: lengthBody(req.body.username, 0, 50), expected: false, error: 'ユーザー名は50文字以下である必要があります' },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: 'ユーザー名にはa-z0-9のみを含める必要があります'},
			{ result: existsBody(req.body.password), expected: true, error: 'パスワードがありません' },
			{ result: lengthBody(req.body.password, 0, 50), expected: false, error: 'パスワードは50文字以下である必要があります' },
			{ result: existsBody(req.body.passwordconfirm), expected: true, error: 'パスワードがありません confirmation' },
			{ result: lengthBody(req.body.passwordconfirm, 0, 100), expected: false, error: 'パスワードの確認は100文字以下である必要があります' },
			{ result: (req.body.password === req.body.passwordconfirm), expected: true, error: 'パスワードとパスワードの確認は一致する必要があります' },
		], res.locals.permLevel);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/register.html'
			})
		}

		try {
			await registerAccount(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
