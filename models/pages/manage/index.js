'use strict';

module.exports = {
	manageReports: require(__dirname+'/reports.js'),
	manageRecent: require(__dirname+'/recent.js'),
	manageSettings: require(__dirname+'/settings.js'),
	manageBans: require(__dirname+'/bans.js'),
	manageLogs: require(__dirname+'/logs.js'),
	manageAssets: require(__dirname+'/assets.js'),
	manageBoard: require(__dirname+'/board.js'),
	manageCatalog: require(__dirname+'/catalog.js'),
	manageThread: require(__dirname+'/thread.js'),
	manageCustomPages: require(__dirname+'/custompages.js'),
	editCustomPage: require(__dirname+'/editcustompage.js'),
}
