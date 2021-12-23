'use strict';

const deleteAccount = require(__dirname+'/../../models/forms/deleteaccount.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { modBoards, ownedBoards } = res.locals.user;

		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: 'Missing confirmation' },
			{ result: (numberBody(ownedBoards.length, 0, 0) && numberBody(modBoards.length, 0, 0)), expected: true, error: 'You cannot delete your account while you hold staff position on any board' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': '/account.html',
			});
		}

		try {
			await deleteAccount(res.locals.user.username);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': 'Success',
			'message': 'Account deleted',
			'redirect': '/',
		});

	}

}
