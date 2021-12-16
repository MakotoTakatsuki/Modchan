'use strict';

const deleteNews = require(__dirname+'/../../models/forms/deletenews.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkednews'],
		objectIdArrays: ['checkednews']
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkednews, 1), expected: false, error: '削除するには、少なくとも1つのニュース投稿を選択する必要があります' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/globalmanage/news.html'
			})
		}

		try {
			await deleteNews(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
