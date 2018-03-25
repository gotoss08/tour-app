const util = require('../util/util.js');

const Vote = require('../models/vote.model.js').Vote;

module.exports.vote = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).send('Для участия в голосовании вы должны зарегестрироваться.');
    }

    checkVoteIdParams(req, res, next);
    checkOptionIdParams(req, res, next);

    Vote.findById(req.params.voteId, (err, vote) => {
        if (err) return next(err);

        if (!vote) return next(new Error('Голосование с таким ID не найдено.'));

        let userVoted = false;

        for (let i = 0; i < vote.votedUsers.length; i++) {
            let user = vote.votedUsers[i];

            if (user._id == req.session.userId) {
                userVoted = true;
                break;
            }
        }

        if (userVoted) return res.status(403).send('Вы уже проголосовали.');

        if (vote.options.length) {
            for (let i = 0; i < vote.options.length; i++) {
                let option = vote.options[i];
                if (option._id == req.params.optionId) {
                    option.voteCount += 1;
                    // add current user as voted user
                    vote.votedUsers.push(req.session.userId);
                    userJustVoted = true;

                    vote.save((err) => {
                        if (err) return next(err);
                        return res.status(200).send({vote: vote});
                    });

                    break;
                }
            }
        }
    });
};

/* helpers */

let checkVoteIdParams = (req, res, next) => {
    if (!req.params.voteId || !req.params.voteId.match(/^[0-9a-fA-F]{24}$/)) {
        next(new Error('Неверный формат идентификатора голосования.'));
    }
};

let checkOptionIdParams = (req, res, next) => {
    if (!req.params.optionId || !req.params.optionId.match(/^[0-9a-fA-F]{24}$/)) {
        next(new Error('Неверный формат идентификатора варианта голосования.'));
    }
};
