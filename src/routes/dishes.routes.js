const { Router } = require('express')

const DishesController = require('../controllers/DishesController')

const dishesRoutes = Router()

const dishesController = new DishesController()
const ensureAuthenticated = require('../middlewares/ensureAuthenticated')

dishesRoutes.use(ensureAuthenticated)

dishesRoutes.post('/', dishesController.create)
dishesRoutes.get('/', dishesController.index)
dishesRoutes.get('/:id', dishesController.show)
dishesRoutes.delete('/:id', dishesController.delete)
dishesRoutes.patch('/:id', dishesController.update)

module.exports = dishesRoutes
