'use strict';

const { debugLogs } = require(__dirname+'/../configs/secrets.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, { addCallback } = require(__dirname+'/../redis.js')
	, upload = require('express-fileupload')
	, fileHandlers = {}
	, fileSizeLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 413, 'message', {
			'title': 'ペイロードが大きすぎます',
			'message': 'アップロードが大きすぎました',
			'redirect': req.headers.referer
		});
	}
	, missingExtensionLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 400, 'message', {
			'title': '要求の形式が正しくありません',
			'message': 'ファイル拡張子がありません',
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
					'title': 'ファイルが多すぎます',
					'message': (req.path.endsWith('/post') && res.locals.board) ? `投稿ごとの最大ファイル数 ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'この板で' : ''}は ${res.locals.board.settings.maxFiles} です。`
						: `1リクエストあたりの最大ファイル数は${fileNumLimit.max}です。`,
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
				limitHandler: fileSizeLimitFunction,
				numFilesLimitHandler: fileNumLimitFunction,
				extensionLimitHandler: missingExtensionLimitFunction,
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
