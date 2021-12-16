'use strict';

const createBoard = require(__dirname+'/../../models/forms/create.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['name', 'uri', 'description'],
	}),

	controller: async (req, res, next) => {

		const { enableUserBoardCreation, globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: (enableUserBoardCreation === true), blocking: true, permLevel: 1, expected: true, error: 'ユーザー板の作成は現在無効になっています' },
			{ result: existsBody(req.body.uri), expected: true, error: 'URIがありません' },
			{ result: lengthBody(req.body.uri, 0, globalLimits.fieldLength.uri), expected: false, error: `URIは${globalLimits.fieldLength.uri}文字以下である必要があります。` },
			{ result: existsBody(req.body.name), expected: true, error: '名前がありません' },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.boardname), expected: false, error: `名前は${globalLimits.fieldLength.boardname}文字以下でなければならない。` },
			{ result: alphaNumericRegex.test(req.body.uri), expected: true, error: 'URIにはa-z0〜9のみを含める必要があります' },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.description), expected: false, error: `説明文は${globalLimits.fieldLength.description}文字以下でなければなりません。` },
		], res.locals.permLevel);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/create.html'
			});
		}

		try {
			await createBoard(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
