'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, restrictedURIs = new Set(['captcha', 'forms', 'randombanner', 'all'])
	, { ensureDir } = require('fs-extra')
	, config = require(__dirname+'/../../config.js');

module.exports = async (req, res, next) => {

	const { boardDefaults } = config.get;

	const { name, description } = req.body
		, uri = req.body.uri.toLowerCase()
		, tags = req.body.tags.split(/\r?\n/).filter(n => n)
		, owner = req.session.user;

	if (restrictedURIs.has(uri)) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad Request',
			'message': 'That URI is not available for board creation',
			'redirect': '/create.html'
		});
	}

	const board = await Boards.findOne(uri);

	// if board exists reject
	if (board != null) {
		return dynamicResponse(req, res, 409, 'message', {
			'title': 'Conflict',
			'message': 'Board with this URI already exists',
			'redirect': '/create.html'
		});
	}


	//todo: add a settings for defaults
	const newBoard = {
		'_id': uri,
		owner,
		tags,
		'banners': [],
		'sequence_value': 1,
		'pph': 0,
		'ppd': 0,
		'ips': 0,
		'lastPostTimestamp': null,
		'webring': false,
		'flags': {},
		'assets': [],
		'settings': {
			name,
			description,
			'moderators': [],
			...boardDefaults
		}
	}

	await Promise.all([
		Boards.insertOne(newBoard),
		Accounts.addOwnedBoard(owner, uri),
		ensureDir(`${uploadDirectory}/html/${uri}`),
		ensureDir(`${uploadDirectory}/json/${uri}`),
		ensureDir(`${uploadDirectory}/banner/${uri}`),
		ensureDir(`${uploadDirectory}/flag/${uri}`),
		ensureDir(`${uploadDirectory}/asset/${uri}`),
	]);

	return res.redirect(`/${uri}/index.html`);

}
