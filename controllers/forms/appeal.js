'use strict';

const appealBans = require(__dirname+'/../../models/forms/appeal.js')
	, config = require(__dirname+'/../../config.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { Bans } = require(__dirname+'/../../db')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message'],
		allowedArrays: ['checkedbans'],
		processMessageLength: true,
		objectIdArrays: ['checkedbans']
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.message), expected: true, error: 'アピールにはメッセージを含める必要があります' },
			{ result: existsBody(req.body.checkedbans), expected: true, error: '訴えるには少なくとも1つの禁止を選択する必要があります' },
			{ result: numberBody(res.locals.messageLength, 0, globalLimits.fieldLength.message), expected: true, error: `アピールメッセージは${globalLimits.fieldLength.message}文字以下である必要があります。` },
		]); //should appeals really be based off message field length global limit? minor.

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				'redirect': '/'
			});
		}

		let amount = 0;
		try {
			amount = await appealBans(req, res, next);
		} catch (err) {
			return next(err);
		}

		if (amount === 0) {
			/* this can occur if they selected invalid id, non-ip match, already appealed, or unappealable bans. prevented by databse filter, so we use
				use the updatedCount return value to check if any appeals were made successfully. if not, we end up here. */
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'error': '無効な禁止が選択されました',
				'redirect': '/'
			});
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': '成功',
			'message': `禁止令の申請（${amount}）成功`,
			'redirect': '/'
		});

	}

}
