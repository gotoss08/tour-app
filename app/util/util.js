let checkUserLogin = (req, res, next) => {
    if (!req.session || !req.session.userId) return false; else return true;
};
module.exports.checkUserLogin = checkUserLogin;

module.exports.checkUserLoginWithRedirect = (req, res, next) => {
    if (!checkUserLogin(req, res, next)) return res.redirect('/user/login');
    else return true;
};
