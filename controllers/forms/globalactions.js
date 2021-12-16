'use strict';

const { Posts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, actionHandler = require(__dirname+'/../../models/forms/actionhandler.js')
	, actionChecker = require(__dirname+'/../../helpers/checks/actionchecker.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['ban_duration'],
		trimFields: ['postpassword', 'report_reason', 'ban_reason', 'log_message'],
		allowedArrays: ['checkedreports', 'globalcheckedposts'],
		numberFields: ['move_to_thread'],
		objectIdArrays: ['globalcheckedposts']
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		res.locals.actions = actionChecker(req);

		const errors = await checkSchema([
			{ result: lengthBody(req.body.globalcheckedposts, 1), expected: false, blocking: true, error: '少なくとも1つの投稿を選択する必要があります' },
			{ result: lengthBody(res.locals.actions.validActions, 1), expected: false, blocking: true, error: 'アクションが選択されていません' },
			{ result: lengthBody(req.body.globalcheckedposts, 1, globalLimits.multiInputs.posts.staff), expected: false, error: `リクエストごとに >${globalLimits.multiInputs.posts.staff} の投稿を選択してはならない。` },
			{ result: (existsBody(req.body.global_report_ban) && !req.body.checkedreports), expected: false, error: 'レポーターを禁止するには、投稿とレポートを選択する必要があります' },
			{ result: (existsBody(req.body.checkedreports) && !req.body.global_report_ban), expected: false, error: 'チェックされたレポートの場合、レポートアクションを選択する必要があります' },
			{ result: (existsBody(req.body.checkedreports) && !req.body.globalcheckedposts), expected: false, error: 'レポートアクションのレポートをチェックする場合は、親の投稿をチェックする必要があります' },
			{ result: (existsBody(req.body.checkedreports) && req.body.globalcheckedposts
				&& lengthBody(req.body.checkedreports, 1, req.body.globalcheckedposts.length*5)), expected: false, error: 'チェックされたレポートの数が無効です' },
			{ result: (res.locals.actions.numGlobal > 0 && res.locals.actions.validActions.length <= res.locals.actions.numGlobal), expected: true, blocking: true, error: '無効なアクションが選択されました' },
			{ result: (res.locals.permLevel > res.locals.actions.authRequired), expected: false, blocking: true, error: '全く許可しません' },
			{ result: (existsBody(req.body.edit) && lengthBody(req.body.globalcheckedposts, 1, 1)), expected: false, error: '編集アクションには投稿を1つだけ選択する必要があります' },
			{ result: lengthBody(req.body.postpassword, 0, globalLimits.fieldLength.postpassword), expected: false, error: `パスワードは ${globalLimits.fieldLength.postpassword} 文字以下でなければなりません。` },
			{ result: lengthBody(req.body.ban_reason, 0, globalLimits.fieldLength.ban_reason), expected: false, error: `禁止理由は ${globalLimits.fieldLength.ban_reason} 文字以下でなければならない。` },
			{ result: lengthBody(req.body.log_message, 0, globalLimits.fieldLength.log_message), expected: false, error: `ログメッセージは ${globalLimits.fieldLength.log_message} 文字以下である必要があります。` },
		], res.locals.permLevel);

		//return the errors
		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/globalmanage/reports.html'
			})
		}

		//get posts with global ids only
		try {
			res.locals.posts = await Posts.globalGetPosts(req.body.globalcheckedposts, true);
		} catch (err) {
			return next(err);
		}
		if (!res.locals.posts || res.locals.posts.length === 0) {
			return dynamicResponse(req, res, 404, 'message', {
				'title': '見つかりません',
				'errors': '選択した投稿が見つかりません',
				'redirect': '/globalmanage/reports.html'
			})
		}

		if (req.body.edit) {
			//edit post, only allowing one
			return res.render('editpost', {
				'post': res.locals.posts[0],
				'csrf': req.csrfToken(),
				'referer': (req.headers.referer || `/${res.locals.posts[0].board}/manage/thread/${res.locals.posts[0].thread || res.locals.posts[0].postId}.html`) + `#${res.locals.posts[0].postId}`,
			});
		}

		try {
			await actionHandler(req, res, next);
		} catch (err) {
			console.error(err);
			return next(err);
		}

	}

}
