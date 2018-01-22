const router = require('express').Router();
const countryController = require('../controllers/contry.controller');

router.get('/all', countryController.allGet);

router.post('/test', (req, res) => {
    console.log(req.body);
});

module.exports = router;