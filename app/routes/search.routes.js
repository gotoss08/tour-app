const router = require('express').Router();
const searchController = require('../controllers/search.controller');

router.get('/', searchController.indexGet);
router.get('/:query', searchController.indexGet);
router.post('/', searchController.indexPost);

module.exports = router;
