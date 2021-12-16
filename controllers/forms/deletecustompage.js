'use strict';

const deleteCustomPage = require(__dirname+'/../../models/forms/deletecustompage.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedcustompages'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedcustompages, 1), expected: false, error: '削除するには、少なくとも1つのカスタムページを選択する必要があります' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/custompages.html`
			})
		}

		try {
			await deleteCustomPage(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
