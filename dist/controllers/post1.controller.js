'use strict';

var _require = require('../models/post1.model'),
    Post = _require.Post;

var _require2 = require('../models/post1.model'),
    Topic = _require2.Topic;

var _require3 = require('../models/post1.model'),
    Comment = _require3.Comment;

var Country = require('../models/country.model');
var User = require('../models/user.model');

var _require4 = require('../models/vote.model'),
    Vote = _require4.Vote;

var _require5 = require('../models/vote.model'),
    Option = _require5.Option;

var querystring = require('querystring');

module.exports.allGet = function (req, res, next) {
    if (req.query.country) {
        Country.findOne({ name: req.query.country }, function (err, country) {
            if (err) return next(err);

            User.find({}, function (err, users) {
                if (err) return next(err);

                var renderPosts = function renderPosts(posts) {
                    var sort = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
                    var sortType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'none';
                    var sortDate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

                    for (var i = 0; i < posts.length; i++) {
                        console.log('i: ' + i);
                        var post = posts[i];
                        for (var j = 0; j < users.length; j++) {
                            var user = users[j];

                            if (post.userId == user._id) {
                                post.user = user;
                                console.log('user: ' + post.user.username);
                                break;
                            }
                        }
                    }

                    return res.render('post/all', { country: country, posts: posts, sort: sort, sortType: sortType, sortDate: sortDate });
                };

                console.log(req.query);

                if (req.query.sort === 'date' && req.query.date) {
                    var date = new Date(req.query.date).withoutTime();

                    console.log('sort: ' + req.query.sort);
                    console.log('date: ' + date);

                    Post.find({ countryId: country._id }, function (err, posts) {
                        if (err) return next(err);

                        var sortedPosts = [];
                        for (var i = 0; i < posts.length; i++) {
                            var post = posts[i];
                            if (post.createdAt.withoutTime().getTime() === date.getTime()) {
                                sortedPosts.push(post);
                            }
                        }

                        renderPosts(sortedPosts, true, 'date', date);
                    });
                } else {
                    Post.find({ countryId: country._id }, function (err, posts) {
                        if (err) return next(err);

                        console.log(posts);

                        renderPosts(posts);
                    });
                }
            });
        });
    }
};

module.exports.allPost = function (req, res) {
    // TODO add country selection from data base
    return res.redirect('/post/all?' + querystring.stringify({ country: req.body.country }));
};

module.exports.newPostGet = function (req, res, next) {
    if (req.session.userId) {
        Country.find({}, function (err, countries) {
            if (err) {
                return next(err);
            }

            if (!req.params.editorType || req.params.editorType === 'simple') {
                return res.render('post/proto', { countries: countries });
            } else if (req.params.editorType === 'advanced') {
                Topic.find({ custom: false }, function (err, topics) {
                    if (err) return next(err);

                    console.log(topics);

                    return res.render('post/advanced', { countries: countries, topics: topics });
                });
            }
        });
    } else {
        res.cookie('return-page', '/post/new');
        return res.redirect('/user/login');
    }
};

