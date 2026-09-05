const express = require('express')
const multer = require('multer')
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController')
const { protect } = require('../middleware/authMiddleware')
const { uploadPdf } = require('../middleware/uploadMiddleware')
const { getStudentQueue } = require('../controllers/queueController')

const router = express.Router()

const handlePdfUpload = (req, res, next) => {
  uploadPdf.single('file')(req, res, (error) => {
    if (!error) return next()

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      error.statusCode = 413
      error.message = 'PDF files must be 25 MB or smaller.'
    } else {
      error.statusCode = 400
    }

    next(error)
  })
}

router.post('/', protect, handlePdfUpload, createOrder)
router.get('/my', protect, getMyOrders)
router.get('/:id/queue', protect, getStudentQueue)
router.get('/:id', protect, getOrderById)

module.exports = router
