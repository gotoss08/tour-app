'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    posted: {
        type: Boolean,
        default: false
    },
    title: String,
    subtitle: String,
    body: String,
    markers: [{
        positionIndex: Number,
        position: String,
        cardId: String,
        header: String,
        body: String
    }],
    userId: String,
    voteId: String
}, {
    timestamps: true
});

schema.index({
    'title': 'text',
    'description': 'text',
    'markers.header': 'text',
    'markers.body': 'text'
});

var Post = mongoose.model('Post', schema);

module.exports.Post = Post;