'use strict';

var router = require('express').Router();
var api = require('../controllers/vote.controller.js');

router.post('/:voteId/:optionId', api.vote);

module.exports = router;