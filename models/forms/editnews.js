'use strict';

const { News } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, { prepareMarkdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, messageHandler = require(__dirname+'/../../helpers/posting/message.js');

module.exports = async (req, res, next) => {

	const message = prepareMarkdown(req.body.message, false);
	const { message: markdownNews } = await messageHandler(message, null, null, res.locals.permLevel);

	const updated = await News.updateOne(req.body.news_id, req.body.title, message, markdownNews).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': '要求の形式が正しくありません',
			'errors': 'ニュース投稿は存在しません',
			'redirect': req.headers.referer || '/globalmanage/news.html'
		});
	}

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': '成功',
		'message': '更新されたニュース投稿',
		'redirect': '/globalmanage/news.html'
	});

}
