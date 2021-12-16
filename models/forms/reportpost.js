'use strict';

const { ObjectId } = require(__dirname+'/../../db/db.js');

module.exports = (req, res) => {

	const report = {
		'id': ObjectId(),
		'reason': req.body.report_reason,
		'date': new Date(),
		'ip': {
			'single': res.locals.ip.single,
			'raw': res.locals.ip.raw
		}
	}

	const ret = {
		message: `Reported ${res.locals.posts.length} post${res.locals.posts.length > 1 ? 's' : ''}`,
		action: '$push',
		query: {}
	};
	const query = {
		'$each': [report],
		'$slice': -5 //limit number of  reports
	}
	if (req.body.global_report) {
		ret.query['globalreports'] = query;
	}
	if (req.body.report) {
		ret.query['reports'] = query;
	}

	return ret;

}
