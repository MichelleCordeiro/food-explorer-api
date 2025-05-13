const { Router } = require('express')

const FavoritesController = require('../controllers/FavoritesController')

const favoritesRoutes = Router()

const favoritesController = new FavoritesController()

favoritesRoutes.post('/:user_id', favoritesController.create)
favoritesRoutes.get('/:user_id', favoritesController.index)
favoritesRoutes.delete('/:user_id/:dish_id', favoritesController.delete)

module.exports = favoritesRoutes
