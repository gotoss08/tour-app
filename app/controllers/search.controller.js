const { Post } = require('../models/post.model');

const querystring = require('querystring');

module.exports.index = (req, res, next) => {

	const query = req.query.query;
	const results = [];

	render = (results) => {
		res.render('search/index', {
			query: query ? query : '',
			results: results
		});
	};

	if(query) {
		Post.find({ $text: { $search: 'hello' } }, (err, posts) => {
			if(err) return next(err);

				for(let i = 0; i < posts.length; i++) {
					let post = posts[i];

					results.push({
						text: post.title,
						url: '/post/' + post._id
					});
				}

				render(results);
		});
	} else render();
};
