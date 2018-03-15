const router = require('express').Router();
const api = require('../controllers/api.controller.js');

router.get('/feedback', api.feedbackGet);
router.post('/feedback', api.feedbackPost);

module.exports = router;
