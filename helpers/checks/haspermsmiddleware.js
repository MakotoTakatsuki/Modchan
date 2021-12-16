'use strict';

const cache = {};

module.exports = (requiredLevel) => {

	return cache[requiredLevel] || (cache[requiredLevel] = function(req, res, next) {
		if (res.locals.permLevel > requiredLevel) {
			return res.status(403).render('message', {
				'title': '禁断',
				'message': '全く許可しません',
				'redirect': req.headers.referer || '/'
			});
		}
		next();
	});

}
