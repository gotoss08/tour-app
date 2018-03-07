const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    posted: {
        type: Boolean,
        default: false,
    },
    title: String,
    description: String,
    markers: [{
        positionIndex: Number,
        position: String,
        cardId: String,
        header: String,
        body: String,
    }],
    userId: String,
}, {
    timestamps: true,
});

schema.index({
    'title': 'text',
    'description': 'text',
    'markers.header': 'text',
    'markers.body': 'text',
});

const Post = mongoose.model('Post', schema);

module.exports.Post = Post;
