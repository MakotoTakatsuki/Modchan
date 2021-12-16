
'use strict';

const changeBoardSettings = require(__dirname+'/../../models/forms/changeboardsettings.js')
	, { themes, codeThemes } = require(__dirname+'/../../helpers/themes.js')
	, { Ratelimits } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['ban_duration', 'delete_protection_age'],
		trimFields: ['filters', 'moderators', 'tags', 'announcement', 'description', 'name', 'custom_css'],
		allowedArrays: ['countries'],
		numberFields: ['lock_reset', 'captcha_reset', 'filter_mode', 'lock_mode', 'message_r9k_mode', 'file_r9k_mode', 'captcha_mode', 'tph_trigger', 'pph_trigger', 'pph_trigger_action',
			'tph_trigger_action', 'bump_limit', 'reply_limit', 'max_files', 'thread_limit', 'max_thread_message_length', 'max_reply_message_length', 'min_thread_message_length',
			'min_reply_message_length', 'delete_protection_count'],
	}),

	controller: async (req, res, next) => {

		const { globalLimits, rateLimitCost } = config.get
			, maxThread = (Math.min(globalLimits.fieldLength.message, res.locals.board.settings.maxThreadMessageLength) || globalLimits.fieldLength.message)
			, maxReply = (Math.min(globalLimits.fieldLength.message, res.locals.board.settings.maxReplyMessageLength) || globalLimits.fieldLength.message);

		const errors = await checkSchema([
			{ result: lengthBody(req.body.description, 0, globalLimits.fieldLength.description), expected: false, error: `板の説明は${globalLimits.fieldLength.description}文字以下である必要があります。` },
			{ result: lengthBody(req.body.announcements, 0, 5000), expected: false, error: '板アナウンスは5000文字以下である必要があります' },
			{ result: lengthBody(req.body.tags, 0, 2000), expected: false, error: 'タグの長さは2000文字以下である必要があります' },
			{ result: lengthBody(req.body.filters, 0, 20000), expected: false, error: 'フィルタの長さは20000文字以下である必要があります' },
			{ result: lengthBody(req.body.custom_css, 0, globalLimits.customCss.max), expected: false, error: `カスタムCSSは${globalLimits.customCss.max}文字以下である必要があります。` },
			{ result: arrayInBody(globalLimits.customCss.filters, req.body.custom_css), permLevel: 1, expected: false, error: `カスタムCSSのストリクトモードが有効で、以下を許可しない。"${globalLimits.customCss.filters.join('", "')}" となります。` },
			{ result: lengthBody(req.body.moderators, 0, 500), expected: false, error: 'モデレーターの長さは500文字以下である必要があります' },
			{ result: lengthBody(req.body.name, 1, globalLimits.fieldLength.boardname), expected: false, error: `板名は1-${globalLimits.fieldLength.boardname}文字である必要があります。` },
			{ result: lengthBody(req.body.default_name, 0, 50), expected: false, error: '匿名名は50文字以下である必要があります' },
			{ result: numberBody(req.body.reply_limit, globalLimits.replyLimit.min, globalLimits.replyLimit.max), expected: true, error: `返信の上限は ${globalLimits.replyLimit.min}-${globalLimits.replyLimit.max} でなければならない。` },
			{ result: numberBody(req.body.bump_limit, globalLimits.bumpLimit.min, globalLimits.bumpLimit.max), expected: true, error: `引き上げの上限は、${globalLimits.bumpLimit.min}-${globalLimits.bumpLimit.max}とする必要があります。` },
			{ result: numberBody(req.body.thread_limit, globalLimits.threadLimit.min, globalLimits.threadLimit.max), expected: true, error: `スレッド数の上限は ${globalLimits.threadLimit.min}-${globalLimits.threadLimit.max} でなければならない。` },
			{ result: numberBody(req.body.max_files, 0, globalLimits.postFiles.max), expected: true, error: `最大ファイル数は0-${globalLimits.postFiles.max}でなければならない。` },
			{ result: numberBody(req.body.min_thread_message_length, 0, globalLimits.fieldLength.message), expected: true, error: `最小スレッドメッセージ長は0-${globalLimits.fieldLength.message}である必要があります。` },
			{ result: numberBody(req.body.min_reply_message_length, 0, globalLimits.fieldLength.message), expected: true, error: `返信メッセージの最小長は0-${globalLimits.fieldLength.message}でなければならない。` },
			{ result: numberBody(req.body.max_thread_message_length, 0, globalLimits.fieldLength.message), expected: true, error: `スレッドメッセージの最大長は0-${globalLimits.fieldLength.message}でなければならない。` },
			{ result: numberBody(req.body.max_reply_message_length, 0, globalLimits.fieldLength.message), expected: true, error: `返信メッセージの最大長は0-${globalLimits.fieldLength.message}でなければならない。` },
			{ result: minmaxBody(req.body.min_thread_message_length, req.body.max_thread_message_length), expected: true, error: 'スレッドメッセージの長さの最小値と最大値は互いに違反してはならない' },
			{ result: minmaxBody(req.body.min_reply_message_length, req.body.max_reply_message_length), expected: true, error: '返信メッセージの長さの最小値と最大値は互いに違反してはならない。' },
			{ result: numberBodyVariable(req.body.min_thread_message_length, res.locals.board.settings.minThreadMessageLength,
				req.body.min_thread_message_length, maxThread, req.body.max_thread_message_length), expected: true,
				error: `スレッドメッセージの最小長は0-${globalLimits.fieldLength.message}で、かつ「最大スレッドメッセージ長」（現在 ${res.locals.board.settings.maxThreadMessageLength} ）以下でなければなりません。` },
			{ result: numberBodyVariable(req.body.min_reply_message_length, res.locals.board.settings.minReplyMessageLength,
				req.body.min_reply_message_length, maxReply, req.body.max_reply_message_length), expected: true,
				error: `返信メッセージの最小長は0-${globalLimits.fieldLength.message}で、かつ「返信メッセージの最大長」（現在は${res.locals.board.settings.maxReplyMessageLength}）以下でなければなりません。` },
			{ result: numberBodyVariable(req.body.max_thread_message_length, res.locals.board.settings.minThreadMessageLength,
				req.body.min_thread_message_length, globalLimits.fieldLength.message, globalLimits.fieldLength.message), expected: true,
				error: `スレッドメッセージの最大長は 0-${globalLimits.fieldLength.message} で、かつ "最小スレッドメッセージ長" (現在は ${res.locals.board.settings.minThreadMessageLength}) 以上でなければなりません。` },
			{ result: numberBodyVariable(req.body.max_reply_message_length, res.locals.board.settings.minReplyMessageLength,
				req.body.min_reply_message_length, globalLimits.fieldLength.message, globalLimits.fieldLength.message), expected: true,
				error: `返信メッセージの最大長は 0-${globalLimits.fieldLength.message} で、かつ "最小返信メッセージの長さ" (現在は ${res.locals.board.settings.minReplyMessageLength}) 以上でなければなりません。` },
			{ result: numberBody(req.body.lock_mode, 0, 2), expected: true, error: '無効なロックモード' },
			{ result: numberBody(req.body.captcha_mode, 0, 2), expected: true, error: 'CAPTCHAモードが無効です' },
			{ result: numberBody(req.body.filter_mode, 0, 2), expected: true, error: '無効なフィルターモード' },
			{ result: numberBody(req.body.tph_trigger, 0, 10000), expected: true, error: '無効なtphトリガーしきい値' },
			{ result: numberBody(req.body.tph_trigger_action, 0, 4), expected: true, error: '無効なtphトリガーアクション' },
			{ result: numberBody(req.body.pph_trigger, 0, 10000), expected: true, error: '無効なpphトリガーしきい値' },
			{ result: numberBody(req.body.pph_trigger_action, 0, 4), expected: true, error: '無効なpphトリガーアクション' },
			{ result: numberBody(req.body.lock_reset, 0, 2), expected: true, error: '無効なトリガーリセットロック' },
			{ result: numberBody(req.body.captcha_reset, 0, 2), expected: true, error: '無効なトリガーリセットCAPTCHA' },
			{ result: numberBody(req.body.ban_duration, 0), expected: true, error: 'フィルタの自動禁止期間が無効です' },
			{ result: numberBody(req.body.delete_protection_age, 0), expected: true, error: '無効なポスタースレッドの年齢削除保護' },
			{ result: numberBody(req.body.delete_protection_count, 0), expected: true, error: '無効な投稿者スレッドの返信数削除保護' },
			{ result: inArrayBody(req.body.theme, themes), expected: true, error: '無効なテーマ' },
			{ result: inArrayBody(req.body.code_theme, codeThemes), expected: true, error: '無効なコードテーマ' },
		], res.locals.permLevel);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/settings.html`
			});
		}

		if (res.locals.permLevel > 1) { //if not global staff or above
			const ratelimitBoard = await Ratelimits.incrmentQuota(req.params.board, 'settings', rateLimitCost.boardSettings); //2 changes a minute
			const ratelimitIp = res.locals.anonymizer ? 0 : (await Ratelimits.incrmentQuota(res.locals.ip.single, 'settings', rateLimitCost.boardSettings));
			if (ratelimitBoard > 100 || ratelimitIp > 100) {
				return dynamicResponse(req, res, 429, 'message', {
					'title': 'レート制限',
					'error': '設定の変更が速すぎます。しばらく待ってからもう一度お試しください',
					'redirect': `/${req.params.board}/manage/settings.html`
				});
			}
		}

		try {
			await changeBoardSettings(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
