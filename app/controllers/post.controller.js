const sanitizeHtml = require('sanitize-html');

const util = require('../util/util.js');

const {Post} = require('../models/post.model.js');
const {Vote} = require('../models/vote.model.js');

/* GET */

module.exports.new = (req, res, next) => {
    util.checkUserLogin(req, res, next);

    Post.create({
        userId: req.session.userId,
    }).then((post) => {
        return res.redirect('/p/' + post._id + '/edit');
    }).catch((err) => {
        if (err) return next(err);
    });
};

module.exports.edit = (req, res, next) => {
    defaultCheck(req, res, next);

    Post.findById(req.params.postId).exec()
        .then((post) => {
            console.log(JSON.stringify(post));
            if (post && post.userId == req.session.userId) {
                let data = {post: post, voteAttached: false};
                return data;
            } else {
                return next(new Error('Такого черновика либо не существует, либо у вас нет прав для его просмотра.'));
            }
        })
        .then((data) => {
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

module.exports.read = () => {

};

module.exports.update = (req, res, next) => {
    defaultCheck(req, res, next);

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

    console.log('vote: ' + (postData.vote ? 'is' : 'none'));

    Post.findById(req.params.postId).exec()
        .then((post) => {
            post.title = sanitizeHtml(postData.title);
            post.subtitle = sanitizeHtml(postData.subtitle);
            post.body = sanitizeHtml(postData.body);

            if (postData.markers) {
                for (let i = 0; i < postData.markers.length; i++) {
                    let marker = postData.markers[i];

                    marker.header = sanitizeHtmlWithOptions(marker.header);
                    marker.body = sanitizeHtmlWithOptions(marker.body);
                }
            }

            post.markers = postData.markers;

            let data = {post: post};
            data.vote = postData.vote;

            if (post.voteId) {
                return Vote.findByIdAndRemove(post.voteId).then(() => {
                    console.log('>>>>>>>>> found by id and removed');
                    return data;
                });
            } else return data;
        })
        .then((data) => {
            if (data.vote) {
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
            } else return data;
        })
        .then((data) => {
            if (data.vote) {
                data.post.voteId = data.vote._id;
                return data.post.save().then(() => {
                    console.log(JSON.stringify(data, null, 2));
                    return res.status(200).send(data);
                });
            } else {
                console.log(JSON.stringify(data, null, 2));
                return res.status(200).send(data);
            }
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

let defaultCheck = (req, res, next) => {
    util.checkUserLogin(req, res);
    checkPostIdParams(req, res, next);
};
