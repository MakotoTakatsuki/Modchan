'use strict';

const { debugLogs } = require(__dirname+'/../configs/secrets.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, { addCallback } = require(__dirname+'/../redis.js')
	, upload = require('express-fileupload')
	, fileHandlers = {}
	, fileSizeLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 413, 'message', {
			'title': 'Payload Too Large',
			'message': 'Your upload was too large',
			'redirect': req.headers.referer
		});
	}
	, updateHandlers = () => {
		const { globalLimits,  filterFileNames, spaceFileNameReplacement } = require(__dirname+'/../config.js').get;
		['flag', 'banner', 'asset', 'post'].forEach(fileType => {
			const fileSizeLimit = globalLimits[`${fileType}FilesSize`];
			const fileNumLimit = globalLimits[`${fileType}Files`];
			const fileNumLimitFunction = (req, res, next) => {
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Too many files',
					'message': (req.path.endsWith('/post') && res.locals.board) ? `Max files per post ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'on this board ' : ''}is ${res.locals.board.settings.maxFiles}`
						: `Max files per request is ${fileNumLimit.max}`,
					'redirect': req.headers.referer
				});
			};
			fileHandlers[fileType] = upload({
				debug: debugLogs,
				createParentPath: true,
				safeFileNames: filterFileNames,
				spaceFileNameReplacement,
				preserveExtension: 4,
				limits: {
					totalSize: fileSizeLimit.max,
					fileSize: fileSizeLimit.max,
					files: fileNumLimit.max,
				},
				numFilesLimitHandler: fileNumLimitFunction,
				limitHandler: fileSizeLimitFunction,
				useTempFiles: true,
				tempFileDir: __dirname+'/../tmp/'
			});
		});
	};

updateHandlers();
addCallback('config', updateHandlers);

module.exports = {

	asset: (req, res, next) => {
		return fileHandlers.asset(req, res, next);
	},
	banner: (req, res, next) => {
		return fileHandlers.banner(req, res, next);
	},
	flag: (req, res, next) => {
		return fileHandlers.flag(req, res, next);
	},
	posts: (req, res, next) => {
		if (res.locals.anonymizer) {
			return next();
		}
		return fileHandlers.post(req, res, next);
	},
	postsEarly: (req, res, next) => {
		if (res.locals.anonymizer) {
			return fileHandlers.post(req, res, next);
		}
		return next();
	},

};
