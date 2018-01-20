const router = require('express').Router();
const countryController = require('../controllers/contry.controller');

router.get('/all', countryController.allGet);

module.exports = router;