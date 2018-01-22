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
    console.log('post post');
    if (req.body.title && req.body.body && req.body.country) {
        console.log('post post');

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
};

const fs = require('fs');
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