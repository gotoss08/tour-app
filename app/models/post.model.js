const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    body: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true
    },
    countryId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', PostSchema);