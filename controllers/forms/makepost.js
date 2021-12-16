'use strict';

const makePost = require(__dirname+'/../../models/forms/makepost.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { func: pruneFiles } = require(__dirname+'/../../schedules/tasks/prune.js')
	, config = require(__dirname+'/../../config.js')
	, { Files } = require(__dirname+'/../../db/')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'name', 'subject', 'email', 'postpassword', 'password'],
		allowedArrays: ['spoiler', 'strip_filename'],
		processMessageLength: true,
		numberFields: ['thread'],
	}),

	controller: async (req, res, next) => {

		const { pruneImmediately, globalLimits, disableAnonymizerFilePosting } = config.get;

		const hasNoMandatoryFile = globalLimits.postFiles.max !== 0 && res.locals.board.settings.maxFiles !== 0 && res.locals.numFiles === 0;
			//maybe add more duplicates here?

		const errors = await checkSchema([
			{ result: (lengthBody(req.body.message, 1) && res.locals.numFiles === 0), expected: false, error: '投稿にはメッセージまたはファイルを含める必要があります' },
			{ result: (res.locals.anonymizer && (disableAnonymizerFilePosting || res.locals.board.settings.disableAnonymizerFilePosting)
				&& res.locals.numFiles > 0), expected: false, error: `アノニマイザーによるファイル投稿は無効になりました ${disableAnonymizerFilePosting ? 'グローバル' : 'この板で'}.` },
			{ result: res.locals.numFiles > res.locals.board.settings.maxFiles, blocking: true, permLevel: 1, expected: true, error: `ファイル数が多すぎる。投稿ごとの最大ファイル数 ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'この掲示板の' : ''}は ${res.locals.board.settings.maxFiles} です。` },
			{ result: (lengthBody(req.body.subject, 1) && (!existsBody(req.body.thread)
				&& res.locals.board.settings.forceThreadSubject)), expected: false, error: 'スレッドには件名が含まれている必要があります' },
			{ result: lengthBody(req.body.message, 1) && (!existsBody(req.body.thread)
				&& res.locals.board.settings.forceThreadMessage), expected: false, error: 'スレッドにはメッセージを含める必要があります' },
			{ result: lengthBody(req.body.message, 1) && (existsBody(req.body.thread)
				&& res.locals.board.settings.forceReplyMessage), expected: false, error: '返信にはメッセージを含める必要があります' },
			{ result: hasNoMandatoryFile && !existsBody(req.body.thread) && res.locals.board.settings.forceThreadFile , expected: false, error: 'スレッドにはファイルが含まれている必要があります' },
			{ result: hasNoMandatoryFile && existsBody(req.body.thread) && res.locals.board.settings.forceReplyFile , expected: false, error: 'Replies must include a file' },
			{ result: lengthBody(req.body.message, 0, globalLimits.fieldLength.message), expected: false, blocking: true, error: `メッセージは${globalLimits.fieldLength.message}文字以下である必要があります。` },
			{ result: existsBody(req.body.message) && existsBody(req.body.thread) && lengthBody(req.body.message, res.locals.board.settings.minReplyMessageLength, res.locals.board.settings.maxReplyMessageLength),
				expected: false, error: `返信メッセージは ${res.locals.board.settings.minReplyMessageLength}-${res.locals.board.settings.maxReplyMessageLength} 文字である必要があります。` },
			{ result: existsBody(req.body.message) && !existsBody(req.body.thread) && lengthBody(req.body.message, res.locals.board.settings.minThreadMessageLength, res.locals.board.settings.maxThreadMessageLength),
				expected: false, error: `スレッドメッセージは ${res.locals.board.settings.minThreadMessageLength}-${res.locals.board.settings.maxThreadMessageLength} 文字でなければなりません。` },
			{ result: lengthBody(req.body.postpassword, 0, globalLimits.fieldLength.postpassword), expected: false, error: `パスワードは ${globalLimits.fieldLength.postpassword} 文字以下でなければなりません。` },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.name), expected: false, error: `名前は${globalLimits.fieldLength.name}文字以下でなければならない。` },
			{ result: lengthBody(req.body.subject, 0, globalLimits.fieldLength.subject), expected: false, error: `件名は${globalLimits.fieldLength.subject}文字以下である必要があります。` },
			{ result: lengthBody(req.body.email, 0, globalLimits.fieldLength.email), expected: false, error: `電子メールは${globalLimits.fieldLength.email}文字以下である必要があります。` },
		]);

		if (errors.length > 0) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
			});
		}

		try {
			await makePost(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(e => console.error);
			if (res.locals.numFiles > 0) {
				const incedFiles = req.files.file.filter(x => x.inced === true && x.filename != null);
				const incedFileNames = incedFiles.map(x => x.filename);
				await Files.decrement(incedFileNames).catch(e => console.error);
				await pruneFiles(incedFileNames);
			}
			return next(err);
		}

	}

}
