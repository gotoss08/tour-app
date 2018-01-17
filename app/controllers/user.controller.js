const User = require('../models/user.model');

module.exports.userRegisterGet = (req, res) => {
    return res.render('user/register');
};

module.exports.userRegisterPost = (req, res, next) => {
    console.log(req.session);

    if(req.body.username && req.body.email && req.body.password) {
        const userData = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        };

        User.create(userData, (err, user) => {
            if (err) {
                console.log(err);
                return next(err);
            } else {
                return res.redirect('/user/login');
            }
        });
    } else {
        return next(new Error('Fill all fields!'));
    }
};

module.exports.userLoginGet = (req, res) => {
    return res.render('user/login.ejs');
};

module.exports.userLoginPost = (req, res, next) => {
    if (req.body.username && req.body.password) {
        User.authenticate(req.body.username, req.body.password, (error, user) => {
            if (error || !user) {
                const error = new Error('Wrong username or password');
                error.status = 401;
                return next(error);
            } else {
                req.session.userId = user._id;
                return res.redirect('/user/profile');
            }
        });
    } else {
        const error = new Error('All fields required!');
        error.status = 400;
        return next(error);
    }
};

module.exports.userProfileGet = (req, res, next) => {
    User.findById(req.session.userId)
        .exec((error, user) => {
            if (error) {
                return next(error);
            } else {
                if (user == null) {
                    const err = new Error('Not authorized! Go back');
                    err.status = 400;
                    return next(err);
                } else {
                    return res.render('user/profile.ejs', { username: user.username, email: user.email });
                }
            }
        });
};

module.exports.userLogoutPost = (req, res, next) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/notes/');
            }
        });
    }
};