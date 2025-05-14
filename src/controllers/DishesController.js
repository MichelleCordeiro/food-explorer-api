const knex = require('../database/knex')
const AppError = require('../utils/AppError')
const ensureIngredientsExist = require('../utils/IngredientsExist')

class DishesController {
  async create(request, response) {
    const { name, description, category, image = '', price, ingredients } = request.body
    const created_by = request.user.id

    const requiredFields = { name, category, price }
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) throw new AppError(`O campo '${key}' é obrigatório.`)
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new AppError('Ao menos um ingrediente deve ser informado.')
    }

    const normalizedName = name.trim().toLowerCase()
    const existingDish = await knex('dishes').whereRaw('LOWER(name) = ?', [normalizedName]).first()

    if (existingDish) {
      throw new AppError(`Já existe um item com o nome ${name}.`)
    }

    const [dish_id] = await knex('dishes').insert({
      name,
      description,
      category,
      image,
      price,
      created_by,
      updated_by: created_by
    })

    if (ingredients.length > 0) {
      const allIngredients = await ensureIngredientsExist(ingredients, created_by)

      const dishIngredients = allIngredients.map(ingredient => ({
        dish_id,
        ingredient_id: ingredient.id
      }))

      await knex('dish_ingredients').insert(dishIngredients)

      return response.json({ message: `${name} cadastrado(a) com sucesso.` })
    }
  }

  async show(request, response) {
    const { id } = request.params

    const dish = await knex('dishes').where({ id }).first()
    if (!dish) throw new AppError('Item não encontrado.')

    const ingredients = await knex('dish_ingredients')
      .join('ingredients', 'ingredients.id', '=', 'dish_ingredients.ingredient_id')
      .where('dish_ingredients.dish_id', id)
      .select('ingredients.id', 'ingredients.name')

    return response.json({
      ...dish,
      ingredients
    })
  }

  async delete(request, response) {
    const { id } = request.params

    const dish = await knex('dishes').where({ id }).first()
    if (!dish) throw new AppError('Item não encontrado.')

    const orderedDishes = await knex('order_items').where( 'dish_id', id ).first()
    if (orderedDishes) throw new AppError('Item já pedido, não pode ser excluido.')

    await knex('dishes').where({ id }).delete()

    return response.json({ message: 'Item excluído com sucesso.' })
  }

  async index(request, response) {
    const { name, ingredients } = request.query

    let dishes

    if (ingredients) {
      const ingredientList = [...new Set(ingredients.split(',').map(i => i.trim().toLowerCase()))]

      const foundIngredients = await knex('ingredients')
        .whereIn('name', ingredientList)
        .select('name')

      const foundNames = foundIngredients.map(ingredient => ingredient.name)
      const notFound = ingredientList.filter(name => !foundNames.includes(name))

      if (notFound.length) {
        throw new AppError(`Ingredientes não encontrados: ${notFound.join(', ')}`)
      }

      dishes = await knex('dishes')
        .join('dish_ingredients', 'dishes.id', '=', 'dish_ingredients.dish_id')
        .join('ingredients', 'ingredients.id', '=', 'dish_ingredients.ingredient_id')
        .whereIn('ingredients.name', ingredientList)
        .groupBy('dishes.id')
        .havingRaw('COUNT(DISTINCT ingredients.name) = ?', [ingredientList.length])
        .modify(queryBuilder => {
          if (name) {
            queryBuilder.whereLike('dishes.name', `%${name}%`)
          }
        })
        .select('dishes.*')
        .orderBy('dishes.name')
    } else {
      dishes = await knex('dishes')
        .modify(queryBuilder => {
          if (name) {
            queryBuilder.whereLike('name', `%${name}%`)
          }
        })
        .orderBy('name')
    }

    if (!dishes.length) {
      throw new AppError('Nenhum prato encontrado com os critérios informados.')
    }

    const dishIds = dishes.map(d => d.id)
    const allIngredients = await knex('dish_ingredients')
      .join('ingredients', 'ingredients.id', '=', 'dish_ingredients.ingredient_id')
      .whereIn('dish_ingredients.dish_id', dishIds)
      .select('dish_ingredients.dish_id', 'ingredients.id', 'ingredients.name')

    const result = dishes.map(dish => {
      const ingredients = allIngredients.filter(i => i.dish_id === dish.id)
      return { ...dish, ingredients }
    })

    return response.json(result)
  }

  async update(request, response) {
    const { id } = request.params
    const { name, description, category, image, price, ingredients } = request.body
    const user_id = request.user.id

    const dish = await knex('dishes').where({ id }).first()
    if (!dish) throw new AppError('Item não encontrado.')

    if (name && name !== dish.name) {
      const duplicate = await knex('dishes').where({ name }).whereNot({ id }).first()

      if (duplicate) {
        throw new AppError(`Já existe outro item com o nome ${name}.`)
      }
    }

    await knex('dishes')
      .where({ id })
      .update({
        name: name ?? dish.name,
        description: description ?? dish.description,
        category: category ?? dish.category,
        image: image ?? dish.image,
        price: price ?? dish.price,
        updated_by: user_id,
        updated_at: knex.fn.now()
      })

    if (Array.isArray(ingredients)) {
      await knex('dish_ingredients').where({ dish_id: id }).del()

      if (ingredients.length > 0) {
        const allIngredients = await ensureIngredientsExist(ingredients, user_id)

        const dishIngredients = allIngredients.map(ingredient => ({
          dish_id: id,
          ingredient_id: ingredient.id
        }))

        await knex('dish_ingredients').insert(dishIngredients)
      }
    }

    return response.json({ message: 'Item atualizado com sucesso.' })
  }
}

module.exports = DishesController
