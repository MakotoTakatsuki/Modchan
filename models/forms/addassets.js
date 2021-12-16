'use strict';

const path = require('path')
	, { remove, pathExists } = require('fs-extra')
	, config = require(__dirname+'/../../config.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, moveUpload = require(__dirname+'/../../helpers/files/moveupload.js')
	, mimeTypes = require(__dirname+'/../../helpers/files/mimetypes.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/imageidentify.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { Boards } = require(__dirname+'/../../db/')
	, buildQueue = require(__dirname+'/../../queue.js');

module.exports = async (req, res, next) => {

	const { globalLimits, checkRealMimeTypes } = config.get;
	const redirect = `/${req.params.board}/manage/assets.html`;

	for (let i = 0; i < res.locals.numFiles; i++) {
		if (!mimeTypes.allowed(req.files.file[i].mimetype, {
				image: true,
				animatedImage: true,
				video: false,
				audio: false,
				other: false
			})) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'message': `${req.files.file[i].name} のファイル形式が無効です。Mimetype ${req.files.file[i].mimetype} は許可されません。`,
				'redirect': redirect
			});
		}
		// check for any mismatching supposed mimetypes from the actual file mimetype
		if (checkRealMimeTypes) {
			if (!(await mimeTypes.realMimeCheck(req.files.file[i]))) {
				deleteTempFiles(req).catch(e => console.error);
				return dynamicResponse(req, res, 400, 'message', {
					'title': '要求の形式が正しくありません',
					'message': `ファイル "${req.files.file[i].name}" の MIME タイプが不一致です。"`,
					'redirect': redirect
				});
			}
		}
	}

	const filenames = [];
	for (let i = 0; i < res.locals.numFiles; i++) {
		const file = req.files.file[i];
		file.filename = file.sha256 + file.extension;

		//check if already exists
		const exists = await pathExists(`${uploadDirectory}/asset/${req.params.board}/${file.filename}`);

		if (exists) {
			await remove(file.tempFilePath);
			continue;
		}

		//add to list after checking it doesnt already exist
		filenames.push(file.filename);

		//then upload it
		await moveUpload(file, file.filename, `asset/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(e => console.error);

	// no new assets
	if (filenames.length === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': '要求の形式が正しくありません',
			'message': `資産${res.locals.numFiles > 1 ? 's' : ''} は既に存在する${res.locals.numFiles > 1 ? '' : 's'}`,
			'redirect': redirect
		});
	}

	// add assets to the db
	await Boards.addAssets(req.params.board, filenames);

	// add assets to board in memory
	res.locals.board.assets = res.locals.board.assets.concat(filenames);

	return dynamicResponse(req, res, 200, 'message', {
		'title': '成功',
		'message': `新しいアセットを${filenames.length}アップロードしました。`,
		'redirect': redirect
	});

}
