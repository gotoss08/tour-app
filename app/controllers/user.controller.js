const request = require('request');
const querystring = require('querystring');

const User = require('../models/user.model');
const Post = require('../models/post.model').Post;

module.exports.userRegisterGet = (req, res) => {
    return res.render('user/register');
};

module.exports.userRegisterPost = (req, res, next) => {
    if (req.body.username && req.body.email && req.body.password) {
        const userData = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        };

        User.create(userData, (err, user) => {
            if (err) return next(err);

            res.redirect(307, '/user/login?' + querystring.stringify({username: req.body.username, password: req.body.password}));
            // request('http://localhost:3000/user/login?' + querystring.stringify({username: req.body.username, password: req.body.password}), (error, response, body) => {
            //     if (error) {
            //         return next(error);
            //     }

            //     console.log(response);
            // });
        });
    } else {
        return next(new Error('Неверные значения полей регистрации!'));
    }
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
