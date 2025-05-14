const { Router } = require('express')
const multer = require('multer')
const uploadConfig = require('../configs/upload')

const DishesController = require('../controllers/DishesController')
const DishesImageController = require('../controllers/DishesImageController')

const ensureAuthenticated = require('../middlewares/ensureAuthenticated')
const ensureAdmin = require('../middlewares/ensureAdmin')

const dishesRoutes = Router()
const upload = multer(uploadConfig.MULTER)

const dishesController = new DishesController()
const dishesImageController = new DishesImageController()

dishesRoutes.use(ensureAuthenticated)

dishesRoutes.post('/', ensureAdmin, dishesController.create)
dishesRoutes.patch('/:id', ensureAdmin, dishesController.update)
dishesRoutes.delete('/:id', ensureAdmin, dishesController.delete)

dishesRoutes.get('/', dishesController.index)
dishesRoutes.get('/:id', dishesController.show)

dishesRoutes.patch('/:id/image', ensureAdmin, upload.single('image'), dishesImageController.update)

module.exports = dishesRoutes
