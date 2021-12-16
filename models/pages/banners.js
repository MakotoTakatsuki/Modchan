'use strict';

const { buildBanners } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildBanners({ board: res.locals.board });
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
