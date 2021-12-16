'use strict';

const { NumberInt } = require(__dirname+'/../../db/db.js')

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.thread
	})

	if (filteredposts.length === 0) {
		return {
			message: 'ロックするスレッドがありません',
		};
	}

	return {
		message: `ロックは ${filteredposts.length} 個のスレッドに対して行われました。`,
		action: '$bit',
		query: {
			'locked': {
				'xor': NumberInt(1)
			},
		}
	};

}
