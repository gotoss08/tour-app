const querystring = require('querystring');
const Post = require('../models/post.model');
const Country = require('../models/country.model');
const User = require('../models/user.model');

module.exports.allGet = (req, res) => {
    return res.render('post/all', { country: req.query.country });
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

            // TODO remove crap from choose editor route controller
            if (req.params.editorType && (req.params.editorType === 'simple' || req.params.editorType === 'advanced')) {
                console.log(req.params.editorType);

                if (req.params.editorType === 'simple')
                    return res.render('post/simple', { countries: countries });
                if (req.params.editorType === 'advanced')
                    return res.render('post/advanced', { countries: countries });
            }

            return res.render('post/simple', { countries: countries });
        });
    } else {
        res.cookie('return-page', '/post/new');
        return res.redirect('/user/login');
    }
};

module.exports.newPostPost = (req, res, next) => {
    if (req.body.title && req.body.body && req.body.country) {
        const postData = {
            title: req.body.title,
            body: req.body.body,
            userId: req.session.userId,
            countryId: req.body.country
        };

        console.log(postData);

        Post.create(postData, (err, post) => {
            if(err) {
                return next(err);
            }

            res.redirect('/post/' + post._id);
        });
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
        if (err) return next(err);
        console.log(post);

        User.findById(post.userId).exec((err, user) => {
            if (err) return next(err);
            console.log(user);

            Country.findById(post.countryId).exec((err, country) => {
                if (err) return next(err);
                console.log(country);

                return res.render('post/post', { post: post, user: user, country: country });
            });
        });
    });

    // Post.findById(postId, (err, post) => {
    //     if(err) {
    //         return next(err);
    //     }
    //
    //     if(post) {
    //         Country.findById(post.countryId, (err, country) => {
    //             if (err) {
    //                 return next(err);
    //             }
    //
    //         });
    //     } else {
    //         console.log('cannot find post with that id.');
    //     }
    // });
};