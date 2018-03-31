const router = require('express').Router();
const userController = require('../controllers/user.controller');

router.get('/register', userController.userRegisterGet);
router.get('/login', userController.userLoginGet);

router.post('/username', userController.isUsernameAlreayTaken);
router.post('/email', userController.isEmailAlreayTaken);

router.post('/register', userController.userRegisterPost);
router.post('/login', userController.userLoginPost);
router.post('/logout', userController.userLogoutPost);

router.get('/me', userController.getCurrentUser);
router.get('/:username', userController.getUser);
router.post('/:userId/posts', userController.collectPosts);
router.post('/:userId', userController.getUserById);

module.exports = router;
