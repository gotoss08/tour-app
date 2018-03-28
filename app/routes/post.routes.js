const router = require('express').Router();
const api = require('../controllers/post.controller.js');

/* GET */

router.get('/new', api.new);
router.get('/country', api.countrySearch);
router.get('/country/:countryId', api.countrySearch);
router.get('/:postId/edit', api.edit);
router.get('/:postId', api.read);

/* POST */
router.post('/country', api.searchPostsByCountry);
router.post('/:postId/update', api.update);
router.post('/:postId/remove', api.remove);
router.post('/:postId/like', api.like);

module.exports = router;
