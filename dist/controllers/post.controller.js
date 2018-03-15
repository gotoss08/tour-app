'use strict';

var sanitizeHtml = require('sanitize-html');

var util = require('../util/util.js');

var _require = require('../models/post.model.js'),
    Post = _require.Post;

var _require2 = require('../models/vote.model.js'),
    Vote = _require2.Vote;

/* GET */

module.exports.new = function (req, res, next) {
    util.checkUserLoginWithRedirect(req, res, next);

    Post.create({
        userId: req.session.userId
    }).then(function (post) {
        return res.redirect('/p/' + post._id + '/edit');
    }).catch(function (err) {
        if (err) return next(err);
    });
};

module.exports.edit = function (req, res, next) {
    util.checkUserLoginWithRedirect(req, res, next);
    checkPostIdParams(req, res, next);

    Post.findById(req.params.postId).exec().then(function (post) {
        console.log(JSON.stringify(post));
        if (post && post.userId == req.session.userId) {
            var data = { post: post, voteAttached: false };
            return data;
        } else {
            throw new Error('Такого черновика либо не существует, либо у вас нет прав для его просмотра.');
        }
    }).then(function (data) {
        if (!data.post.voteId) {
            data.post.voteId = '';
            return data;
        }
        return Vote.findById(data.post.voteId).exec().then(function (vote) {
            if (vote) {
                data.vote = vote;
                data.voteAttached = true;
            }
            return data;
        });
    }).then(function (data) {
        return res.render('post/edit', data);
    }).catch(function (err) {
        return next(err);
    });
};

/* POST [CRUD] */

module.exports.create = function () {};

module.exports.read = function (req, res, next) {
    checkPostIdParams(req, res, next);

    function getClientIp(req) {
        var ipAddress;
        // The request may be forwarded from local web server.
        var forwardedIpsStr = req.header('x-forwarded-for');
        if (forwardedIpsStr) {
            // 'x-forwarded-for' header may return multiple IP addresses in
            // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
            // the first one
            var forwardedIps = forwardedIpsStr.split(',');
            ipAddress = forwardedIps[0];
        }
        if (!ipAddress) {
            // If request was not forwarded
            ipAddress = req.connection.remoteAddress;
        }
        return ipAddress;
    };

    var clientIp = getClientIp(req);

    console.log(req.connection, null, 2);
    console.log('user ' + clientIp + ' visited post');

    Post.findById(req.params.postId).exec().then(function (post) {
        console.log(JSON.stringify(post, null, 2));
        if (post && post.posted) {
            var data = { post: post, voteAttached: false };
            return data;
        } else {
            throw new Error('Такого поста либо не существует, либо у вас нет прав для его просмотра.');
        }
    }).then(function (data) {
        if (!data.post.voteId) {
            data.post.voteId = '';
            return data;
        }
        return Vote.findById(data.post.voteId).exec().then(function (vote) {
            if (vote) {
                data.vote = vote;
                data.voteAttached = true;
            }
            return data;
        });
    }).then(function (data) {
        return res.render('post/index', data);
    }).catch(function (err) {
        return next(err);
    });
};

module.exports.update = function (req, res, next) {
    if (!util.checkUserLogin(req, res, next)) {
        res.status(401).send();
        return next(new Error('Для этого действия необходим вход в аккаунт.'));
    }
    checkPostIdParams(req, res, next);

    var postData = req.body;

    var sanitizeHtmlWithOptions = function sanitizeHtmlWithOptions(text) {
        return sanitizeHtml(text, {
            allowedTags: ['h2', 'h3', 'blockquote', 'p', 'a', 'img', 'b', 'i', 'strong', 'em', 'strike', 'br', 'u'],
            allowedAttributes: {
                a: ['href', 'name', 'target'],
                img: ['src']
            }
        });
    };

    Post.findById(req.params.postId).exec().then(function (post) {
        post.posted = false;
        if (postData.posted) post.posted = postData.posted;

        post.title = '';
        if (postData.title) post.title = sanitizeHtml(postData.title);

        post.subtitle = '';
        if (postData.subtitle) post.subtitle = sanitizeHtml(postData.subtitle);

        post.body = '';
        if (postData.body) post.body = sanitizeHtml(postData.body);

        post.markers = [];

        if (postData.markers) {
            for (var i = 0; i < postData.markers.length; i++) {
                var marker = postData.markers[i];

                marker.header = sanitizeHtmlWithOptions(marker.header);
                marker.body = sanitizeHtmlWithOptions(marker.body);
            }

            post.markers = postData.markers;
        }

        var data = { post: post };
        data.vote = postData.vote;

        if (post.voteId) {
            return Vote.findById(post.voteId).exec().then(function (vote) {
                data.postVote = vote;
                return data;
            });
        } else return data;
    }).then(function (data) {
        console.log('vote stage');
        if (!data.vote && data.postVote && data.post.voteId) {
            console.log('if (!data.vote && data.postVote && data.post.voteId)');
            return Vote.findByIdAndRemove(data.post.voteId).then(function () {
                data.post.voteId = '';
                return data;
            });
        } else if (data.vote && !data.postVote) {
            console.log('else if (data.vote && !data.postVote)');
            data.vote.options.forEach(function (option) {
                console.dir(option);
            });

            return Vote.create({
                title: data.vote.title,
                options: data.vote.options,
                userId: req.session.userId
            }).then(function (vote) {
                data.vote = vote;
                return data;
            });
        } else if (data.vote && data.postVote) {
            console.log(JSON.stringify(data, null, 2));
            console.log('else if (data.vote && data.postVote)');
            var difference = false;

            if (!data.vote.title || !data.postVote.title || data.vote.title != data.postVote.title) difference = true;
            console.log('if (!data.vote.title || !data.postVote.title || data.vote.title != data.postVote.title)');

            if (data.vote.options && data.postVote.options && data.vote.options.length == data.postVote.options.length) {
                console.log('if (data.vote.options && data.postVote.options && data.vote.options.length == data.postVote.options.length)');
                for (var i = 0; i < data.vote.options.length; i++) {
                    var voteOption = data.vote.options[i];
                    var postVoteOption = data.postVote.options[i];

                    if (voteOption.title != postVoteOption.title) difference = true;
                }
                console.log('for(let i = 0; i < data.vote.options.length; i++)');
            } else difference = true;

            console.log('difference: ' + difference);

            if (difference) {
                console.log('if (difference)');
                return Vote.create({
                    title: data.vote.title,
                    options: data.vote.options,
                    userId: req.session.userId
                }).then(function (vote) {
                    console.log('.then((vote) =>');
                    data.vote = vote;
                    return data;
                });
            } else {
                data.vote = data.postVote;
                return data;
            }
        } else return data;
    }).then(function (data) {
        if (data.vote) {
            data.post.voteId = data.vote._id;
        }

        return data.post.save().then(function () {
            console.log(JSON.stringify(data, null, 2));
            return res.status(200).send(data);
        });
    }).catch(function (err) {
        return next(err);
    });
};

module.exports.delete = function () {};

/* helpers */

var checkPostIdParams = function checkPostIdParams(req, res, next) {
    if (!req.params.postId || !req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new Error('Неверный формат идентификатора поста.'));
    }
};