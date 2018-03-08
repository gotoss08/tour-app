const router = require('express').Router();
const postController = require('../controllers/post1.controller');

router.get('/all', postController.allGet);
router.post('/all', postController.allPost);


router.get('/new/:editorType', postController.newPostGet);
router.post('/new/:editorType', postController.newPostPost);
router.get('/new', postController.newPostGet);

router.get('/edit/:postId', postController.editPostGet);
router.post('/update/:postId', postController.updatePostPost);

router.post('/remove/:postId', postController.removePostPost);

router.get('/:postId', postController.viewPostGet);

router.post('/upload', postController.uploadPost);
router.post('/key', postController.keyPost);


router.get('/topic/all', postController.topicAllGet);
router.get('/topic/new', postController.topicNewGet);
router.get('/topic/edit/:topicId', postController.topicEditGet);

router.post('/topic/create', postController.topicCreatePost);
router.post('/topic/create_custom', postController.topicCreateCustomPost);
router.post('/topic/update/:topicId', postController.topicUpdatePost);
router.post('/topic/remove/:topicId', postController.topicRemovePost);

router.post('/test/new', postController.testNewPost);

module.exports = router;