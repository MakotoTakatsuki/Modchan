'use strict';

const editNews = require(__dirname+'/../../models/forms/editnews.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title'],
		processMessageLength: true,
		objectIdFields: ['news_id'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.news_id), expected: true, error: 'ニュースIDがありません' },
			{ result: existsBody(req.body.message), expected: true, error: 'メッセージがありません' },
			{ result: numberBody(res.locals.messageLength, 0, 10000), expected: true, error: 'メッセージは10000文字以下である必要があります' },
			{ result: existsBody(req.body.title), expected: true, error: 'タイトルがありません' },
			{ result: lengthBody(req.body.title, 0, 50), expected: false, error: 'タイトルは50文字以下である必要があります' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': req.headers.referer || '/globalmanage/news.html'
			});
		}

		try {
			await editNews(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
