'use strict';

const { Modlogs } = require(__dirname+'/../../db/')
	, { buildModLog } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	if (!res.locals.date) {
		return next();
	}

	const startDate = res.locals.date.date;
	const { year, month, day } = res.locals.date;
	const endDate = new Date(Date.JST(year, month, day, 23, 59, 59, 999));

	let html;
	try {
		const logs = await Modlogs.findBetweenDate(res.locals.board, startDate, endDate);
		if (!logs || logs.length === 0) {
			return next();
		}
		html = await buildModLog({
			board: res.locals.board,
			startDate,
			endDate,
			logs
		});
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
