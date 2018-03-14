const router = require('express').Router();
const api = require('../controllers/vote.controller.js');

router.post('/:voteId/:optionId', api.vote);

module.exports = router;
