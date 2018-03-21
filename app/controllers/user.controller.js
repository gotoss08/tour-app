const request = require('request');
const querystring = require('querystring');

const path = require('path');
const mkdirp = require('mkdirp');
const uniqid = require('uniqid');

const User = require('../models/user.model');
const Post = require('../models/post.model').Post;

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
    if (req.session.userId) {
        return res.redirect('/user/me');
    } else {
        return res.render('user/login');
    }
};

module.exports.userLoginPost = (req, res, next) => {
    if (req.body.username && req.body.password) {
        User.authenticate(req.body.username, req.body.password, (err, user) => {
            if (err || !user) {
                return res.status(401).send('Такое имя пользователя или пароль не найдены.');
            }

            req.session.userId = user._id;
            return res.redirect('/user/me');
        });
    } else {
        const error = new Error('Поля с именем пользователя или паролем пусты!');
        error.status = 400;
        return next(error);
    }
};

module.exports.getCurrentUser = (req, res, next) => {
    User.findById(req.session.userId, (err, user) => {
        if (err) return next(err);
        if (!user) {
            const unauthorizedError = new Error('Вы должны авторизоваться в системе, перед тем как просматривать свой профиль!');
            unauthorizedError.status = 401;
            return next(unauthorizedError);
        }

        Post.find({userId: user._id}, (err, posts) => {
            if (err) return next(err);
            return res.render('user/profile', {user: user, posts: posts});
        });
    });
};

module.exports.getUser = (req, res, next) => {
    User.findOne({username: req.params.userName}, (err, user) => {
        if (err) return next(err);
        if (!user) return next(new Error('Не удалось найти пользователя: ' + req.params.userName));

        Post.find({userId: user._id}, (err, posts) => {
            if (err) {
                return next(err);
            }

            console.log('user: ' + JSON.stringify(user, null, 2));

            return res.render('user/profile', {user: user, posts: posts});
        });
    });
};

module.exports.userLogoutPost = (req, res, next) => {
    if (!req.session) return;

    req.session.destroy((err) => {
        if (err) return next(err);

        return res.redirect('/');
    });
};
