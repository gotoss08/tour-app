const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    posted: {
        type: Boolean,
        default: false,
    },
    title: String,
    subtitle: String,
    body: String,
    markers: [{
        positionIndex: Number,
        position: String,
        cardId: String,
        header: String,
        body: String,
    }],
    userId: String,
    voteId: String,
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
    'subtitle': 'text',
    'body': 'text',
    'markers.header': 'text',
    'markers.body': 'text',
});

const Post = mongoose.model('Post', schema);

module.exports.Post = Post;
