const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    posted: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: '',
    },
    body: {
        type: String,
        default: '',
    },
    markers: [{
        positionIndex: Number,
        position: String,
        cardId: String,
        header: String,
        body: String,
    }],
    userId: {
        type: String,
        default: '',
    },
    voteId: {
        type: String,
        default: '',
    },
    uniqIpsVisited: {
        type: [String],
        default: [],
    },
    totalVisitCount: {
        type: Number,
        default: 0,
    },
    likes: {
        type: [String],
        default: [],
    },
    countries: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
    usePushEach: true,
});

schema.index({
    'title': 'text',
    'body': 'text',
    'markers.header': 'text',
    'markers.body': 'text',
});

const Post = mongoose.model('Post', schema);

module.exports.Post = Post;
