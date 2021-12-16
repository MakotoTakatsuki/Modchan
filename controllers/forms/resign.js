'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, resignFromBoard = require(__dirname+'/../../models/forms/resign.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['board'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: '確認がありません' },
			{ result: existsBody(req.body.board), expected: true, error: '板を選択しませんでした' },
			{ result: alphaNumericRegex.test(req.body.board), expected: true, error: 'URIにはa-z0〜9のみを含める必要があります' },
			{ result: async () => {
				res.locals.board = await Boards.findOne(req.body.board);
				return res.locals.board != null;
			}, expected: true, error: `板 /${req.body.board}/ が存在しない。` },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/account.html`
			})
		}

		try {
			await resignFromBoard(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
