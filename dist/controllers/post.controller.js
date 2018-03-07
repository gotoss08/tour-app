'use strict';

var sanitizeHtml = require('sanitize-html');

var _require = require('../models/post.model.js'),
    Post = _require.Post;

/* GET */

module.exports.new = function (req, res, next) {
    checkUserLogin(req, res, next);

    Post.create({
        userId: req.session.userId
    }).then(function (post) {
        return res.redirect('/p/' + post._id + '/edit');
    }).catch(function (err) {
        if (err) return next(err);
    });
};

module.exports.edit = function (req, res, next) {
    defaultCheck(req, res, next);

    Post.findById(req.params.postId).exec().then(function (post, err) {
        if (post && post.userId == req.session.userId) return res.render('post/edit', { post: post });else return next(new Error('Такого черновика либо не существует, либо у вас нет прав для его просмотра.'));
    }).catch(function (err) {
        return next(err);
    });
};

module.exports.invalid = function (req, res) {};

/* POST [CRUD] */

module.exports.create = function () {};

module.exports.read = function () {};

module.exports.update = function (req, res, next) {
    defaultCheck(req, res, next);
    console.log('post update');

    var postData = req.body;

    console.log('before sanitize: ' + JSON.stringify(postData));

    for (var i = 0; i < postData.markers.length; i++) {
        var marker = postData.markers[i];

        marker.header = sanitizeHtml(marker.header);
        marker.body = sanitizeHtml(marker.body);
    }

    console.log('after sanitize' + JSON.stringify(postData));

    Post.findByIdAndUpdate(req.params.postId, postData).exec().then(function (post) {
        return res.status(200).send(postData);
    }).catch(function (err) {
        return next(err);
    });
};

module.exports.delete = function () {};

/* helpers */

var checkUserLogin = function checkUserLogin(req, res, next) {
    if (!req.session.userId) {
        // TODO: add user checking according to new user controller
        return res.redirect('/user/login');
    }
};

var checkPostIdParams = function checkPostIdParams(req, res, next) {
    if (!req.params.postId || !req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new Error('Неверный формат идентификатора поста.'));
    }
};

var defaultCheck = function defaultCheck(req, res, next) {
    checkUserLogin(req, res);
    checkPostIdParams(req, res, next);
};