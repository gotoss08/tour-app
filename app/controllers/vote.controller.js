const util = require('../util/util.js');

const Option = require('../models/vote.model.js').Option;
const Vote = require('../models/vote.model.js').Vote;

/* vote */

module.exports.create = (req, res, next) => {
    util.checkUserLogin(req, res);

};

module.exports.read = (req, res, next) => {
    defaultVoteCheck(req, res, next);

};

module.exports.update = (req, res, next) => {
    defaultVoteCheck(req, res, next);

};

module.exports.delete = (req, res, next) => {
    defaultVoteCheck(req, res, next);

};

/* option */

module.exports.optionCreate = (req, res, next) => {
    util.checkUserLogin(req, res);

};

module.exports.optionRead = (req, res, next) => {
    defaultOptionCheck(req, res, next);

};

module.exports.optionUpdate = (req, res, next) => {
    defaultOptionCheck(req, res, next);

};

module.exports.optionDelete = (req, res, next) => {
    defaultOptionCheck(req, res, next);

};

/* helpers */

let checkVoteIdParams = (req, res, next) => {
    if (!req.params.voteId || !req.params.voteId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new Error('Неверный формат идентификатора голосования.'));
    }
};

let checkOptionIdParams = (req, res, next) => {
    if (!req.params.optionId || !req.params.optionId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new Error('Неверный формат идентификатора варианта голосования.'));
    }
};

let defaultVoteCheck = (req, res, next) => {
    util.checkUserLogin(req, res);
    checkVoteIdParams(req, res, next);
};

let defaultOptionCheck = (req, res, next) => {
    util.checkUserLogin(req, res);
    checkOptionIdParams(req, res, next);
};
