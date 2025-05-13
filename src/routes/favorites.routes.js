const { Router } = require('express')

const FavoritesController = require('../controllers/FavoritesController')

const favoritesRoutes = Router()

const favoritesController = new FavoritesController()
const ensureAuthenticated = require('../middlewares/ensureAuthenticated')

favoritesRoutes.use(ensureAuthenticated)

favoritesRoutes.post('/', favoritesController.create)
favoritesRoutes.get('/', favoritesController.index)
favoritesRoutes.delete('/:dish_id', favoritesController.delete)

module.exports = favoritesRoutes
