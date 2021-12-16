'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, deleteBoard = require(__dirname+'/../../models/forms/deleteboard.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['uri'],
	}),

	controller: async (req, res, next) => {

		let board = null;
		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: '確認がありません' },
			{ result: existsBody(req.body.uri), expected: true, error: 'URIがありません' },
			{ result: alphaNumericRegex.test(req.body.uri), blocking: true, expected: true, error: 'URIにはa-z0〜9のみを含める必要があります'},
			{ result: (req.params.board === req.body.uri), expected: true, error: 'URIが現在の板と一致しません' },
			{ result: async () => {
				board = await Boards.findOne(req.body.uri);
				return board != null;
			}, expected: true, error: `板 /${req.body.uri}/ が存在しない。` }
		], res.locals.permLevel);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': req.params.board ? `/${req.params.board}/manage/settings.html` : '/globalmanage/settings.html'
			});
		}

		try {
			await deleteBoard(board._id, board);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': '成功',
			'message': '板が削除されました',
			'redirect': req.params.board ? '/' : '/globalmanage/settings.html'
		});

	}

}
