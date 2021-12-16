'use strict';

const { News } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, { prepareMarkdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, messageHandler = require(__dirname+'/../../helpers/posting/message.js');

module.exports = async (req, res, next) => {

	const message = prepareMarkdown(req.body.message, false);
	const { message: markdownNews } = await messageHandler(message, null, null, res.locals.permLevel);

	const post = {
		'title': req.body.title,
		'message': {
			'raw': message,
			'markdown': markdownNews
		},
		'date': new Date(),
		'edited': null,
	};

	await News.insertOne(post);

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': '成功',
		'message': 'ニュース投稿を追加',
		'redirect': '/globalmanage/news.html'
	});

}
