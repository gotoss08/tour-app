const router = require('express').Router();
const api = require('../controllers/vote.controller');

router.get('/removeAll', api.removeAll);
router.get('/printAll', api.printAll);

router.post('/create/', api.create);
router.post('/option/create/', api.optionCreate);
router.post('/option/remove/', api.optionRemove);
router.post('/option/update/', api.optionUpdate);

module.exports = router;