const {Post} = require('../models/post.model');
const Country = require('../models/country.model.js');
const mongoose = require('mongoose');

module.exports.indexGet = (req, res, next) => {
    return res.render('search/index', {query: req.params.query ? req.params.query : ''});
};

module.exports.indexPost = (req, res, next) => {
    let page = 1;
    if (req.body.page) page = req.body.page;
    let itemsPerPage = 10;

    Post.find({posted: true, $or: [
        {title: {$regex: req.body.query, $options: 'i'}},
        {subtitle: {$regex: req.body.query, $options: 'i'}},
        {body: {$regex: req.body.query, $options: 'i'}},
        {'markers.header': {$regex: req.body.query, $options: 'i'}},
        {'markers.body': {$regex: req.body.query, $options: 'i'}},
    ]}).sort({createdAt: '-1'}).skip((page-1) * itemsPerPage).limit(itemsPerPage).exec()
        .then((posts) => {
            data = {posts: posts, preparedPosts: []};
            data.posts.forEach((post) => {
                data.preparedPosts.push({
                    id: post._id.toString(),
                    title: post.title,
                    subtitle: post.subtitle,
                    body: post.body,
                    uniqIpsVisited: post.uniqIpsVisited.length,
                    totalVisitCount: post.totalVisitCount,
                    likes: post.likes.length,
                    countries: Array.from(post.countries),
                    userId: post.userId,
                    postedAt: new Date(post.createdAt.getTime()),
                    editedAt: new Date(post.updatedAt.getTime()),
                });
            });
            return data;
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
            data.preparedPosts.forEach((post) => {
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
            return res.status(200).send({posts: data.preparedPosts});
        })
        .catch((err) => {
            console.error(err);
            return res.sendStatus(400);
        });
};
