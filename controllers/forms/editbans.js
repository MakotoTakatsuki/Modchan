'use strict';

const removeBans = require(__dirname+'/../../models/forms/removebans.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, denyAppeals = require(__dirname+'/../../models/forms/denybanappeals.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['option'],
		allowedArrays: ['checkedbans'],
		objectIdArrays: ['checkedbans']
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedbans, 1), expected: false, error: '少なくとも1つの禁止を選択する必要があります' },
			{ result: inArrayBody(req.body.option, ['unban', 'deny_appeal']), expected: true, error: '無効な禁止措置' },
		]);

		const redirect = req.params.board ? `/${req.params.board}/manage/bans.html` : '/globalmanage/bans.html';

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': '要求の形式が正しくありません',
				'errors': errors,
				redirect
			});
		}

		let amount = 0;
		let message;
		try {
			if (req.body.option === 'unban') {
				amount = await removeBans(req, res, next);
				message = `${amount}の禁止事項を削除`;
			} else {
				amount = await denyAppeals(req, res, next);
				message = `訴えの却下${amount}`;
			}
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': '成功',
			message,
			redirect
		});

	}

}
