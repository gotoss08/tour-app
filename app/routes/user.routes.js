const router = require('express').Router();
const userController = require('../controllers/user.controller');

router.get('/register', userController.userRegisterGet);
router.get('/login', userController.userLoginGet);
router.get('/me', userController.getCurrentUser);

router.post('/register', userController.userRegisterPost);
router.post('/login', userController.userLoginPost);
router.post('/logout', userController.userLogoutPost);


router.get('/posts', (req, res) => {
    res.render('posts');
});

router.get('/:userName', userController.getUser);

module.exports = router;
