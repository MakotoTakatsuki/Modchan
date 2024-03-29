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
				'title': 'Bad request',
				'message': `Invalid file type for ${req.files.file[i].name}. Mimetype ${req.files.file[i].mimetype} not allowed.`,
				'redirect': redirect
			});
		}
		// check for any mismatching supposed mimetypes from the actual file mimetype
		if (checkRealMimeTypes) {
			if (!(await mimeTypes.realMimeCheck(req.files.file[i]))) {
				deleteTempFiles(req).catch(e => console.error);
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': `Mime type mismatch for file "${req.files.file[i].name}"`,
					'redirect': redirect
				});
			}
		}
	}

	const filenames = [];
	for (let i = 0; i < res.locals.numFiles; i++) {
		const file = req.files.file[i];
		const filename = file.sha256 + path.extname(file.name);
		file.filename = filename;

		//check if already exists
		const exists = await pathExists(`${uploadDirectory}/asset/${req.params.board}/${filename}`);

		if (exists) {
			await remove(file.tempFilePath);
			continue;
		}

		//add to list after checking it doesnt already exist
		filenames.push(filename);

		//then upload it
		await moveUpload(file, filename, `asset/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(e => console.error);

	// no new assets
	if (filenames.length === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': `Asset${res.locals.numFiles > 1 ? 's' : ''} already exist${res.locals.numFiles > 1 ? '' : 's'}`,
			'redirect': redirect
		});
	}

	// add assets to the db
	await Boards.addAssets(req.params.board, filenames);

	// add assets to board in memory
	res.locals.board.assets = res.locals.board.assets.concat(filenames);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Uploaded ${filenames.length} new assets.`,
		'redirect': redirect
	});

}
