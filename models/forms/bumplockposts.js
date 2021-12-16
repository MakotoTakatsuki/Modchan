'use strict';

const { NumberInt } = require(__dirname+'/../../db/db.js')

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.thread
	})

	if (filteredposts.length === 0) {
		return {
			message: 'ロックを上げるためのスレッドはありません',
		};
	}

	return {
		message: `${filteredposts.length}のスレッドのレイズロックがトグルされました。`,
		action: '$bit',
		query: {
			'bumplocked': {
				'xor': NumberInt(1)
			},
		}
	};

}
