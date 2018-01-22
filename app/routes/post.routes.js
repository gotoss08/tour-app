const router = require('express').Router();
const postController = require('../controllers/post.controller');

router.get('/all', postController.allGet);
router.post('/all', postController.allPost);

router.get('/new/:editorType', postController.newPostGet);
router.get('/new', postController.newPostGet);
router.post('/new', postController.newPostPost);

router.get('/edit/:postId', postController.editPostGet);

router.get('/remove/:postId', postController.removePostGet);

router.get('/:postId', postController.viewPostGet);

router.post('/upload', postController.uploadPost);

router.post('/key', postController.keyPost);

module.exports = router;