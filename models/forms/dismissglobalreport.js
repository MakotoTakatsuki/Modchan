'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return post.globalreports.length > 0
	})

	if (filteredposts.length === 0) {
		return {
			message: '却下するグローバルレポートはありません'
		}
	}

	return {
		message: '却下されたグローバルレポート',
		action: '$set',
		query: {
			'globalreports': []
		}
	};

}
