'use strict';

const deleteBanners = require(__dirname+'/../../models/forms/deletebanners.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedbanners']
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedbanners, 1), expected: false, error: '削除するバナーを少なくとも1つ選択する必要があります' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			})
		}

		for (let i = 0; i < req.body.checkedbanners.length; i++) {
			if (!res.locals.board.banners.includes(req.body.checkedbanners[i])) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': '要求の形式が正しくありません',
					'message': '無効なバナーが選択されました',
					'redirect': `/${req.params.board}/manage/assets.html`
				})
			}
		}

		try {
			await deleteBanners(req, res, next);
		} catch (err) {
			console.error(err);
			return next(err);
		}

	}

}
