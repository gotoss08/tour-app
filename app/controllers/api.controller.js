const request = require('request');

module.exports.mapCalcpath = (req, res, next) => {
	if(!req.body.start || !req.body.end) {
		return res.sendStatus(400);
	}

	let coords = [];
	let start = req.body.start.split(',');
	coords.push([+start[0], +start[1]]);

	let end = req.body.end.split(',');
	coords.push([+end[0], +end[1]]);
}