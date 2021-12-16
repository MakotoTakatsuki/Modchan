'use strict';

const uploadBanners = require(__dirname+'/../../models/forms/uploadbanners.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, config = require(__dirname+'/../../config.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;
		const errors = [];

		if (res.locals.numFiles === 0) {
			errors.push('ファイルを提供する必要があります');
		} else if (res.locals.numFiles > globalLimits.bannerFiles.max) {
			errors.push(`1回のリクエストでアップロードできるバナーの最大値が${globalLimits.bannerFiles.max}を超えました。`);
		} else if (res.locals.board.banners.length+res.locals.numFiles > globalLimits.bannerFiles.total) {
			errors.push(`バナーの合計数がグローバルリミットの${globalLimits.bannerFiles.total}を超えてしまう。`);
		}

		if (errors.length > 0) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', { 
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			})
		}

		try {
			await uploadBanners(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(e => console.error);
			return next(err);
		}

	}

}
