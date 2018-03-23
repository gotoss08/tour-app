const sanitizeHtml = require('sanitize-html');
const mongoose = require('mongoose');

const util = require('../util/util.js');

const {Post} = require('../models/post.model.js');
const {Vote} = require('../models/vote.model.js');
const User = require('../models/user.model');
const Country = require('../models/country.model.js');

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

module.exports.read = (req, res, next) => {
    checkPostIdParams(req, res, next);

    let clientIp = req.clientIp;

    Post.findById(req.params.postId).exec()
        .then((post) => {
            if (post && post.posted) {
                /* update post visit counters */
                if (post.uniqIpsVisited.indexOf(clientIp) == -1) post.uniqIpsVisited.push(clientIp);
                post.totalVisitCount+=1;
                post.save();

                /* check for user liked this post */
                post.currentUserLiked = false;
                if (req.session && req.session.userId) {
                    post.currentUserLiked = post.likes.filter((likedUserId) => {
                        return likedUserId == req.session.userId;
                    }).length != 0;
                }

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
            data.countries = [];
            if (data.post.countries && data.post.countries.length) {
                let countryIds = [];
                for (let i = 0; i < data.post.countries.length; i++) {
                    let country = data.post.countries[i];
                    countryIds.push(new mongoose.Types.ObjectId(country));
                }
                return Country.find({_id: {$in: countryIds}}).exec().then((countries) => {
                    data.countries = countries;
                    return data;
                });
            } else return data;
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

module.exports.findByCountries = (req, res, next) => {
    return res.send('find by countries ' + req.body);
};

/* POST */

module.exports.update = (req, res, next) => {
    if (!util.checkUserLogin(req, res, next)) {
        res.status(401).send();
        return next(new Error('Для этого действия необходима авторизация в аккаунте.'));
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
            if (postData.body) post.body = sanitizeHtmlWithOptions(postData.body);

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
            if (!data.vote && data.postVote && data.post.voteId) {
                return Vote.findByIdAndRemove(data.post.voteId).then(() => {
                    data.post.voteId = '';
                    return data;
                });
            } else if (data.vote && !data.postVote) {
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
                let difference = false;

                if (!data.vote.title || !data.postVote.title || data.vote.title != data.postVote.title) difference = true;

                if (data.vote.options && data.postVote.options && data.vote.options.length == data.postVote.options.length) {
                    for(let i = 0; i < data.vote.options.length; i++) {
                        let voteOption = data.vote.options[i];
                        let postVoteOption = data.postVote.options[i];

                        if (voteOption.title != postVoteOption.title) difference = true;
                    }
                } else difference = true;

                if (difference) {
                    return Vote.create({
                        title: data.vote.title,
                        options: data.vote.options,
                        userId: req.session.userId,
                    }).then((vote) => {
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
            if (!postData.countries || postData.countries.length < 1) return data;

            console.log('received countries from client: ' + JSON.stringify(postData.countries, null, 2));
            return Country.find().exec()
                .then((countries) => {
                    console.log('loaded countries from db: ' + JSON.stringify(countries, null, 2));

                    data.post.countries = [];
                    data.preparedCountries = [];

                    if (!countries || countries.length < 1) {
                        for (let i = 0; i < postData.countries.length; i++) {
                            data.preparedCountries.push({name: postData.countries[i]});
                        }
                    } else {
                        for (let i = 0; i < postData.countries.length; i++) {
                            let receivedCountry = postData.countries[i];
                            let found = false;

                            for (let j = 0; j < countries.length; j++) {
                                let countryInDb = countries[j];

                                if (String(countryInDb.name).toUpperCase() === String(receivedCountry).toUpperCase()) {
                                    data.post.countries.push(countryInDb._id);

                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                data.preparedCountries.push({name: receivedCountry});
                            }
                        }
                    }

                    console.log('prepared countries: ' + JSON.stringify(data.preparedCountries, null, 2));
                    return data;
                })
                .then((data) => {
                    return Country.create(data.preparedCountries).then((countries) => {
                        if (countries) {
                            for (let i = 0; i < countries.length; i++) {
                                data.post.countries.push(countries[i]._id);
                            }
                        }
                        return data;
                    });
                });
        })
        .then((data) => {
            if (data.vote) {
                data.post.voteId = data.vote._id;
            }

            console.log('data: ' + JSON.stringify(data, null, 2));

            return data.post.save().then(() => {
                return res.status(200).send(data);
            });
        })
        .catch((err) => {
            return next(err);
        });
};

module.exports.remove = (req, res, next) => {
    if (!util.checkUserLogin(req, res, next)) {
        let errorMessage = 'Для этого действия необходима авторизация в аккаунте.';
        res.status(401).send(errorMessage);
        return next(new Error(errorMessage));
    }
    checkPostIdParams(req, res, next);
    Post.findById(req.params.postId).exec().then((post) => {
        if (!post) return res.sendStatus(400);
        if (post.userId == req.session.userId) {
            post.remove();
            return res.sendStatus(200);
        } else {
            return res.sendStatus(400);
        }
    });
};

module.exports.like = (req, res, next) => {
    if (!util.checkUserLogin(req, res, next)) {
        let errorMessage = 'Для этого действия необходима авторизация в аккаунте.';
        res.status(401).send(errorMessage);
        return next(new Error(errorMessage));
    }
    checkPostIdParams(req, res, next);

    Post.findById(req.params.postId).exec()
        .then((post) => {
            if (!post) return res.sendStatus(400);
            let currentUserId = req.session.userId;
            let currentUserAlreadyLiked = post.likes.indexOf(currentUserId) != -1;

            if (!currentUserAlreadyLiked) post.likes.push(currentUserId);
            else post.likes.splice(post.likes.indexOf(currentUserId), 1);

            post.save();
            return res.status(200).send({likes: post.likes, userJustLiked: !currentUserAlreadyLiked});
        });
};

/* helpers */

let checkPostIdParams = (req, res, next) => {
    if (!req.params.postId || !req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new Error('Неверный формат идентификатора поста.'));
    }
};
