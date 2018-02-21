const { Post } = require('../models/post.model');
const { Topic } = require('../models/post.model');
const Comment = require('../models/post.model').Comment;

const Country = require('../models/country.model');
const User = require('../models/user.model');

const { Vote } = require('../models/vote.model');
const { Option } = require('../models/vote.model');

const querystring = require('querystring');

module.exports.allGet = (req, res, next) => {
    if(req.query.country) {
        Country.findOne({ name: req.query.country }, (err, country) => {
            if(err) return next(err);

            User.find({}, (err, users) => {
                if(err) return next(err);

                renderPosts = (posts, sort=false, sortType='none', sortDate=null) => {
                    for(let i = 0; i < posts.length; i++) {
                        console.log('i: ' + i);
                        let post = posts[i];
                        for(let j = 0; j < users.length; j++) {
                            let user = users[j];

                            if(post.userId == user._id) {
                                post.user = user;
                                console.log('user: ' + post.user.username);
                                break;
                            }
                        }
                    }

                    return res.render('post/all', { country: country, posts: posts, sort: sort, sortType: sortType, sortDate: sortDate });
                };

                console.log(req.query);

                if(req.query.sort === 'date' && req.query.date) {

                    let date = new Date(req.query.date).withoutTime();

                    console.log('sort: ' + req.query.sort);
                    console.log('date: ' + date);

                    Post.find({ countryId: country._id }, (err, posts) => {
                        if(err) return next(err);

                        let sortedPosts = [];
                        for(let i = 0; i < posts.length; i++) {
                            let post = posts[i];
                            if(post.createdAt.withoutTime().getTime() === date.getTime()) {
                                sortedPosts.push(post);
                            }
                        }

                        renderPosts(sortedPosts, true, 'date', date);
                    });
                } else {
                    Post.find({ countryId: country._id }, (err, posts) => {
                        if(err) return next(err);

                        console.log(posts);

                        renderPosts(posts);
                    });
                } 
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
    if(req.body.title && req.body.body && req.session.userId && req.body.country) {
        if (!req.params.editorType || req.params.editorType === 'simple') {
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
        } else if (req.params.editorType === 'advanced') {
            /* post creation */
            let createPost = (postData) => {
                Post.create(postData, (err, post) => {
                    if (err) return next(err);

                    console.log('advanced post: ' + post);

                    res.redirect('/post/' +  post._id);
                });
            };
            
            /* vote creation */
            Topic.find({}, (err, topics) => {
                if(err) return next(err);

                /* custom topics creation */
                let filledTopics = [];
                for (var i = 0; i < topics.length; i++) {
                    let topic = topics[i];
                    if (req.body[topic._id]) {
                        filledTopics.push({ topicId: topic._id, body: req.body[topic._id] });
                    }
                }

                console.log('filled topics: ' + filledTopics);

                Option.find({}, (err, options) => {
                    if(err) return next(err);

                    /* vote creation */
                    console.log('vote theme name: ' + req.body.voteThemeName);

                    let filledVoteOptions = [];
                    for(var i = 0; i < options.length; i++) {
                        let option = options[i];
                        if(req.body[option._id]) {
                            filledVoteOptions.push({ name: req.body[option._id], votes: 0 });
                            console.log('vote option: ' + req.body[option._id]);
                        }
                    }

                    const postData = {
                        title: req.body.title,
                        body: req.body.body,
                        userId: req.session.userId,
                        countryId: req.body.country,
                        editorType: 'advanced'
                    };

                    if(filledVoteOptions.length) {
                        Vote.create({ title: req.body.voteThemeName, options: filledVoteOptions }, (err, vote) => {
                            if(err) return next(err);

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

                        renderPost = (props) => {
                            return res.render('post/post', props);
                        };

                        let props = { post: post, user: user, country: country, topics: preparedTopics };

                        if(post.voteId) {
                            Vote.findById(post.voteId, (err, vote) => {
                                props.vote = vote;
                                renderPost(props);
                            });
                        } else renderPost(props);
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
