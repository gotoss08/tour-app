const router = require('express').Router();
const api = require('../controllers/api.controller.js');

router.get('/feedback', api.feedbackGet);
router.post('/feedback', api.feedbackPost);

router.post('/country', api.createCountry);
router.post('/country/:countryId', api.findCountry);

router.post('/img/upload', api.imageUpload);
router.post('/img/key', api.imageGenerateKey);

router.get('/test', api.test);

module.exports = router;
