const sanitizeHtml = require('sanitize-html');

const {Post} = require('../models/post.model.js');

/* GET */

module.exports.new = (req, res, next) => {
    checkUserLogin(req, res, next);

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

    Post.findById(req.params.postId).exec().then((post, err) => {
        console.log(JSON.stringify(post));
        if (post && post.userId == req.session.userId) return res.render('post/edit', {post: post});
        else return next(new Error('Такого черновика либо не существует, либо у вас нет прав для его просмотра.'));
    }).catch((err) => {
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

    postData.title = sanitizeHtml(postData.title);
    postData.description = sanitizeHtml(postData.description);

    for (let i = 0; i < postData.markers.length; i++) {
        let marker = postData.markers[i];

        marker.header = sanitizeHtmlWithOptions(marker.header);
        marker.body = sanitizeHtmlWithOptions(marker.body);
    }

    Post.findByIdAndUpdate(req.params.postId, postData).exec().then((post) => {
        return res.status(200).send(postData);
    }).catch((err) => {
        return next(err);
    });
};

module.exports.delete = () => {

};

/* helpers */

let checkUserLogin = (req, res, next) => {
    if (!req.session.userId) {
        // TODO: add user checking according to new user controller
        return res.redirect('/user/login');
    }
};

let checkPostIdParams = (req, res, next) => {
    if (!req.params.postId || !req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new Error('Неверный формат идентификатора поста.'));
    }
};

let defaultCheck = (req, res, next) => {
    checkUserLogin(req, res);
    checkPostIdParams(req, res, next);
};
