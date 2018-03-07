'use strict';

var request = require('request');
var querystring = require('querystring');

var User = require('../models/user.model');
var Post = require('../models/post.model').Post;

module.exports.userRegisterGet = function (req, res) {
    return res.render('user/register');
};

module.exports.userRegisterPost = function (req, res, next) {
    if (req.body.username && req.body.email && req.body.password) {
        var userData = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        };

        User.create(userData, function (err, user) {
            if (err) {
                return next(err);
            } else {
                request('http://localhost:3000/user/login?' + querystring.stringify({ username: req.body.username, password: req.body.password }), function (error, response, body) {
                    if (error) {
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

module.exports.userLoginGet = function (req, res) {
    if (req.session.userId) {
        return res.redirect('/user/');
    } else {
        return res.render('user/login');
    }
};

module.exports.userLoginPost = function (req, res, next) {
    if (req.body.username && req.body.password) {
        User.authenticate(req.body.username, req.body.password, function (error, user) {
            if (error || !user) {
                var _error = new Error('Wrong username or password');
                _error.status = 401;
                return next(_error);
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
        var error = new Error('All fields required!');
        error.status = 400;
        return next(error);
    }
};

module.exports.userGet = function (req, res, next) {
    User.findById(req.session.userId, function (error, user) {
        if (error) {
            return next(error);
        } else {
            if (user == null) {
                var err = new Error('Not authorized! Go back');
                err.status = 400;
                return next(err);
            } else {
                Post.find({ userId: user._id }, function (err, posts) {
                    if (err) {
                        return next(err);
                    }

                    return res.render('user/profile', { user: user, posts: posts });
                });
            }
        }
    });
};

module.exports.userNameGet = function (req, res, next) {
    console.log('trying to get user profile');
    User.findOne({ username: req.params.userName }, function (error, user) {
        if (error) {
            return next(error);
        } else {
            if (user == null) {} else {
                Post.find({ userId: user._id }, function (err, posts) {
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

module.exports.userLogoutPost = function (req, res, next) {
    if (req.session) {
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
};