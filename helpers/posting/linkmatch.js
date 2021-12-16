'use strict';

module.exports = (permLevel, match, p1, p2, p3, offset, string, groups) => {

	let { url, label, urlOnly } = groups;

	url = url || urlOnly;
	if (permLevel >= 4) {
		label = url
			.replace(/\(/g, '&lpar;')
			.replace(/\)/g, '&rpar;');
	}
	url = url.replace(/\(/g, '%28')
		.replace(/\)/g, '%29');

/*
	//todo: Something to revisit later
	const href = url;
	if (urlOnly == null) {
		try {
			const urlObject = new URL(url);
			if (config.get.allowedHosts.includes(urlObject.hostname)) {
				href = `${urlObject.pathname}${urlObject.search}${urlObject.hash}`;
			}
		} catch (e) { }
	}
*/

	return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${url}'>${label || url}</a>`;

};
