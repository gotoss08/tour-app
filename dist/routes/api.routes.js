'use strict';

var router = require('express').Router();
var api = require('../controllers/api.controller.js');

router.get('/feedback', api.feedbackGet);
router.post('/feedback', api.feedbackPost);

router.get('/test', api.test);

module.exports = router;