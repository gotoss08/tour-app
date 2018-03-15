'use strict';

var mongoose = require('mongoose');

var optionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    voteCount: {
        type: Number,
        default: 0
    }
});

var Option = module.exports.Option = mongoose.model('Option', optionSchema);

var voteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    votedUsers: [{
        userId: String,
        optionId: String
    }],
    options: [optionSchema],
    userId: {
        type: String,
        required: true
    }
}, {
    usePushEach: true
});

var Vote = module.exports.Vote = mongoose.model('Vote', voteSchema);