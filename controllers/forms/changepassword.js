'use strict';

const changePassword = require(__dirname+'/../../models/forms/changepassword.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username', 'password', 'newpassword', 'newpasswordconfirm'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: 'ユーザー名がありません' },
			{ result: lengthBody(req.body.username, 0, 50), expected: false, error: 'ユーザー名は50文字以下である必要があります' },
			{ result: existsBody(req.body.password), expected: true, error: 'パスワードがありません' },
			{ result: lengthBody(req.body.password, 0, 50), expected: false, error: 'パスワードは50文字以下である必要があります' },
			{ result: existsBody(req.body.newpassword), expected: true, error: '新しいパスワードがありません' },
			{ result: lengthBody(req.body.newpassword, 0, 100), expected: false, error: '新しいパスワードは100文字以下である必要があります' },
			{ result: existsBody(req.body.newpasswordconfirm), expected: true, error: '新しいパスワードの確認がありません' },
			{ result: lengthBody(req.body.newpasswordconfirm, 0, 100), expected: false, error: '新しいパスワードの確認は100文字以下である必要があります' },
			{ result: (req.body.newpassword === req.body.newpasswordconfirm), expected: true, error: '新しいパスワードとパスワードの確認は一致する必要があります' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/changepassword.html'
			})
		}

		try {
			await changePassword(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
