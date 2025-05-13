const { Router } = require('express')

const OrdersController = require('../controllers/OrdersController')

const ordersRoutes = Router()

const ordersController = new OrdersController()
const ensureAuthenticated = require('../middlewares/ensureAuthenticated')

ordersRoutes.use(ensureAuthenticated)

ordersRoutes.post('/', ordersController.create)
ordersRoutes.get('/', ordersController.index)
ordersRoutes.get('/:id', ordersController.show)
ordersRoutes.patch('/:id/cancel', ordersController.cancel)
ordersRoutes.patch('/:id', ordersController.update)

module.exports = ordersRoutes
