'use strict';

const { NumberInt } = require(__dirname+'/../../db/db.js')

module.exports = (posts, sticky) => {

	const filteredposts = posts.filter(post => {
		return !post.thread
	})

	if (filteredposts.length === 0) {
		return {
			message: '粘着性のある糸はありません',
		};
	}

	const stickyValue = NumberInt(sticky);

	return {
		message: `${filteredposts.length}のスレッドの付箋を${sticky}に設定する。`,
		action: '$set',
		query: {
			'sticky': stickyValue,
		}
	};

}
