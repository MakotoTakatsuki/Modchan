'use strict';

const { Accounts } = require(__dirname+'/../db/')
	, cache = require(__dirname+'/../redis.js');

module.exports = async (req, res, next) => {
	if (!res.locals) {
		res.locals = {};
	}
	if (req.session && req.session.user) {
		res.locals.user = await cache.get(`users:${req.session.user}`);
		if (!res.locals.user) {
			const account = await Accounts.findOne(req.session.user);
			if (!account) {
				req.session.destroy();
			} else {
				await Accounts.updateLastActiveDate(req.session.user);
				res.locals.user = {
					'username': account._id,
					'authLevel': account.authLevel,
					'modBoards': account.modBoards,
					'ownedBoards': account.ownedBoards,
				};
				cache.set(`users:${req.session.user}`, res.locals.user, 3600);
			}
		}
	}
	next();
}
