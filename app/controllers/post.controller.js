const { Post } = require('../models/post.model');
const { Topic } = require('../models/post.model');
const Comment = require('../models/post.model').Comment;

const Country = require('../models/country.model');
const User = require('../models/user.model');

const querystring = require('querystring');

module.exports.allGet = (req, res, next) => {
    if(req.query.country) {
        Country.findOne({ name: req.query.country }, (err, country) => {
            if(err) return next(err);

            Post.find({ countryId: country._id }, (err, posts) => {
                if(err) return next(err);

                console.log('posts count: ' + posts.length);

                return res.render('post/all', { country: country, posts: posts });
            });
        });
    }
};

module.exports.allPost = (req, res) => {
    // TODO add country selection from data base
    return res.redirect('/post/all?' + querystring.stringify({ country: req.body.country }));
};

module.exports.newPostGet = (req, res, next) => {
    if(req.session.userId) {
        Country.find({}, (err, countries) => {
            if (err) {
                return next(err);
            }

            if (!req.params.editorType || req.params.editorType === 'simple') {
                return res.render('post/simple', { countries: countries });
            } else if (req.params.editorType === 'advanced') {
                Topic.find({ custom: false }, (err, topics) => {
                    if (err) return next(err);

                    return res.render('post/advanced', { countries: countries, topics: topics });
                });
            }
        });
    } else {
        res.cookie('return-page', '/post/new');
        return res.redirect('/user/login');
    }
};

module.exports.newPostPost = (req, res, next) => {
    if(req.session.userId) {
        if (!req.params.editorType || req.params.editorType === 'simple') {
            if (req.body.title && req.body.body && req.body.country) {
                const postData = {
                    title: req.body.title,
                    body: req.body.body,
                    userId: req.session.userId,
                    countryId: req.body.country
                };

                Post.create(postData, (err, post) => {
                    if(err) {
                        return next(err);
                    }

                    res.redirect('/post/' + post._id);
                });
            }
        } else if (req.params.editorType === 'advanced') {
            Topic.find({}, (err, topics) => {
                if(err) return next(err);

                let filledTopics = [];
                for (var i = 0; i < topics.length; i++) {
                    let topic = topics[i];
                    if (req.body[topic._id]) {
                        filledTopics.push({ topicId: topic._id, body: req.body[topic._id] });
                    }
                }

                console.log('filled topics: ' + filledTopics);

                const postData = {
                    title: req.body.title,
                    body: req.body.body,
                    userId: req.session.userId,
                    countryId: req.body.country,
                    editorType: 'advanced',
                    topics: filledTopics
                };

                Post.create(postData, (err, post) => {
                    if (err) return next(err);

                    console.log('advanced post: ' + post);

                    res.redirect('/post/' +  post._id);
                });
            });
        }
    }
};

module.exports.editPostGet = (req, res, next) => {

    if(req.session.userId && req.params.postId) {
        Post.findById(req.params.postId, (err, post) => {
            if (err) return next(err);

            res.locals.post = post;

            Country.find({}, (err, countries) => {
                if (err) return next(err);

                return res.render('post/new', { countries: countries });
            });
        });
    } else {
        res.cookie('return-page', '/post/new');
        return res.redirect('/user/login');
    }
};

module.exports.removePostGet = (req, res, next) => {
    Post.findByIdAndRemove(req.params.postId, (err) => {
        if (err) return next(err);
        console.log('post removed');
        return res.redirect('back');
    });
};

module.exports.viewPostGet = (req, res, next) => {
    Post.findById(req.params.postId, (err, post) => {
        if (err) {
            console.log('some goes wrong');
            return next(err);
        }

        User.findById(post.userId).exec((err, user) => {
            if (err) return next(err);
            console.log(user);

            Country.findById(post.countryId).exec((err, country) => {
                if (err) return next(err);
                console.log(country);

                console.log('editor type:' + post.editorType);

                if (post.editorType === 'advanced') {
                    Topic.find({}, (err, topics) => {
                        if (err) return next(err);

                        let preparedTopics = [];
                        for(var i = 0; i < topics.length; i++) {
                            var topic = topics[i];
                            preparedTopics[topic._id] = topic.name;
                        }

                        return res.render('post/post', { post: post, user: user, country: country, topics: preparedTopics });
                    });
                } else {
                    return res.render('post/post', { post: post, user: user, country: country });
                }
            });
        });
    });
};

const path = require('path');
const mkdirp = require('mkdirp');

module.exports.uploadPost = (req, res, next) => {
    if (!req.files) {
        next(new Error('No files were uploaded'));
        return res.status(400).send('No files were uploaded');
    }
    if (!req.body.dir || !req.body.filename) {
        next(new Error('Missing directory path or filename'));
        return res.status(400).send('Missing directory path or filename');
    }

    let file = req.files.file;
    let filepath = path.join(__dirname, '..', '..', 'public', req.body.dir, req.body.filename);
    let dirname = path.dirname(filepath);

    mkdirp(dirname, function (err) {
        if (err) return next(err);

        console.log('Storing user file at: ' + filepath);

        file.mv(filepath, (err) => {
            if (err) return next(err);
            return res.sendStatus(204);
        });
    });
};

module.exports.keyPost = (req, res, next) => {
    if (req.body.filename) {
        let date, day, time;
        date = new Date();
        day = date.toISOString().slice(0, 10);
        time = date.getTime();

        return res.status(200).send({ dir: 'post_files/' + day + '/', filename: time + '-' + req.body.filename });
    } else {
        return res.status(400).send({ error: 'invalid filename' });
    }
};

module.exports.topicAllGet = (req, res, next) => {
    Topic.find({}, (err, topics) => {
        if (err) return next(err);

        return res.render('topic/all', { topics: topics });
    });
};

module.exports.topicNewGet = (req, res, next) => {
    return res.render('topic/new');
};

module.exports.topicEditGet = (req, res, next) => {
    Topic.findById(req.params.topicId, (err, topic) => {
        if (err) return next(err);

        return res.render('topic/edit', { topic: topic });
    });
};

module.exports.topicCreatePost = (req, res, next) => {
    if (req.body.name) {
        Topic.create({ name: req.body.name }, (err, topic) => {
            if (err) return next(err);

            return res.redirect('/post/topic/all');
        });
    }
};

module.exports.topicCreateCustomPost = (req, res, next) => {
    if (req.body.name) {
        Topic.create({ name: req.body.name, custom: true }, (err, topic) => {
            if (err) return next(err);

            return res.send(topic);
        });
    }
};

module.exports.topicUpdatePost = (req, res, next) => {
    console.log(req.params.topicId);
    if (req.params.topicId && req.body.name) {
        Topic.findById(req.params.topicId, (err, topic) => {
            if (err) return next(err);

            console.log('custom: ' + req.body.isCustom);

            topic.name = req.body.name;
            topic.custom = req.body.isCustom;

            topic.save();

            return res.redirect('/post/topic/all');
        });
    }
};

module.exports.topicRemovePost = (req, res, next) => {
    if (req.params.topicId) {
        Topic.findByIdAndRemove({ _id: req.params.topicId }, (err, topic) => {
            if (err) return next(err);

            topic.name = req.params.name;

            return res.redirect('/post/topic/all');
        });
    }
};
