'use strict';

const editCustomPage = require(__dirname+'/../../models/forms/editcustompage.js')
	, { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js')
	, config = require(__dirname+'/../../config.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title', 'page'],
		processMessageLength: true,
		objectIdFields: ['page_id'],
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.page_id), expected: true, error: 'ページIDがありません' },
			{ result: existsBody(req.body.message), expected: true, error: 'メッセージがありません' },
			{ result: existsBody(req.body.title), expected: true, error: 'タイトルがありません' },
			{ result: existsBody(req.body.page), expected: true, error: '.html名がありません' },
			{ result: () => {
				if (req.body.page) {
					return /^[a-z0-9_-]+$/i.test(req.body.page);
				}
				return false;
			} , expected: true, error: '.html名にはa-z0-9_-のみが含まれている必要があります' },
			{ result: numberBody(res.locals.messageLength, 0, globalLimits.customPages.maxLength), expected: true, error: `メッセージは ${globalLimits.customPages.maxLength} 文字以下でなければなりません。` },
			{ result: lengthBody(req.body.title, 0, 50), expected: false, error: 'タイトルは50文字以下である必要があります' },
			{ result: lengthBody(req.body.page, 0, 50), expected: false, error: '.html名は50文字以下である必要があります' },
			{ result: async () => {
				const existingPage = await CustomPages.findOne(req.params.board, req.body.page);
				if (existingPage && existingPage.page === req.body.page) {
					return existingPage._id.equals(req.body.page_id);
				}
				return true;
			}, expected: true, error: '.html名は一意である必要があります'},
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': req.headers.referer || '/${req.params.board}/manage/custompages.html'
			});
		}

		try {
			await editCustomPage(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
