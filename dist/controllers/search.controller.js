'use strict';

var _require = require('../models/post.model'),
    Post = _require.Post;

var querystring = require('querystring');

module.exports.index = function (req, res, next) {

	var query = req.query.query;
	var results = [];

	render = function render(results) {
		res.render('search/index', {
			query: query ? query : '',
			results: results
		});
	};

	if (query) {
		Post.find({ $text: { $search: 'hello' } }, function (err, posts) {
			if (err) return next(err);

			for (var i = 0; i < posts.length; i++) {
				var post = posts[i];

				results.push({
					text: post.title,
					url: '/post/' + post._id
				});
			}

			render(results);
		});
	} else render();
};