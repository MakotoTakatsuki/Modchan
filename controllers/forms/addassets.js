'use strict';

const addAssets = require(__dirname+'/../../models/forms/addassets.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, config = require(__dirname+'/../../config.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

//almost a copy of banners code, since it can be handled the same. maybe refactor both into 1 with a "type" arg or something
//or allowing 2 types to accommodate flags too where they are named (not the object.keys & .values use in manageassets template)
module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;
		const errors = [];

		if (res.locals.numFiles === 0) {
			errors.push('ファイルを提供する必要があります');
		} else if (res.locals.numFiles > globalLimits.assetFiles.max) {
			errors.push(`1回のリクエストでアップロードできるアセットファイルの最大値が ${globalLimits.assetFiles.max} を超えました。`);
		} else if (res.locals.board.assets.length+res.locals.numFiles > globalLimits.assetFiles.total) {
			errors.push(`アセット数の合計がグローバルリミットの${globalLimits.assetFiles.total}を超える可能性があります。`);
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
			await addAssets(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(e => console.error);
			return next(err);
		}

	}

}
