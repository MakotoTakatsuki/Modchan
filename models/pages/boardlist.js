'use strict';

const config = require(__dirname+'/../../config.js')
	, { Boards } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, { relativeColor, relativeString } = require(__dirname+'/../../helpers/timeutils.js')
	, pageQueryConverter = require(__dirname+'/../../helpers/pagequeryconverter.js')
	, limit = 30;

module.exports = async (req, res, next) => {

	const { meta } = config.get;
	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	const direction = req.query.direction && req.query.direction === 'asc' ? 1 : -1;
	const search = (typeof req.query.search === 'string' ? req.query.search : null);
	const localFirst = req.query.local_first != null;
	const sortType = req.query.sort && req.query.sort === 'activity' ? 'activity' : 'popularity';
	let sort = {};

	const webringSites = [meta.siteName, ...(await Boards.webringSites())];
	const webringSitesSet = new Set(webringSites);

	let selectedSites = req.query.sites ? (typeof req.query.sites === 'string' ? [req.query.sites] : req.query.sites) : [];
	let validSelectedSites = selectedSites.filter(ss => webringSitesSet.has(ss));
	if (validSelectedSites.length === 0) {
		validSelectedSites = webringSites;
	}
	const validSelectedSitesSet = new Set(validSelectedSites);

	const cacheQuery = new URLSearchParams({ direction, sort: sortType, search, page, localFirst, selectedSites: [...validSelectedSitesSet] });
	cacheQuery.sort();
	const cacheQueryString = cacheQuery.toString();
	const cached = await cache.get(`boardlist:${cacheQueryString}`);
	const { shown, notShown } = webringSites.reduce((acc, ws) => {
		if (validSelectedSitesSet.has(ws)) {
			acc.shown.push(ws);
		} else {
			acc.notShown.push(ws)
		}
		return acc;
	}, { shown: [], notShown: [] });
	validSelectedSites = validSelectedSites.map(x => x === meta.siteName ? null : x);

	if (localFirst && validSelectedSitesSet.has(meta.siteName)) {
		//meh.
		sort['webring'] = 1;
	}
	let boards, maxPage;
	if (cached) {
		({ boards, maxPage } = cached);
	} else {

		if (sortType === 'activity') {
			sort['lastPostTimestamp'] = direction;
		} else {
			sort['ips'] = direction;
			sort['pph'] = direction;
			sort['sequence_value'] = direction;
		}

		let filter = {};
		if (req.query.search && search) {
			filter = {
				'search': search
			}
		}

		try {
			[ boards, maxPage ] = await Promise.all([
				Boards.boardSort(offset, limit, sort, filter, false, validSelectedSites),
				Boards.count(filter, false, validSelectedSites),
			]);
			maxPage = Math.ceil(maxPage/limit);
		} catch (err) {
			return next(err);
		}
		const now = new Date();
		for (let i = 0; i < boards.length; i++) {
			if (boards[i].lastPostTimestamp) {
				const lastPostDate = new Date(boards[i].lastPostTimestamp);
				boards[i].lastPostTimestamp = {
					text: relativeString(now, lastPostDate),
					color: relativeColor(now, lastPostDate)
				}
			}
		}
		cache.set(`boardlist:${cacheQueryString}`, { boards, maxPage }, 60);
	}

	res
	.set('Cache-Control', 'public, max-age=60');

	if (req.path === '/boards.json') {
		res.json({
			boards,
			page,
			maxPage,
		});
	} else {
		res.render('boardlist', {
			boards,
			shown,
			notShown,
			page,
			maxPage,
			query: req.query,
			localFirst,
			search,
			queryString,
		});
	}

}
