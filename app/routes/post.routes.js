const router = require('express').Router();
const api = require('../controllers/post.controller.js');

/* GET */

router.get('/new', api.new);
router.get('/:postId/edit', api.edit);
router.get('/:postId', api.read);

/* POST */

router.post('/:postId/update', api.update);
router.post('/:postId/delete', api.delete);
router.post('/:postId/like', api.like);

module.exports = router;
