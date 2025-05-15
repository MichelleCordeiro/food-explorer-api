const { Router } = require('express')
const multer = require('multer')
const uploadConfig = require('../configs/upload')

const DishesController = require('../controllers/DishesController')
const ensureAuthenticated = require('../middlewares/ensureAuthenticated')
const ensureAdmin = require('../middlewares/ensureAdmin')

const dishesRoutes = Router()
const upload = multer(uploadConfig.MULTER)

const dishesController = new DishesController()

dishesRoutes.use(ensureAuthenticated)

dishesRoutes.post('/', ensureAdmin, upload.single('image'), dishesController.create)
dishesRoutes.patch('/:id', ensureAdmin, upload.single('image'), dishesController.update)
dishesRoutes.delete('/:id', ensureAdmin, dishesController.delete)

dishesRoutes.get('/', dishesController.index)
dishesRoutes.get('/:id', dishesController.show)

module.exports = dishesRoutes
