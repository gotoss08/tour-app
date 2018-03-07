const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    userId: String,
    body: String,
    date: {
        type: Date,
        default: Date.now
    }
});

const TopicSchema = new mongoose.Schema({
    name: String,
    custom: {
        type: Boolean,
        default: false
    }
});

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    countryId: {
        type: String,
        required: true
    },
    editorType: {
        type: String,
        default: 'simple'
    },
    topics: [{
        topicId: String,
        body: {
            type: String
        }
    }],
    voteId: String,
    // comments: [CommentSchema],
    hidden: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

PostSchema.index({ title: 'text', body: 'text' });

module.exports.Post = mongoose.model('Post1', PostSchema);
module.exports.Topic = mongoose.model('Topic', TopicSchema);
module.exports.Comment = mongoose.model('Comment', CommentSchema);