'use strict';

var router = require('express').Router();
var api = require('../controllers/vote.controller');

router.post('/', api.vote);

router.get('/removeAll', api.removeAll);
router.get('/printAll', api.printAll);

router.post('/create/', api.create);
router.post('/option/create/', api.optionCreate);
router.post('/option/remove/', api.optionRemove);
router.post('/option/update/', api.optionUpdate);

router.post('/:voteId', api.fetchVote);

module.exports = router;