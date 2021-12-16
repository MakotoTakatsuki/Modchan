'use strict';

const { Posts } = require(__dirname+'/../../db/')
	, config = require(__dirname+'/../../config.js')
	, actionHandler = require(__dirname+'/../../models/forms/actionhandler.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, actionChecker = require(__dirname+'/../../helpers/checks/actionchecker.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['ban_duration'],
		trimFields: ['postpassword', 'report_reason', 'ban_reason', 'log_message'],
		allowedArrays: ['checkedreports', 'checkedposts'],
		numberFields: ['move_to_thread', 'sticky'],
		numberArrays: ['checkedposts'],
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		res.locals.actions = actionChecker(req);

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedposts, 1), expected: false, blocking: true, error: '少なくとも1つの投稿を選択する必要があります' },
			{ result: lengthBody(res.locals.actions.validActions, 1), expected: false, blocking: true, error: 'アクションが選択されていません' },
			{ result: lengthBody(req.body.checkedposts, 1, globalLimits.multiInputs.posts.anon), permLevel: 3, expected: false, error: `1回のリクエストで >${globalLimits.multiInputs.posts.anon} の投稿を選択してはならない。` },
			{ result: lengthBody(req.body.checkedposts, 1, globalLimits.multiInputs.posts.staff), expected: false, error: `リクエストごとに >${globalLimits.multiInputs.posts.staff} の投稿を選択してはならない。` },
			{ result: (existsBody(req.body.report_ban) && !req.body.checkedreports), expected: false, error: 'レポーターを禁止するには、投稿とレポートを選択する必要があります' },
			{ result: (existsBody(req.body.checkedreports) && !req.body.report_ban), expected: false, error: 'チェックされたレポートの場合、レポートアクションを選択する必要があります' },
			{ result: (existsBody(req.body.checkedreports) && !req.body.checkedposts), expected: false, error: 'レポートアクションのレポートをチェックする場合は、親の投稿をチェックする必要があります' },
			{ result: (existsBody(req.body.checkedreports) && existsBody(req.body.checkedposts) && lengthBody(req.body.checkedreports, 1, req.body.checkedposts.length*5)), expected: false, error: 'チェックされたレポートの数が無効です' },
			{ result: (res.locals.permLevel > res.locals.actions.authRequired), expected: false, blocking: true, error: '全く許可しません' },
			{ result: (existsBody(req.body.delete) && !res.locals.board.settings.userPostDelete), permLevel: 3, expected: false, error: 'この板ではユーザー投稿の削除が無効になっています' },
			{ result: (existsBody(req.body.spoiler) && !res.locals.board.settings.userPostSpoiler), permLevel: 3, expected: false, error: 'この板ではユーザーファイルのスポイリングが無効になっています' },
			{ result: (existsBody(req.body.unlink_file) && !res.locals.board.settings.userPostUnlink), permLevel: 3, expected: false, error: 'この板ではユーザーファイルのリンク解除が無効になっています' },
			{ result: (existsBody(req.body.edit) && lengthBody(req.body.checkedposts, 1, 1)), expected: false, error: '編集アクションには投稿を1つだけ選択する必要があります' },
			{ result: lengthBody(req.body.postpassword, 0, globalLimits.fieldLength.postpassword), expected: false, error: `パスワードは ${globalLimits.fieldLength.postpassword} 文字以下でなければなりません。` },
			{ result: lengthBody(req.body.report_reason, 0, globalLimits.fieldLength.report_reason), expected: false, error: `レポートは${globalLimits.fieldLength.report_reason}文字以下である必要があります。` },
			{ result: lengthBody(req.body.ban_reason, 0, globalLimits.fieldLength.ban_reason), expected: false, error: `禁止理由は ${globalLimits.fieldLength.ban_reason} 文字以下でなければならない。` },
			{ result: lengthBody(req.body.log_message, 0, globalLimits.fieldLength.log_message), expected: false, error: `ログメッセージは ${globalLimits.fieldLength.log_message} 文字以下である必要があります。` },
			{ result: (existsBody(req.body.report || req.body.global_report) && lengthBody(req.body.report_reason, 1)), expected: false, blocking: true, error: 'レポートには理由が必要です' },
			{ result: (existsBody(req.body.move) && !req.body.move_to_thread), expected: false, error: '投稿を移動するには、宛先スレッド番号を入力する必要があります' },
			{ result: async () => {
				if (req.body.move && req.body.move_to_thread) {
					res.locals.destinationThread = await Posts.threadExists(req.params.board, req.body.move_to_thread);
					return res.locals.destinationThread != null;
				}
				return true;
			}, expected: true, error: '移動先のスレッドが存在しません' },
		], res.locals.permLevel);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': `/${req.params.board}/`
			})
		}

		try {
			res.locals.posts = await Posts.getPosts(req.params.board, req.body.checkedposts, true);
		} catch (err) {
			return next(err);
		}

		if (!res.locals.posts || res.locals.posts.length === 0) {
			return dynamicResponse(req, res, 404, 'message', {  
				'title': '見つかりません',
				'error': '選択した投稿が見つかりません',
				'redirect': `/${req.params.board}/`
			})
		}

		if (req.body.edit) {
			//edit post, only allowing one
			return res.render('editpost', {
				'post': res.locals.posts[0],
				'csrf': req.csrfToken(),
				'referer': (req.headers.referer || `/${res.locals.posts[0].board}/manage/thread/${res.locals.posts[0].thread || res.locals.posts[0].postId}.html`) + `#${res.locals.posts[0].postId}`,
			});
		} else if (req.body.move) {
			res.locals.posts = res.locals.posts.filter(p => {
				//filter to remove any posts already in the thread (or the OP) of move destination
				return p.postId !== req.body.move_to_thread && p.thread !== req.body.move_to_thread;
			});
			if (res.locals.posts.length === 0) {
				return dynamicResponse(req, res, 409, 'message', {
					'title': '対立',
					'error': '移動アクションの宛先スレッドがソーススレッドと一致することはできません',
					'redirect': `/${req.params.board}/`
				});
			}
		}

		try {
			await actionHandler(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
