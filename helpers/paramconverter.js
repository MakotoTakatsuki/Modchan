'use strict';

const { ObjectId } = require(__dirname+'/../db/db.js')
	, timeFieldRegex = /^(?<YEAR>[\d]+y)?(?<MONTH>[\d]+mo)?(?<WEEK>[\d]+w)?(?<DAY>[\d]+d)?(?<HOUR>[\d]+h)?(?<MINUTE>[\d]+m)?(?<SECOND>[\d]+s)?$/
	, timeUtils = require(__dirname+'/timeutils.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, makeArrayIfSingle = (obj) => !Array.isArray(obj) ? [obj] : obj;

const defaultOptions = {
	timeFields: [],
	trimFields: [],
	allowedArrays: [], //helpers/checks/captcha.js already does this for captcha
	numberFields: [],
	numberArrays: [],
	objectIdParams: [],
	objectIdFields: [],
	objectIdArrays: [],
	processThreadIdParam: false,
	processDateParam: false,
	processMessageLength: false,
};

module.exports = (options) => {

	options = { ...defaultOptions, ...options };
	options.allowedArrays.push('captcha'); //this is the only one for now, otherwise i would .concat them all or something.

	return (req, res, next) => {

		const { timeFields, trimFields, allowedArrays, processThreadIdParam,
			processDateParam, processMessageLength, numberFields, numberArrays,
			objectIdParams, objectIdFields, objectIdArrays } = options;

		/* check all body fields, body-parser prevents this array being too big, so no worry.
		   whitelist for fields that can be arrays, and convert singular of those fields to 1 length array */
		const bodyFields = Object.keys(req.body);
		for (let i = 0; i < bodyFields.length; i++) {
			const key = bodyFields[i];
			const val = req.body[key];
			if (!allowedArrays.includes(key) && Array.isArray(val)) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': 'Malformed input'
				});
			} else if (allowedArrays.includes(key) && !Array.isArray(val)) {
				req.body[key] = makeArrayIfSingle(req.body[key]); //convert to arrays with single item for simpler case batch handling later
			}
		}

		//process trimFields to remove excess white space
		for (let i = 0; i < trimFields.length; i++) {
			const field = trimFields[i];
			if (req.body[field]) {
				//trimEnd() because trailing whitespace doesnt affect how a post appear and if it is all whitespace, trimEnd will get it all anyway
				req.body[field] = req.body[field].trimEnd() || null;
			}
		}

		//convert numberFields into number
		for (let i = 0; i < numberFields.length; i++) {
			const field = numberFields[i];
			if (req.body[field] != null) {
				const num = parseInt(req.body[field], 10);
				if (Number.isSafeInteger(num)) {
					req.body[field] = num;
				} else {
					req.body[field] = null;
				}
			}
		}

		//convert timeFields duration string to time in ms
		for (let i = 0; i < timeFields.length; i++) {
			const field = timeFields[i];
			if (req.body[field] != null) {
				const matches = req.body[field].match(timeFieldRegex);
				if (matches && matches.groups) {
					const groups = matches.groups;
					let duration = 0;
					const groupKeys = Object.keys(groups);
					for (let i = 0; i < groupKeys.length; i++) {
						const key = groupKeys[i];
						if (!groups[key]) {
							continue;
						}
						const mult = +groups[key].replace(/\D+/, ''); //remove the unit
						if (Number.isSafeInteger(mult) //if the multiplier is safe int
							&& Number.isSafeInteger(mult*timeUtils[key]) //and multiplying it is safe int
							&& Number.isSafeInteger((mult*timeUtils[key])+duration)) { //and adding it to the total is safe
							duration += mult*timeUtils[key];
						}
					}
					req.body[field] = duration;
				} else {
					const num = parseInt(req.body[field], 10);
					if (Number.isSafeInteger(num)) {
						req.body[field] = num;
					} else {
						req.body[field] = null;
					}
				}
			}
		}

		//convert/map some fields to ObjectId or Number
		try {
			for (let i = 0; i < objectIdFields.length; i++) {
				const field = objectIdFields[i];
				if (req.body[field]) {
					req.body[field] = ObjectId(req.body[field]);
				}
			}
			for (let i = 0; i < objectIdParams.length; i++) {
				const field = objectIdParams[i];
				if (req.params[field]) {
					req.params[field] = ObjectId(req.params[field]);
				}
			}
			for (let i = 0; i < objectIdArrays.length; i++) {
				const field = objectIdArrays[i];
				if (req.body[field]) {
					req.body[field] = req.body[field].map(ObjectId);
				}
			}
			for (let i = 0; i < numberArrays.length; i++) {
				const field = numberArrays[i];
				if (req.body[field]) {
					req.body[field] = req.body[field].map(Number);
				}
			}
		} catch (e) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'Malformed input'
			});
		}

		//thread id
		if (processThreadIdParam && req.params.id) {
			req.params.id = +req.params.id;
		}

		//moglog date
		if (processDateParam && req.params.date) {
			let [ month, day, year ] = req.params.date.split('-');
			month = month-1;
			const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
			if (date !== 'Invalid Date') {
				res.locals.date = { month, day, year, date };
			}
		}

		/* normalise message length check for CRLF vs just LF, because String.length depending on browser wont count CRLF as
		   2 characters, so user gets "message too long" at the right length. Maybe will add another array for these in future */
		if (processMessageLength) {
			res.locals.messageLength = req.body.message ? req.body.message.replace(/\r\n/igm, '\n').length : 0;
		}

		next();

	};

}