module.exports.newPostPost = function (req, res, next) {
    if (req.body.title && req.body.body && req.session.userId && req.body.country) {
        var postData = {
            // TODO: add cleaning html tags from the text
            title: req.body.title,
            body: req.body.body,
            userId: req.session.userId,
            countryId: req.body.country
        };

        if (!req.params.editorType || req.params.editorType === 'simple') {
            postData.editorType = 'simple';

            Post.create(postData, function (err, post) {
                if (err) {
                    return next(err);
                }

                res.redirect('/post/' + post._id);
            });
        } else if (req.params.editorType === 'advanced') {
            console.log('creating post using advanced editor');

            postData.editorType = 'advanced';

            /* post creation */
            var createPost = function createPost(postData) {
                Post.create(postData, function (err, post) {
                    if (err) return next(err);

                    console.log('generated advanced post: ' + post);

                    res.redirect('/post/' + post._id);
                });
            };

            /* topics creation */
            Topic.find({}, function (err, topics) {
                if (err) return next(err);

                console.log('looking for topics...');

                console.log(JSON.stringify(req.body));

                /* custom topics creation */
                postData.topics = [];
                for (var i = 0; i < topics.length; i++) {
                    var topic = topics[i];
                    if (req.body[topic._id]) {
                        postData.topics.push({ topicId: topic._id, body: req.body[topic._id] });
                    }
                }

                console.log('filled topics: ' + JSON.stringify(postData.topics));

                /* vote creation */
                Option.find({}, function (err, options) {
                    console.log('creating vote if needed');
                    if (err) return next(err);

                    console.log('vote theme name: ' + req.body.voteThemeName);

                    console.log('filled vote options: ');
                    var filledVoteOptions = [];
                    for (var _i = 0; _i < options.length; _i++) {
                        var option = options[_i];
                        if (req.body[option._id]) {
                            filledVoteOptions.push({ name: req.body[option._id], votes: 0 });
                            console.log(' - added ' + req.body[option._id]);

                            Option.findByIdAndRemove(option._id, function (err) {
                                if (err) return next(err);
                            });
                        }
                    }

                    console.log('generated post data: ' + JSON.stringify(postData));

                    if (filledVoteOptions.length) {
                        console.log('vote creation...');

                        Vote.create({ title: req.body.voteThemeName, options: filledVoteOptions }, function (err, vote) {
                            if (err) return next(err);

                            console.log('created vote: ' + vote);

                            postData.voteId = vote._id;
                            createPost(postData);
                        });
                    } else {
                        createPost(postData);
                    }
                });
            });
        }
    }
};

module.exports.editPostGet = function (req, res, next) {
    if (req.session.userId && req.params.postId) {
        Post.findById(req.params.postId, function (err, post) {
            if (err) return next(err);

            res.locals.post = post;

            Country.find({}, function (err, countries) {
                if (err) return next(err);

                if (post.editorType === 'simple') {
                    return res.render('post/simple', { countries: countries });
                } else if (post.editorType === 'advanced') {
                    return res.redirect('/user');
                }
            });
        });
    } else {
        res.cookie('return-page', '/post/new');
        return res.redirect('/user/login');
    }
};

module.exports.updatePostPost = function (req, res, next) {
    if (req.session.userId && req.params.postId) {
        Post.findById(req.params.postId, function (err, post) {
            if (err) return next(err);

            if (post.editorType === 'simple') {
                post.title = req.body.title ? req.body.title : post.title;
                post.body = req.body.body ? req.body.body : post.body;
                post.country = req.body.country ? req.body.country : post.country;
                post.save();
                return res.redirect('/user');
            } else if (post.editorType === 'advanced') {
                console.log('todo add advanced editor post editing');
                return res.redirect('/user');
            }
        });
    } else {
        res.cookie('return-page', '/post/new');
        return res.redirect('/user/login');
    }
};

module.exports.removePostPost = function (req, res, next) {
    Post.findById(req.params.postId, function (err, post) {
        if (err) return next(err);

        for (var i = 0; i < post.topics.length; i++) {
            var postTopic = post.topics[i];

            Topic.findById(postTopic.topicId, function (err, topic) {
                if (err) return next(err);

                if (topic.custom) {
                    topic.remove(function (err) {
                        if (err) return next(err);
                    });
                }
            });
        }

        Vote.findByIdAndRemove(post.voteId, function (err) {
            if (err) return next(err);
        });

        post.remove(function (err) {
            if (err) return next(err);

            return res.status(200).send();
        });
    });
};

module.exports.viewPostGet = function (req, res, next) {
    console.log('looking for post...');

    Post.findById(req.params.postId, function (err, post) {
        if (err) {
            console.log('something went wrong');
            return next(err);
        }

        console.log(' - found [' + post.editorType + '] post: ' + post.title);

        User.findById(post.userId, function (err, user) {
            if (err) return next(err);

            console.log(' - found user: ' + user.username);

            Country.findById(post.countryId, function (err, country) {
                if (err) return next(err);

                console.log(' - found country: ' + country.name);

                if (post.editorType === 'advanced') {
                    console.log(' - looking for topics...');

                    Topic.find({}, function (err, topics) {
                        if (err) return next(err);

                        console.log(' - found ' + topics.length + ' topics in db');
                        console.log(' - found ' + post.topics.length + ' topics attached to post');

                        var preparedTopics = [];
                        for (var i = 0; i < post.topics.length; i++) {
                            var postTopic = post.topics[i];

                            for (var j = 0; j < topics.length; j++) {
                                var topic = topics[j];

                                if (postTopic.topicId == topic._id) {
                                    preparedTopics.push({ _id: topic._id, title: topic.name, body: postTopic.body });
                                    break;
                                }
                            }
                        }

                        console.log(' - prepared ' + preparedTopics.length + ' topics to render in post');

                        var renderPost = function renderPost(props) {
                            console.log(' + rendering post');
                            return res.render('post/post', props);
                        };

                        var props = { post: post, user: user, country: country, topics: preparedTopics };

                        if (post.voteId) {
                            console.log('detected vote added to the post, performing search in db');
                            props.voteId = post.voteId;
                        }
                        renderPost(props);
                    });
                } else {
                    console.log(JSON.stringify(post.topics));
                    return res.render('post/post', { post: post, user: user, country: country, topics: post.topics });
                }
            });
        });
    });
};

