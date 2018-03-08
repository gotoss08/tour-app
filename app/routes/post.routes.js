const router = require('express').Router();
const api = require('../controllers/post.controller.js');

/* GET */

router.get('/new', api.new);
router.get('/:postId/edit', api.edit);

/* POST [CRUD] */

router.post('/:postId', api.create);
router.get('/:postId', api.read);
router.post('/:postId/update', api.update);
router.post('/:postId/delete', api.delete);

module.exports = router;
