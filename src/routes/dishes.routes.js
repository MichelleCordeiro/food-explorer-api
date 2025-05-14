const { Router } = require('express')
const DishesController = require('../controllers/DishesController')
const ensureAuthenticated = require('../middlewares/ensureAuthenticated')
const ensureAdmin = require('../middlewares/ensureAdmin')

const dishesRoutes = Router()
const dishesController = new DishesController()

dishesRoutes.use(ensureAuthenticated)

dishesRoutes.post('/', ensureAdmin, dishesController.create)
dishesRoutes.delete('/:id', ensureAdmin, dishesController.delete)
dishesRoutes.patch('/:id', ensureAdmin, dishesController.update)

dishesRoutes.get('/', dishesController.index)
dishesRoutes.get('/:id', dishesController.show)

module.exports = dishesRoutes
