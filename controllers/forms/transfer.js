'use strict';

const transferBoard = require(__dirname+'/../../models/forms/transferboard.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: '新しい所有者のユーザー名がありません' },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: '新しいオーナー ユーザー名は50文字以下でなければなりません。' },
			{ result: (req.body.username === res.locals.board.owner), expected: false, error: '新しい所有者は現在の所有者とは異なる必要があります' },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: '新しい所有者のユーザー名には、a-z 0〜9のみを含める必要があります' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/settings.html`
			});
		}

		try {
			await transferBoard(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
