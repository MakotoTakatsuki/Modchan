'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const moderatesBoard = res.locals.user.modBoards.includes(req.body.board);
	const ownsBoard = res.locals.user.ownedBoards.includes(req.body.board);
	if (!ownsBoard && !moderatesBoard) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': '要求の形式が正しくありません',
			'message': 'あなたはその板を所有またはモデレートしていません',
			'redirect': `/account.html`
		});
	}

	if (ownsBoard) {
		await Promise.all([
			Accounts.removeOwnedBoard(res.locals.user.username, req.body.board),
			Boards.setOwner(req.body.board, null),
		]);
	} else if (moderatesBoard) {
		await Promise.all([
			Boards.removeModerator(req.body.board, res.locals.user.username),
			Accounts.removeModBoard([res.locals.user.username], req.body.board),
		]);
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': '成功',
		'message': `退会しました ${ownsBoard ? 'owner' : 'moderator'} /${req.body.board}/ の役職を辞任しました。`,
		'redirect': `/account.html`
	});

}
