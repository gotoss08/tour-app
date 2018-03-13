module.exports.checkUserLogin = (req, res) => {
    if (!req.session.userId) {
        // TODO: add user checking according to new user controller
        return res.redirect('/user/login');
    }
};
