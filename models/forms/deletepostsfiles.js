'use strict';

const { Files } = require(__dirname+'/../../db/')
	, config = require(__dirname+'/../../config.js')
	, { func: pruneFiles } = require(__dirname+'/../../schedules/tasks/prune.js')
	, deletePostFiles = require(__dirname+'/../../helpers/files/deletepostfiles.js');

module.exports = async (posts, unlinkOnly) => {

	const { pruneImmediately } = config.get;

	//get filenames from all the posts
	let files = [];
	for (let i = 0; i < posts.length; i++) {
		const post = posts[i];
		if (post.files.length > 0) {
			files = files.concat(post.files.map(file => {
				return {
					filename: file.filename,
					hash: file.hash,
					thumbextension: file.thumbextension
				};
			}));
		}
	}
	files = [...new Set(files)];

	if (files.length == 0) {
		return {
			 message: 'ファイルが見つかりません'
		};
	}

	if (files.length > 0) {
		const fileNames = files.map(x => x.filename);
        await Files.decrement(fileNames);
		if (pruneImmediately) {
			await pruneFiles(fileNames);
		}
	}

	if (unlinkOnly) {
		return {
			message:`ポスト(複数可)にまたがるリンクされていない${files.length}ファイル`,
			action:'$set',
			query: {
				'files': []
			}
		};
	} else {
		//delete all the files
		await deletePostFiles(files);
		return {
			message:`サーバーから${files.length}のファイルを削除しました。`,
			//NOTE: only deletes from selected posts. other posts with same image will 404
			action:'$set',
			query: {
				'files': []
			}
		};
	}

}
