'use strict';

const deleteAccount = require(__dirname+'/../../models/forms/deleteaccount.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { modBoards, ownedBoards } = res.locals.user;

		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: '確認がありません' },
			{ result: (numberBody(ownedBoards.length, 0, 0) && numberBody(modBoards.length, 0, 0)), expected: true, error: 'どの板でもスタッフのポジションを保持している間は、アカウントを削除することはできません' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/account.html',
			});
		}

		try {
			await deleteAccount(res.locals.user.username);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': '成功',
			'message': 'アカウントが削除されました',
			'redirect': '/',
		});

	}

}
