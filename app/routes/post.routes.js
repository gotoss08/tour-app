const router = require('express').Router();
const postController = require('../controllers/post.controller');

router.get('/all', postController.allGet);
router.post('/all', postController.allPost);

router.get('/new', postController.newPostGet);
router.post('/new', postController.newPostPost);

router.get('/edit/:postId', postController.editPostGet);

router.get('/remove/:postId', postController.removePostGet);

router.get('/:postId', postController.viewPostGet);

module.exports = router;