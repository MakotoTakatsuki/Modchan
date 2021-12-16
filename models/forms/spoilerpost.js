'use strict';

module.exports = (posts) => {

	// filter to ones not spoilered
	const filteredPosts = posts.filter(post => {
  		return !post.spoiler && post.files.length > 0;
	});

	if (filteredPosts.length === 0) {
		return {
			message:'ネタバレへの投稿はありません'
		};
	}

	return {
		message: `スポイルされた${filteredPosts.length}の投稿(複数可)`,
		action: '$set',
		query: {
			'spoiler': true
		}
	};

}
