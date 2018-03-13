const mongoose = require('mongoose');


const optionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    voteCount: {
        type: Number,
        default: 0,
    },
});

const Option = module.exports.Option = mongoose.model('Option', optionSchema);


const voteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    votedUsers: [{
        userId: String,
        optionId: String,
    }],
    options: [optionSchema],
    userId: {
        type: String,
        required: true,
    },
});

const Vote = module.exports.Vote = mongoose.model('Vote', voteSchema);
