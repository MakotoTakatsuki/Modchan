'use strict';

const editPost = require(__dirname+'/../../models/forms/editpost.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, { Ratelimits, Posts, Boards } = require(__dirname+'/../../db/')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['board', 'message', 'name', 'subject', 'email', 'log_message'],
		processMessageLength: true,
		numberFields: ['postId'],
	}),

	controller: async (req, res, next) => {

		const { rateLimitCost, globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.board), expected: true, error: '板がありません' },
			{ result: numberBody(req.body.postId, 1), expected: true, error: '投稿IDがありません' },
			{ result: lengthBody(req.body.message, 0, globalLimits.fieldLength.message), expected: false, error: `メッセージは${globalLimits.fieldLength.message}文字以下である必要があります。` },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.name), expected: false, error: `名前は${globalLimits.fieldLength.name}文字以下でなければならない。` },
			{ result: lengthBody(req.body.subject, 0, globalLimits.fieldLength.subject), expected: false, error: `件名は${globalLimits.fieldLength.subject}文字以下である必要があります。` },
			{ result: lengthBody(req.body.email, 0, globalLimits.fieldLength.email), expected: false, error: `電子メールは${globalLimits.fieldLength.email}文字以下である必要があります。` },
			{ result: lengthBody(req.body.log_message, 0, globalLimits.fieldLength.log_message), expected: false, error: `ログメッセージは ${globalLimits.fieldLength.log_message} 文字以下である必要があります。` },
			{ result: async () => {
				res.locals.post = await Posts.getPost(req.body.board, req.body.postId);
				return res.locals.post != null;
			}, expected: true, error: `投稿は存在しません` }
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
			});
		}

		if (res.locals.permLevel > 1) { //if not global staff or above
			const ratelimitUser = await Ratelimits.incrmentQuota(req.session.user, 'edit', rateLimitCost.editPost);
			const ratelimitIp = res.locals.anonymizer ? 0 : (await Ratelimits.incrmentQuota(res.locals.ip.single, 'edit', rateLimitCost.editPost));
			if (ratelimitUser > 100 || ratelimitIp > 100) {
				return dynamicResponse(req, res, 429, 'message', {
					'title': 'レート制限',
					'error': '投稿の編集が速すぎます。しばらく待ってからもう一度お試しください',
				});
			}
		}

		try {
			await editPost(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
