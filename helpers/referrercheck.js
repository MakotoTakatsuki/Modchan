'use strict';

const config = require(__dirname+'/../config.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, { addCallback } = require(__dirname+'/../redis.js')

let refererCheck, allowedHosts, allowedHostSet;
const updateReferers = () => {
	({ refererCheck, allowedHosts } = config.get);
	allowedHostSet = new Set(allowedHosts);
}
updateReferers();
addCallback('config', updateReferers);


module.exports = (req, res, next) => {
	if (req.method !== 'POST') {
		return next();
	}
	let validReferer = false;
	try {
		const url = new URL(req.headers.referer);
		validReferer = allowedHostSet.has(url.hostname);
	} catch(e) {
		//referrer is invalid url
	}
	if (refererCheck === true && (!req.headers.referer || !validReferer)) {
        return dynamicResponse(req, res, 403, 'message', {
			'title': '禁断',
			'message': '「リファラー」ヘッダーが無効または欠落しています。 正しいURLから投稿していますか？'
		});
	}
	next();
}
