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
				//banners can be static image or animated (gif, apng, etc)
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
					'message': `Mime type mismatch for file "${req.files.file[i].name}"`,
					'redirect': redirect
				});
			}
		}

		//300x100 check
		const imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
		let geometry = imageData.size;
		if (Array.isArray(geometry)) {
			geometry = geometry[0];
		}
		if (geometry.width > globalLimits.bannerFiles.width
			|| geometry.height > globalLimits.bannerFiles.height
			|| (globalLimits.bannerFiles.forceAspectRatio === true
				&& (geometry.width/geometry.height !== 3))) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'message': `ファイル ${req.files.file[i].name} が無効です。バナーの最大寸法は${globalLimits.bannerFiles.width}x${globalLimits.bannerFiles.height}${globalLimits.bannerFiles.forceAspectRatio ===true?' で、アスペクト比は3:1でなければなりません' : ''}.`,
				'redirect': redirect
			});
		}
	}

	const filenames = [];
	for (let i = 0; i < res.locals.numFiles; i++) {
		const file = req.files.file[i];
		file.filename = file.sha256 + file.extension;

		//check if already exists
		const exists = await pathExists(`${uploadDirectory}/banner/${req.params.board}/${file.filename}`);

		if (exists) {
			await remove(file.tempFilePath);
			continue;
		}

		//add to list after checking it doesnt already exist
		filenames.push(file.filename);

		//then upload it
		await moveUpload(file, file.filename, `banner/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(e => console.error);

	// no new banners
	if (filenames.length === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': '要求の形式が正しくありません',
			'message': `Banner${res.locals.numFiles > 1 ? 's' : ''} は既に存在する${res.locals.numFiles > 1 ? '' : 's'}`,
			'redirect': redirect
		});
	}

	// add banners to the db
	await Boards.addBanners(req.params.board, filenames);

	// add banners to board in memory
	res.locals.board.banners = res.locals.board.banners.concat(filenames);

	if (filenames.length > 0) {
		//add public banners page to build queue
		buildQueue.push({
	        'task': 'buildBanners',
			'options': {
				'board': res.locals.board,
			}
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': '成功',
		'message': `新しいバナー${filenames.length}をアップロードしました。`,
		'redirect': redirect
	});

}
