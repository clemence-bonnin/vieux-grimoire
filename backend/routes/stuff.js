const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const sharp = require('../middleware/sharp-config');
const stuffCtrl = require('../controllers/stuff');

router.get('/', stuffCtrl.getAllBook);
router.post('/', auth, multer, sharp, stuffCtrl.createBook);
router.get('/bestrating', stuffCtrl.getBestRating);
router.post('/:id/rating', auth, stuffCtrl.createRating);
router.get('/:id', stuffCtrl.getOneBook);
router.put('/:id', auth, multer, sharp, stuffCtrl.modifyBook);
router.delete('/:id', auth, stuffCtrl.deleteBook);

module.exports = router;

