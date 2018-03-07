'use strict';

var router = require('express').Router();
var controller = require('../controllers/api.controller');

router.get('/map/calcpath', controller.mapCalcpath);

module.exports = router;