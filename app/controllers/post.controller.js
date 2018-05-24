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
            return User.findById(data.post.userId).exec().then((user) => {
                data.username = user.username;
                data.mapHelpReadStatus = user.mapHelpReadStatus;
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

                let data = {post: post, voteAttached: false};
                return data;
            } else if (req.session && req.session.userId && req.session.userId == post.userId) {
                return res.redirect(`/p/${post._id}/edit`);
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

module.exports.countrySearch = (req, res, next) => {
    Post.find({posted: true}).exec()
        .then((posts) => {
            data = {preparedPosts: []};
            posts.forEach((post) => {
                if (post.countries && post.countries.length) {
                    data.preparedPosts.push({
                        countries: Array.from(post.countries),
                    });
                }
            });
            return data;
        })
        .then((data) => {
            return Country.find().exec().then((countries) => {
                data.countries = [];
                countries.forEach((country) => {
                    data.countries.push({
                        id: country._id,
                        name: country.name,
                    });
                });
                return data;
            });
        })
        .then((data) => {
            data.preparedPosts.forEach((post) => {
                let postCountryIds = [];
                post.countries.forEach((country) => {
                    postCountryIds.push(new mongoose.Types.ObjectId(country));
                });
                post.preparedCountries = [];
                postCountryIds.forEach((postCountryId) => {
                    data.countries.forEach((country) => {
                        let countryId = country.id;

                        if (postCountryId.equals(countryId)) {
                            post.preparedCountries.push({
                                id: country.id,
                                name: country.name,
                            });
                        }
                    });
                });
            });
            return data;
        })
        .then((data) => {
            let countries = [];
            data.preparedPosts.forEach((post) => {
                if (post.preparedCountries && post.preparedCountries.length) {
                    post.preparedCountries.forEach((preparedCountry) => {
                        let alreadyContainsCountry = false;
                        countries.forEach((country) => {
                            if (country.id == preparedCountry.id) alreadyContainsCountry = true;
                        });
                        if (!alreadyContainsCountry) countries.push(preparedCountry);
                    });
                }
            });

            data = {};
            data.countries = countries;
            data.country = '';
            if (req.params.countryId) data.country = req.params.countryId;

            console.log(`final data: ${JSON.stringify(data, null, 2)}`);

            return res.render('post/country', data);
        })
        .catch((err) => {
            return next(err);
        });
};

/* POST */

module.exports.searchPostsByCountry = (req, res, next) => {
    if (!req.body.countries || !req.body.countries.length) return res.sendStatus(400);

    let page = 1;
    if (req.body.page) page = req.body.page;
    let itemsPerPage = 10;

    Post.find({posted: true, countries: {$all: req.body.countries}}).sort({createdAt: '-1'}).skip((page-1) * itemsPerPage).limit(itemsPerPage).exec()
        .then((posts) => {
            data = {posts: posts, preparedPosts: []};
            data.posts.forEach((post) => {
                data.preparedPosts.push({
                    id: post._id.toString(),
                    title: post.title,
                    body: post.body,
                    uniqIpsVisited: post.uniqIpsVisited.length,
                    totalVisitCount: post.totalVisitCount,
                    likes: post.likes.length,
                    countries: Array.from(post.countries),
                    userId: post.userId,
                    postedAt: new Date(post.createdAt.getTime()),
                    editedAt: new Date(post.updatedAt.getTime()),
                });
            });
            return data;
        })
        .then((data) => {
            return Country.find().exec().then((countries) => {
                data.countries = [];
                countries.forEach((country) => {
                    data.countries.push({
                        id: country._id,
                        name: country.name,
                    });
                });
                return data;
            });
        })
        .then((data) => {
            data.preparedPosts.forEach((post) => {
                let postCountryIds = [];
                post.countries.forEach((country) => {
                    postCountryIds.push(new mongoose.Types.ObjectId(country));
                });
                post.preparedCountries = [];
                postCountryIds.forEach((postCountryId) => {
                    data.countries.forEach((country) => {
                        let countryId = country.id;

                        if (postCountryId.equals(countryId)) {
                            post.preparedCountries.push({
                                id: country.id,
                                name: country.name,
                            });
                        }
                    });
                });
            });
            return data;
        })
        .then((data) => {
            return res.status(200).send({posts: data.preparedPosts});
        })
        .catch((err) => {
            console.error(err);
            return res.sendStatus(400);
        });
};

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
            if (postData.posted) {
                post.posted = postData.posted;
                post.createdAt = new Date();
            };

            post.title = '';
            if (postData.title) post.title = sanitizeHtml(postData.title);

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

            return Country.find().exec()
                .then((countries) => {
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

            return data.post.save().then(() => {
                return res.status(200).send(data);
            });
        })
        .catch((err) => {
            console.error(err);
            return res.sendStatus(400);
        });
};

module.exports.hide = (req, res, next) => {
    if (!util.checkUserLogin(req, res, next)) {
        res.status(401).send();
        return next(new Error('Для этого действия необходима авторизация в аккаунте.'));
    }
    checkPostIdParams(req, res, next);

    Post.findById(req.params.postId).exec().
        then((post) => {
            post.posted = false;
            return post.save().then(() => {
                return res.sendStatus(200);
            });
        })
        .catch((err) => {
            console.error(err);
            return res.sendStatus(400);
        });
};

module.exports.remove = (req, res, next) => {
    if (!util.checkUserLogin(req, res, next)) {
        let errorMessage = 'Для этого действия необходима авторизация в аккаунте.';
        res.status(401).send(errorMessage);
        return next(new Error(errorMessage));
    }
    checkPostIdParams(req, res, next);
    Post.findById(req.params.postId).exec()
        .then((post) => {
            if (!post) return res.sendStatus(400);
            if (post.userId == req.session.userId) {
                let data = {post: post};
                return data;
            } else throw new Error('Невозможно удалить чужую заметку.');
        })
        .then((data) => {
            return Post.find({posted: true}).exec().then((posts) => {
                let countryIds = [];
                let countries = {};
                posts.forEach((post) => {
                    post.countries.forEach((postCountryId) => {
                        if (countryIds.indexOf(postCountryId) == -1) {
                            countryIds.push(postCountryId);
                            countries[postCountryId] = 1;
                        } else countries[postCountryId] += 1;
                    });
                });
                countryIds.forEach((countryId, index) => {
                    if (data.post.countries.indexOf(countryId) == -1) countryIds.splice(countryIds.indexOf(countryId), 1);
                });
                data.toRemoveCountries = [];
                countryIds.forEach((countryId) => {
                    if (countries[countryId] == 1) data.toRemoveCountries.push(countryId);
                });
                return data;
            });
        })
        .then((data) => {
            return Country.remove({_id: {$all: data.toRemoveCountries}}).exec().then(() => {
                return data;
            });
        })
        .then((data) => {
            data.post.remove();
            return res.sendStatus(200);
        })
        .catch((err) => {
            console.error(err);
            return res.sendStatus(400);
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
