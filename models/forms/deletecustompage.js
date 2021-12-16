'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const deletedCount = await CustomPages.deleteMany(req.body.checkedcustompages, req.params.board).then(res => res.deletedCount);

	if (deletedCount === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': '要求の形式が正しくありません',
			'message': '無効なカスタムページが選択されました',
			'redirect': `/${req.params.board}/manage/custompages.html`
		});
	}

	await Promise.all(req.body.checkedcustompages.map(page => {
		remove(`${uploadDirectory}/html/${req.params.board}/custompage/${page}.html`)
	}));

	return dynamicResponse(req, res, 200, 'message', {
		'title': '成功',
		'message': 'カスタムページを削除',
		'redirect': `/${req.params.board}/manage/custompages.html`
	});

}
