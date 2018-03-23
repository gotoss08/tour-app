const request = require('request');
const querystring = require('querystring');

const path = require('path');
const mkdirp = require('mkdirp');
const uniqid = require('uniqid');

const mongoose = require('mongoose');

const User = require('../models/user.model');
const Post = require('../models/post.model').Post;
const Country = require('../models/country.model.js');

module.exports.isUsernameAlreayTaken = (req, res, next) => {
    if (!req.body.username) return res.sendStatus(400);
    console.log('request');

    User.findOne({username: req.body.username}).exec().then((user) => {
        if (!user) res.status(200).send('free');
        else res.status(200).send('taken');
    });
};

module.exports.isEmailAlreayTaken = (req, res, next) => {
    if (!req.body.email) return res.sendStatus(400);
    console.log('request');

    User.findOne({email: req.body.email}).exec().then((user) => {
        if (!user) res.status(200).send('free');
        else res.status(200).send('taken');
    });
};

module.exports.userRegisterGet = (req, res) => {
    return res.render('user/register');
};

module.exports.userRegisterPost = (req, res, next) => {
    if (!req.body.username || !req.body.email || !req.body.password) return res.status(400).send('Не найдено пользовательской информации.');

    /* process user info */
    const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
    };

    if (req.files && req.files.avatar) {
        /* process files */
        let file = req.files.avatar;
        let filename = uniqid() + '-' + file.name;
        let localFilepath = path.join('user_files', 'avatars', filename);
        let filepath = path.join(__dirname, '..', '..', 'public', localFilepath);
        let dirname = path.dirname(filepath);

        mkdirp(dirname, function(err) {
            if (err) return next(err);

            file.mv(filepath, (err) => {
                if (err) return next(err);
            });
        });

        avatarAttached = true;

        userData.avatarPath = '/' + localFilepath.replace(/\\/g, '/');
    };

    console.log('user data: ' + JSON.stringify(userData, null, 2));

    User.create(userData, (err, user) => {
        if (err) return next(err);

        User.authenticate(userData.username, userData.password, (err, user) => {
            if (err || !user) {
                next(err);
                return res.status(401).send('Такое имя пользователя или пароль не найдены.');
            }

            req.session.userId = user._id;
            return res.sendStatus(200);
        });
    });
};

module.exports.userLoginGet = (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/user/me');
    } else {
        return res.render('user/login');
    }
};

module.exports.userLoginPost = (req, res, next) => {
    if (req.body.username && req.body.password) {
        User.authenticate(req.body.username, req.body.password, (err, user) => {
            if (err || !user) return res.status(401).send('Неверное имя пользователя или пароль.');
            req.session.userId = user._id;
            return res.sendStatus(200);
        });
    } else return res.status(401).send('Поля с именем пользователя или паролем пусты!');
};

module.exports.getCurrentUser = (req, res, next) => {
    if (req.session && req.session.userId) {
        User.findById(req.session.userId, (err, user) => {
            if (err) return next(err);
            if (!user) {
                const unauthorizedError = new Error('Вы должны авторизоваться в системе, перед тем как просматривать свой профиль!');
                unauthorizedError.status = 401;
                return next(unauthorizedError);
            }

            Post.find({userId: user._id, posted: true}, (err, posts) => {
                if (err) return next(err);
                return res.render('user/profile', {user: user, posts: posts});
            });
        });
    } else {
        return next(new Error('Вы должны авторизоваться в системе, перед тем как просматривать свой профиль!'));
    }
};

module.exports.getUser = (req, res, next) => {
    User.findOne({username: req.params.userName}).exec()
        .then((user) => {
            if (!user) throw new Error('Не удалось найти пользователя: ' + req.params.userName);
            let data = {};
            data.user = user;
            return data;
        })
        .then((data) => {
            return Post.find({userId: data.user._id, posted: true}).exec().then((posts) => {
                if (posts && posts.length) data.posts = posts;
                else data.posts = [];
                return data;
            });
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
            data.posts.forEach((post) => {
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
            data.currentUser = false;
            if (req.session && req.session.userId && data.user._id.toString() == req.session.userId) data.currentUser = true;
            return res.render('user/profile', data);
        })
        .catch((err) => {
            if (err) return next(err);
        });
};

module.exports.userLogoutPost = (req, res, next) => {
    if (!req.session) return;

    req.session.destroy((err) => {
        if (err) return next(err);

        return res.redirect('/');
    });
};
