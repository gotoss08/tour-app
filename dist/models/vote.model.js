'use strict';

var mongoose = require('mongoose');

var OptionSchema = new mongoose.Schema({
	_id: String,
	name: String
}, {
	_id: false
});

module.exports.Option = mongoose.model('Option', OptionSchema);

var VoteSchema = new mongoose.Schema({
	title: String,
	options: [{
		name: String,
		votes: Number
	}],
	votedUsers: [String]
}, {
	usePushEach: true
});

module.exports.Vote = mongoose.model('Vote', VoteSchema);