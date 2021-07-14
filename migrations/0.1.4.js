'use strict';

module.exports = async(db, redis) => {
	console.log('adding markdown db entry for fortune example');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'permLevels.markdown.fortune': 0
		}
	});
};
