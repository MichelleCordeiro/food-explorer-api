const { Router } = require('express')
const OrdersController = require('../controllers/OrdersController')
const ensureAuthenticated = require('../middlewares/ensureAuthenticated')
const ensureAdmin = require('../middlewares/ensureAdmin')

const ordersRoutes = Router()
const ordersController = new OrdersController()

ordersRoutes.use(ensureAuthenticated)

ordersRoutes.patch('/:id', ensureAdmin, ordersController.update)

ordersRoutes.post('/', ordersController.create)
ordersRoutes.get('/', ordersController.index)
ordersRoutes.get('/:id', ordersController.show)
ordersRoutes.patch('/:id/cancel', ordersController.cancel)

module.exports = ordersRoutes
