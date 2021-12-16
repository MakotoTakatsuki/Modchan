'use strict';

const cache = require(__dirname+'/../../redis.js')
	, dynamicResponse = require(__dirname+'/../dynamic.js')
	, deleteTempFiles = require(__dirname+'/../files/deletetempfiles.js')
	, config = require(__dirname+'/../../config.js')
	, { batch } = require('dnsbl');

module.exports = async (req, res, next) => {

	const { ipHeader, dnsbl, blockBypass } = config.get;
	if (dnsbl.enabled && dnsbl.blacklists.length > 0 //if dnsbl enabled and has more than 0 blacklists
		&& !res.locals.anonymizer //anonymizers cant be dnsbl'd
		&& (!res.locals.blockBypass || !blockBypass.bypassDnsbl)) { //and there is no valid block bypass, or they do not bypass dnsbl
		const ip = req.headers[ipHeader] || req.connection.remoteAddress;
		let isBlacklisted = await cache.get(`blacklisted:${ip}`);
		if (isBlacklisted === null) { //not cached
			const dnsblResp = await batch(ip, dnsbl.blacklists);
			isBlacklisted = dnsblResp.some(r => r.listed === true);
			await cache.set(`blacklisted:${ip}`, isBlacklisted, Math.floor(dnsbl.cacheTime/1000));
		}
		if (isBlacklisted) {
			deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 403, 'message', {
				'title': '禁断',
				'message': `あなたのIPアドレスがブラックリストに登録されているため、リクエストがブロックされました。${blockBypass.bypassDnsbl ? '「ブロックバイパス」を解決して、ブラックリストを一時的に回避することができます。' : ''}`,
				'redirect': req.headers.referer || '/',
				'link': blockBypass.bypassDnsbl ? { text: 'ブロックバイパスを解決する', href: '/bypass.html' } : null,
			});
		}
	}
	return next();

}
