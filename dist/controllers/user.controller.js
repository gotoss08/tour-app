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
            if (err) return next(err);

            res.redirect(307, '/user/login' + querystring.stringify({ username: req.body.username, password: req.body.password }));
            // request('http://localhost:3000/user/login?' + querystring.stringify({username: req.body.username, password: req.body.password}), (error, response, body) => {
            //     if (error) {
            //         return next(error);
            //     }

            //     console.log(response);
            // });
        });
    } else {
        return next(new Error('Неверные значения полей регистрации!'));
    }
};

module.exports.userLoginGet = function (req, res) {
    if (req.session.userId) {
        return res.redirect('/user/me');
    } else {
        return res.render('user/login');
    }
};

module.exports.userLoginPost = function (req, res, next) {
    if (req.body.username && req.body.password) {
        User.authenticate(req.body.username, req.body.password, function (err, user) {
            if (err || !user) {
                var error = new Error('Неправильное имя пользователя или пароль!');
                error.status = 401;
                return next(error);
            }

            req.session.userId = user._id;
            return res.redirect('/user/me');
        });
    } else {
        var error = new Error('Поля с именем пользователя или паролем пусты!');
        error.status = 400;
        return next(error);
    }
};

module.exports.getCurrentUser = function (req, res, next) {
    User.findById(req.session.userId, function (err, user) {
        if (err) return next(err);
        if (!user) {
            var unauthorizedError = new Error('Вы должны авторизоваться в системе, перед тем как просматривать свой профиль!');
            unauthorizedError.status = 401;
            return next(unauthorizedError);
        }

        Post.find({ userId: user._id }, function (err, posts) {
            if (err) return next(err);
            return res.render('user/profile', { user: user, posts: posts });
        });
    });
};

module.exports.getUser = function (req, res, next) {
    User.findOne({ username: req.params.userName }, function (err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Не удалось найти пользователя: ' + req.params.userName));

        Post.find({ userId: user._id }, function (err, posts) {
            if (err) {
                return next(err);
            }

            console.log('user: ' + JSON.stringify(user, null, 2));

            return res.render('user/profile', { user: user, posts: posts });
        });
    });
};

module.exports.userLogoutPost = function (req, res, next) {
    if (!req.session) return;

    req.session.destroy(function (err) {
        if (err) return next(err);

        return res.redirect('/');
    });
};