'use strict';

var Option = require('../models/vote.model').Option;
var Vote = require('../models/vote.model').Vote;
var uniqid = require('uniqid');

var isUserVoted = function isUserVoted(vote, userId) {
	var userVoted = false;
	vote.votedUsers.forEach(function (user) {
		console.log('user: ' + user);
		if (user == userId) {
			console.log('user voted');
			userVoted = true;
		}
	});
	return userVoted;
};

// uses when user votes on the post page
module.exports.vote = function (req, res, next) {
	console.log('received vote data: ' + JSON.stringify(req.body));

	if (req.body.voteId && req.body.optionId && req.body.userId) {
		Vote.findById(req.body.voteId, function (err, vote) {
			if (err) return next(err);

			if (isUserVoted(vote, req.session.userId)) return res.status(403).send('already-voted');

			for (var i = 0; i < vote.options.length; i++) {
				var option = vote.options[i];

				if (option._id == req.body.optionId) {
					option.votes += 1;
				}
			}

			vote.votedUsers.push(req.body.userId);
			console.log('updated voted users list, added: ' + req.body.userId);

			console.log('saving...');
			vote.save(function (err, vote) {
				if (err) return next(err);

				console.log('updated vote: ' + JSON.stringify(vote));

				return res.status(200).send('voted');
			});
		});
	} else {
		return res.status(400).send('error');
	}
};

module.exports.removeAll = function (req, res, next) {
	Option.remove({}, function (err) {
		if (err) return next(err);
	});
};

module.exports.printAll = function (req, res, next) {
	Option.find({}, function (err, options) {
		if (err) return next(err);else {
			console.log('------ ' + options.length + ' ------');
			for (var i = 0; i < options.length; i++) {
				var option = options[i];
				console.log('  + Vote Option: ' + option.name + '(' + option._id + ')');
			}
			console.log('------ end ------');
		}
	});
};

module.exports.create = function (req, res, next) {};

module.exports.optionCreate = function (req, res, next) {
	if (req.body.name) {
		console.log('option name: ' + req.body.name);

		var id = uniqid();

		Option.create({ _id: id, name: req.body.name }, function (err, option) {
			if (err) return next(err);

			return res.send(option._id);
		});
	} else {
		return res.status(500).send('Vote option name could not be null.');
	}
};

module.exports.optionRemove = function (req, res, next) {
	if (req.body.id) {
		console.log('option id: ' + req.body.id);

		Option.find({ _id: req.body.id }).remove().exec(function (err) {
			if (err) return next(err);else return res.sendStatus(200);
		});
	} else {
		return res.status(500).send('Vote option id could not be null.');
	}
};

module.exports.optionUpdate = function (req, res, next) {
	if (req.body.id && req.body.name) {
		console.log('option id: ' + req.body.id);
		console.log('option name: ' + req.body.name);

		Option.findByIdAndUpdate(req.body.id, { name: req.body.name }, { new: true }, function (err, option) {
			if (err) return next(err);else return res.status(200).send(option.name);
		});
	} else {
		return res.status(500).send('Vote option id could not be null.');
	}
};

module.exports.fetchVote = function (req, res, next) {
	Vote.findById(req.params.voteId, function (err, vote) {
		if (err) return next(err);

		return res.status(200).send({ vote: vote, userVoted: isUserVoted(vote, req.session.userId) });
	});
};