'use strict';

const { NumberInt } = require(__dirname+'/../../db/db.js')

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.thread
	})

	if (filteredposts.length === 0) {
		return {
			message: '循環するスレッドがありません',
		};
	}

	return {
		message: `循環モードが${filteredposts.length}のスレッドでトグルされました。`,
		action: '$bit',
		query: {
			'cyclic': {
				'xor': NumberInt(1)
			},
		}
	};

}
