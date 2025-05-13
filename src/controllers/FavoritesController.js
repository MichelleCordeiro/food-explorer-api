const { request, response } = require('express')
const knex = require('../database/knex')
const AppError = require('../utils/AppError')

class FavoritesController {
  async create(request, response) {
    const user_id = request.user.id
    const { dish_id } = request.body

    const existFavorite = await knex('favorites').where({ user_id, dish_id }).first()

    if (existFavorite) {
      throw new AppError('Esse item já está nos seus favoritos.')
    }

    await knex('favorites').insert({
      user_id,
      dish_id
    })

    return response.json({ message: `Item ${dish_id} adicionado aos favoritos.` })
  }

  async index(request, response) {
    const user_id = request.user.id

    const favorites = await knex('favorites')
      .select('dishes.*', 'favorites.dish_id')
      .innerJoin('dishes', 'dishes.id', 'favorites.dish_id')
      .where('favorites.user_id', user_id)
      .orderBy('dishes.name')

    return response.json(favorites)
  }

  async delete(request, response) {
    const user_id = request.user.id
    const { dish_id } = request.params

    await knex('favorites').where({ user_id, dish_id }).delete()

    return response.json({ message: 'Item removido dos favoritos.' })
  }
}

module.exports = FavoritesController
