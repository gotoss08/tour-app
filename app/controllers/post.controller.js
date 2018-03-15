const sanitizeHtml = require('sanitize-html');

const util = require('../util/util.js');

const {Post} = require('../models/post.model.js');
const {Vote} = require('../models/vote.model.js');
const User = require('../models/user.model');

/* GET */

module.exports.new = (req, res, next) => {
    util.checkUserLoginWithRedirect(req, res, next);

    Post.create({
        userId: req.session.userId,
    }).then((post) => {
        return res.redirect('/p/' + post._id + '/edit');
    }).catch((err) => {
        if (err) return next(err);
    });
};

module.exports.edit = (req, res, next) => {
    util.checkUserLoginWithRedirect(req, res, next);
    checkPostIdParams(req, res, next);

    Post.findById(req.params.postId).exec()
        .then((post) => {
            console.log(JSON.stringify(post));
            if (post && post.userId == req.session.userId) {
                let data = {post: post, voteAttached: false};
                return data;
            } else {
                throw new Error('Такого черновика либо не существует, либо у вас нет прав для его просмотра.');
            }
        })
        .then((data) => {
            if (!data.post.voteId) {
                data.post.voteId = '';
                return data;
            }
            return Vote.findById(data.post.voteId).exec().then((vote) => {
                if (vote) {
                    data.vote = vote;
                    data.voteAttached = true;
                }
                return data;
            });
        })
        .then((data) => {
            return res.render('post/edit', data);
        })
        .catch((err) => {
            return next(err);
        });
};


/* POST [CRUD] */

module.exports.create = () => {

};

module.exports.read = (req, res, next) => {
    checkPostIdParams(req, res, next);

    let clientIp = req.clientIp;

    Post.findById(req.params.postId).exec()
        .then((post) => {
            if (post && post.posted) {
                /* update counters */
                let notFoundCurrentIp = true;
                for(let i = 0; i < post.uniqIpsVisited.length; i++) {
                    let ip = post.uniqIpsVisited[i];
                    if (ip == clientIp) {
                        notFoundCurrentIp = false;
                        break;
                    }
                }
                if (notFoundCurrentIp) post.uniqIpsVisited.push(clientIp);
                post.totalVisitCount+=1;
                post.save();

                console.log(JSON.stringify(post, null, 2));

                let data = {post: post, voteAttached: false};
                return data;
            } else {
                throw new Error('Такого поста либо не существует, либо у вас нет прав для его просмотра.');
            }
        })
        .then((data) => {
            if (!data.post.voteId) {
                data.post.voteId = '';
                return data;
            }
            return Vote.findById(data.post.voteId).exec().then((vote) => {
                if (vote) {
                    data.vote = vote;
                    data.voteAttached = true;
                }
                return data;
            });
        })
        .then((data) => {
            return User.findById(data.post.userId).exec().then((user) => {
                data.username = user.username;
                data.userAvatarPath = user.avatarPath;
                return data;
            });
        })
        .then((data) => {
            return res.render('post/index', data);
        })
        .catch((err) => {
            return next(err);
        });
};

module.exports.update = (req, res, next) => {
    if (!util.checkUserLogin(req, res, next)) {
        res.status(401).send();
        return next(new Error('Для этого действия необходим вход в аккаунт.'));
    }
    checkPostIdParams(req, res, next);

    let postData = req.body;

    let sanitizeHtmlWithOptions = (text) => {
        return sanitizeHtml(text, {
            allowedTags: ['h2', 'h3', 'blockquote', 'p', 'a', 'img', 'b', 'i', 'strong', 'em', 'strike', 'br', 'u'],
            allowedAttributes: {
                a: ['href', 'name', 'target'],
                img: ['src'],
            },
        });
    };

    Post.findById(req.params.postId).exec()
        .then((post) => {
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
                for (let i = 0; i < postData.markers.length; i++) {
                    let marker = postData.markers[i];

                    marker.header = sanitizeHtmlWithOptions(marker.header);
                    marker.body = sanitizeHtmlWithOptions(marker.body);
                }

                post.markers = postData.markers;
            }

            let data = {post: post};
            data.vote = postData.vote;

            if (post.voteId) {
                return Vote.findById(post.voteId).exec().then((vote) => {
                    data.postVote = vote;
                    return data;
                });
            } else return data;
        })
        .then((data) => {
            console.log('vote stage');
            if (!data.vote && data.postVote && data.post.voteId) {
                console.log('if (!data.vote && data.postVote && data.post.voteId)');
                return Vote.findByIdAndRemove(data.post.voteId).then(() => {
                    data.post.voteId = '';
                    return data;
                });
            } else if (data.vote && !data.postVote) {
                console.log('else if (data.vote && !data.postVote)');
                data.vote.options.forEach((option) => {
                    console.dir(option);
                });

                return Vote.create({
                    title: data.vote.title,
                    options: data.vote.options,
                    userId: req.session.userId,
                }).then((vote) => {
                    data.vote = vote;
                    return data;
                });
            } else if (data.vote && data.postVote) {
                console.log(JSON.stringify(data, null, 2));
                console.log('else if (data.vote && data.postVote)');
                let difference = false;

                if (!data.vote.title || !data.postVote.title || data.vote.title != data.postVote.title) difference = true;
                console.log('if (!data.vote.title || !data.postVote.title || data.vote.title != data.postVote.title)');

                if (data.vote.options && data.postVote.options && data.vote.options.length == data.postVote.options.length) {
                    console.log('if (data.vote.options && data.postVote.options && data.vote.options.length == data.postVote.options.length)');
                    for(let i = 0; i < data.vote.options.length; i++) {
                        let voteOption = data.vote.options[i];
                        let postVoteOption = data.postVote.options[i];

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
                        userId: req.session.userId,
                    }).then((vote) => {
                        console.log('.then((vote) =>');
                        data.vote = vote;
                        return data;
                    });
                } else {
                    data.vote = data.postVote;
                    return data;
                }
            } else return data;
        })
        .then((data) => {
            if (data.vote) {
                data.post.voteId = data.vote._id;
            }

            return data.post.save().then(() => {
                console.log(JSON.stringify(data, null, 2));
                return res.status(200).send(data);
            });
        })
        .catch((err) => {
            return next(err);
        });
};

module.exports.delete = () => {

};

/* helpers */

let checkPostIdParams = (req, res, next) => {
    if (!req.params.postId || !req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new Error('Неверный формат идентификатора поста.'));
    }
};
