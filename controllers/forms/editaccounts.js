'use strict';

const editAccounts = require(__dirname+'/../../models/forms/editaccounts.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedaccounts'],
		numberFields: ['auth_level'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedaccounts, 1), expected: false, error: '少なくとも1つのアカウントを選択する必要があります' },
			{ result: !existsBody(req.body.auth_level) || numberBody(req.body.auth_level, 0, 4), expected: true, error: '無効なアカウントタイプ' },
			{ result: existsBody(req.body.auth_level) || existsBody(req.body.delete_account), expected: true, error: 'アカウントの種類がないか、アクションを削除してください' }
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/globalmanage/accounts.html'
			})
		}

		try {
			await editAccounts(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
