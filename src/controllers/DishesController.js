const { request, response } = require('express')
const knex = require('../database/knex')

class DishesController {
  async create(request, response) {
    const { name, description, image, category, price, ingredients } = request.body

    const [dish_id] = await knex('dishes').insert({
      name,
      description,
      image,
      category,
      price
    })

    const ingredientsInsert = ingredients.map(name => {
      return {
        dish_id,
        name
      }
    })

    await knex('ingredients').insert(ingredientsInsert)

    return response.json()
  }

  async show(request, response) {
    const { id } = request.params

    const dish = await knex('dishes').where({ id }).first()
    const ingredients = await knex('ingredients').where({ dish_id: id }).orderBy('name')

    return response.json({
      ...dish,
      ingredients
    })
  }

  async index(request, response) {
    const { search } = request.query

    const dishes = await knex('ingredients')
      .select([
        'dishes.id',
        'dishes.name',
        'dishes.description',
        'dishes.image',
        'dishes.category',
        'dishes.price'
      ])
      .innerJoin('dishes', 'ingredients.dish_id', 'dishes.id')
      .whereLike('dishes.name', `%${search}%`)
      .orWhereLike('ingredients.name', `%${search}%`)
      .groupBy('dish_id')
      .orderBy('dishes.name')
  
    return response.json(dishes)
  }

  async delete(request, response) {
    const { id } = request.params

    await knex('dishes').where({ id }).delete()

    return response.json()
  }
}

module.exports = DishesController




//  Listando notas