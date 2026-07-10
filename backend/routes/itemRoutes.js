const express = require('express');
const router = express.Router();
const { createItem, getItems, getItemById, deleteItem, updateItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('image'), createItem);
router.get('/', getItems);
router.get('/:id', getItemById);
router.delete('/:id', protect, deleteItem);
router.put('/:id', protect, upload.single('image'), updateItem);

module.exports = router;
