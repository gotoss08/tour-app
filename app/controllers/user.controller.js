const request = require('request');
const querystring = require('querystring');

const User = require('../models/user.model');
const Post = require('../models/post.model');

module.exports.userRegisterGet = (req, res) => {
    return res.render('user/register');
};

module.exports.userRegisterPost = (req, res, next) => {
    if(req.body.username && req.body.email && req.body.password) {
        const userData = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        };

        User.create(userData, (err, user) => {
            if (err) {
                return next(err);
            } else {
                request('http://localhost:3000/user/login?' + querystring.stringify({ username: req.body.username, password: req.body.password }), (error, response, body) => {
                    if(error) {
                        return next(error);
                    }

                    console.log(response);
                });


                // return res.redirect('/user/login');
            }
        });
    } else {
        return next(new Error('Fill all fields!'));
    }
};

module.exports.userLoginGet = (req, res) => {
    if(req.session.userId) {
        return res.redirect('/user/');
    } else {
        return res.render('user/login');
    }
};

module.exports.userLoginPost = (req, res, next) => {
    if (req.body.username && req.body.password) {
        User.authenticate(req.body.username, req.body.password, (error, user) => {
            if (error || !user) {
                const error = new Error('Wrong username or password');
                error.status = 401;
                return next(error);
            } else {
                req.session.userId = user._id;
                if (req.cookies['return-page']) {
                    res.clearCookie('return-page');
                    return res.redirect(req.cookies['return-page']);
                }
                return res.redirect('back');
            }
        });
    } else {
        const error = new Error('All fields required!');
        error.status = 400;
        return next(error);
    }
};

module.exports.userGet = (req, res, next) => {
    User.findById(req.session.userId, (error, user) => {
            if (error) {
                return next(error);
            } else {
                if (user == null) {
                    const err = new Error('Not authorized! Go back');
                    err.status = 400;
                    return next(err);
                } else {
                    Post.find({ userId: user._id }, (err, posts) => {
                        if (err) {
                            return next(err);
                        }

                        return res.render('user/profile', { user: user, posts: posts });
                    });
                }
            }
        });
};

module.exports.userNameGet = (req, res, next) => {
    console.log('trying to get user profile');
    User.findOne({ username: req.params.userName }, (error, user) => {
            if (error) {
                return next(error);
            } else {
                if (user == null) {

                } else {
                    Post.find({ userId: user._id }, (err, posts) => {
                        if (err) {
                            return next(err);
                        }

                        console.log(user);

                        return res.render('user/profile', { user: user, posts: posts });
                    });
                }
            }
        });
};

module.exports.userLogoutPost = (req, res, next) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
};