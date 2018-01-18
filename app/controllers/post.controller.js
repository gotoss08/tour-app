const querystring = require('querystring');

module.exports.allGet = (req, res) => {
    console.log(req.body);
    res.render('post/all', { country: req.query.country });
};

module.exports.allPost = (req, res) => {
    // TODO add country selection from data base
    res.redirect('/post/all?' + querystring.stringify({ country: req.body.country }));
};