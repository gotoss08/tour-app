'use strict';

var util = require('../util/util.js');

var Vote = require('../models/vote.model.js').Vote;

module.exports.vote = function (req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).send('Для участия в голосовании вы должны зарегестрироваться.');
    }

    checkVoteIdParams(req, res, next);
    checkOptionIdParams(req, res, next);

    Vote.findById(req.params.voteId, function (err, vote) {
        if (err) return next(err);

        if (!vote) return next(new Error('Голосование с таким ID не найдено.'));

        var userVoted = false;

        for (var i = 0; i < vote.votedUsers.length; i++) {
            var user = vote.votedUsers[i];

            if (user._id == req.session.userId) {
                userVoted = true;
                break;
            }
        }

        if (userVoted) {
            console.log('user already voted');
            return res.status(403).send('Вы уже проголосовали.');
        }

        console.log(JSON.stringify(vote, null, 2));

        if (vote.options.length) {
            for (var _i = 0; _i < vote.options.length; _i++) {
                var option = vote.options[_i];
                if (option._id == req.params.optionId) {
                    option.voteCount += 1;
                    // add current user as voted user
                    vote.votedUsers.push(req.session.userId);
                    userJustVoted = true;

                    vote.save(function (err) {
                        if (err) return next(err);
                        console.log('user voted');
                        return res.status(200).send({ vote: vote });
                    });

                    break;
                }
            }
        }
    });
};

/* helpers */

var checkVoteIdParams = function checkVoteIdParams(req, res, next) {
    if (!req.params.voteId || !req.params.voteId.match(/^[0-9a-fA-F]{24}$/)) {
        next(new Error('Неверный формат идентификатора голосования.'));
    }
};

var checkOptionIdParams = function checkOptionIdParams(req, res, next) {
    if (!req.params.optionId || !req.params.optionId.match(/^[0-9a-fA-F]{24}$/)) {
        next(new Error('Неверный формат идентификатора варианта голосования.'));
    }
};