'use strict';

var router = require('express').Router();
var userController = require('../controllers/user.controller');

router.get('/register', userController.userRegisterGet);
router.post('/register', userController.userRegisterPost);

router.get('/login', userController.userLoginGet);
router.post('/login', userController.userLoginPost);

router.get('/', userController.userGet);
router.get('/:userName', userController.userNameGet);

router.post('/logout', userController.userLogoutPost);

router.get('/posts', function (req, res) {
    res.render('posts');
});

module.exports = router;