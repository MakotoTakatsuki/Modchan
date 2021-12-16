'use strict';

const bcrypt = require('bcrypt')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const newPassword = req.body.newpassword;

	//fetch an account
	const account = await Accounts.findOne(username);

	//if the account doesnt exist, reject
	if (!account) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': '禁断',
			'message': 'ユーザーネームまたはパスワードが違います',
			'redirect': '/changepassword.html'
		});
	}

	// bcrypt compare input to saved hash
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);

	//if hashes matched
	if (passwordMatch === false) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': '禁断',
			'message': 'ユーザーネームまたはパスワードが違います',
			'redirect': '/changepassword.html'
		});
	}

	//change the password
	await Accounts.changePassword(username, newPassword);

	return dynamicResponse(req, res, 200, 'message', {
		'title': '成功',
		'message': 'パスワードを変更しました',
		'redirect': '/login.html'
	});

}
