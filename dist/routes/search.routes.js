'use strict';

var router = require('express').Router();
var searchController = require('../controllers/search.controller');

router.get('/', searchController.index);

module.exports = router;