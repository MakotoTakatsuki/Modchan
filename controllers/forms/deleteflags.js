'use strict';

const deleteFlags = require(__dirname+'/../../models/forms/deleteflags.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedflags'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedflags, 1), expected: false, error: '削除するには、少なくとも1つのフラグを選択する必要があります' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			})
		}

		for (let i = 0; i < req.body.checkedflags.length; i++) {
			if (!res.locals.board.flags[req.body.checkedflags[i]]) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': '要求の形式が正しくありません',
					'message': '無効なフラグが選択されました',
					'redirect': `/${req.params.board}/manage/assets.html`
				})
			}
		}

		try {
			await deleteFlags(req, res, next);
		} catch (err) {
			console.error(err);
			return next(err);
		}

	}

}
