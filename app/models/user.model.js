const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

UserSchema.statics.authenticate = (username, password, callback) => {
    User.findOne({ username: username })
        .exec((err, user) => {
            if (err) {
                return callback(err);
            } else if (!user) {
                const err = new Error('User not found');
                err.status = 401;
                return callback(err);
            }
            bcrypt.compare(password, user.password, (err, result) => {
                if(result === true) {
                    return callback(null, user);
                } else {
                    return callback();
                }
            });
        });
};

UserSchema.pre('save', function(next) {
    const user = this;
    console.log(user);
    bcrypt.hash(user.password, 10, (err, hash) => {
        if(err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

const User = mongoose.model('User', UserSchema);
module.exports = User;