/* post image upload */
var path = require('path');
var mkdirp = require('mkdirp');
var uniqid = require('uniqid');

module.exports.uploadPost = function (req, res, next) {
    console.log('upload started');

    if (!req.files) {
        return res.status(400).send('No files uploaded!');
    }

    if (!req.body.dir || !req.body.filename) {
        return res.status(400).send('Invalid dir or filename!');
    }

    var file = req.files.file;
    var dir = req.body.dir;
    var filename = req.body.filename;

    console.log('file', file, 'dir', dir, 'filename', filename);

    var filepath = path.join(__dirname, '..', '..', 'public', dir, filename);
    var dirname = path.dirname(filepath);

    mkdirp(dirname, function (err) {
        if (err) return next(err);

        console.log('Storing user file at: ' + filepath);

        file.mv(filepath, function (err) {
            if (err) return next(err);
            return res.sendStatus(204);
        });
    });
};

module.exports.keyPost = function (req, res, next) {
    if (req.body.filename) {
        var date = new Date();
        var day = date.toISOString().slice(0, 10);
        var time = date.getTime();
        var filename = uniqid() + '-' + time + '-' + req.body.filename;

        return res.status(200).send({ dir: 'post_files/' + day + '/', filename: filename });
    } else {
        return res.status(400).send('invalid filename');
    }
};

module.exports.topicAllGet = function (req, res, next) {
    Topic.find({}, function (err, topics) {
        if (err) return next(err);

        return res.render('topic/all', { topics: topics });
    });
};

module.exports.topicNewGet = function (req, res, next) {
    return res.render('topic/new');
};

module.exports.topicEditGet = function (req, res, next) {
    Topic.findById(req.params.topicId, function (err, topic) {
        if (err) return next(err);

        return res.render('topic/edit', { topic: topic });
    });
};

module.exports.topicCreatePost = function (req, res, next) {
    if (req.body.name) {
        Topic.create({ name: req.body.name }, function (err, topic) {
            if (err) return next(err);

            return res.redirect('/post/topic/all');
        });
    }
};

module.exports.topicCreateCustomPost = function (req, res, next) {
    if (req.body.name) {
        // TODO: add cleaning tags from html
        Topic.create({ name: req.body.name, custom: true }, function (err, topic) {
            if (err) return next(err);

            return res.send(topic);
        });
    }
};

module.exports.topicUpdatePost = function (req, res, next) {
    console.log(req.params.topicId);
    if (req.params.topicId && req.body.name) {
        Topic.findById(req.params.topicId, function (err, topic) {
            if (err) return next(err);

            topic.name = req.body.name;
            topic.custom = req.body.isCustom ? req.body.isCustom : topic.custom;
            topic.save();

            return res.status(200).send(topic);
        });
    }
};

module.exports.topicRemovePost = function (req, res, next) {
    if (req.params.topicId) {
        Topic.findByIdAndRemove({ _id: req.params.topicId }, function (err, topic) {
            if (err) return next(err);

            topic.name = req.params.name;

            return res.redirect('/post/topic/all');
        });
    }
};

module.exports.testNewPost = function (req, res, next) {
    if (req.body.markers) {
        req.body.markers.forEach(function (marker) {
            console.log(JSON.stringify(marker));
        });
        return res.status(200).send({ markers: req.body.markers });
    }
};