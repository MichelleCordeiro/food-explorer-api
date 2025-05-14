const { request, response } = require('express')
const knex = require('../database/knex')
const AppError = require('../utils/AppError')

class FavoritesController {
  async create(request, response) {
    const user_id = request.user.id
    const { dish_id } = request.body

    const existingFavorite = await knex('favorites').where({ user_id, dish_id }).first()

    if (existingFavorite) {
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
      .select([
        'favorites.id',
        'dishes.id as dish_id',
        'dishes.name',
        'dishes.image',
        'dishes.price'
      ])
      .join('dishes', 'dishes.id', '=', 'favorites.dish_id')
      .where('favorites.user_id', user_id)
      .orderBy('favorites.id', 'desc')

    return response.json(favorites)
  }

  async delete(request, response) {
    const user_id = request.user.id
    const { dish_id } = request.params

    const favorite = await knex('favorites').where({ user_id, dish_id }).first()

    if (!favorite) throw new AppError('Este prato não está nos seus favoritos.')

    await knex('favorites').where({ user_id, dish_id }).delete()

    return response.json({ message: 'Item removido dos favoritos.' })
  }
}

module.exports = FavoritesController
