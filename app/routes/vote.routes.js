const router = require('express').Router();
const api = require('../controllers/vote.controller.js');

router.post('/create', api.create);
router.post('/:voteId/read', api.read);
router.post('/:voteId/update', api.update);
router.post('/:voteId/delete', api.delete);

router.post('/option/create', api.optionCreate);
router.post('/option/:postId/read', api.optionRead);
router.post('/option/:postId/update', api.optionUpdate);
router.post('/option/:postId/delete', api.optionDelete);

module.exports = router;