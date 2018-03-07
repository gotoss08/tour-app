'use strict';

var request = require('request');

module.exports.mapCalcpath = function (req, res, next) {
	if (!req.body.start || !req.body.end) {
		return res.sendStatus(400);
	}

	var coords = [];
	var start = req.body.start.split(',');
	coords.push([+start[0], +start[1]]);

	var end = req.body.end.split(',');
	coords.push([+end[0], +end[1]]);
};