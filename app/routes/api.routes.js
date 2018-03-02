const router = require('express').Router();
const controller = require('../controllers/api.controller');

router.get('/map/calcpath', controller.mapCalcpath);

module.exports = router;