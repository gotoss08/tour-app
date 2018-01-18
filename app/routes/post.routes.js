const router = require('express').Router();
const postController = require('../controllers/post.controller');

router.get('/all', postController.allGet);
router.post('/all', postController.allPost);

module.exports = router;