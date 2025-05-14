const knex = require('../database/knex')
const AppError = require('../utils/AppError')

class DishesController {
  async create(request, response) {
    const { name, description, category, image = '', price, ingredients } = request.body
    const created_by = request.user.id
    const isAdmin = request.user.is_admin

    if (!isAdmin) {
      throw new AppError('Somente administradores podem cadastrar itens.', 403)
    }

    if (!name || !category || !price) {
      throw new AppError('O nome, a categoria e o preço do item são obrigatórios.')
    }

    const existingDish = await knex('dishes').where({ name }).first()
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

    const foundIngredients = await knex('ingredients').whereIn('name', ingredients)
    const foundNames = foundIngredients.map(ingred => ingred.name)

    const newIngredients = ingredients
      .filter(name => !foundNames.includes(name))
      .map(name => ({ name, created_by }))

    if (newIngredients.length) {
      await knex('ingredients').insert(newIngredients)
    }

    const allIngredients = await knex('ingredients').whereIn('name', ingredients)
    const dishIngredients = allIngredients.map(ingredient => ({
      dish_id,
      ingredient_id: ingredient.id
    }))

    await knex('dish_ingredients').insert(dishIngredients)

    return response.json({ message: `${name} cadastrado(a) com sucesso.` })
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
    const isAdmin = request.user.is_admin

    if (!isAdmin) {
      throw new AppError('Somente administradores podem excluir itens.', 403)
    }

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
    const ingredientList = ingredients.split(',').map(ingredient => ingredient.trim().toLowerCase())

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

    const result = await Promise.all(
      dishes.map(async dish => {
        const ingredients = await knex('dish_ingredients')
          .join('ingredients', 'ingredients.id', '=', 'dish_ingredients.ingredient_id')
          .where('dish_ingredients.dish_id', dish.id)
          .select('ingredients.id', 'ingredients.name')

        return { ...dish, ingredients }
      })
    )

    return response.json(result)
  }

  async update(request, response) {
    const { id } = request.params
    const { name, description, category, image, price, ingredients } = request.body
    const user_id = request.user.id
    const isAdmin = request.user.is_admin

    if (!isAdmin) {
      throw new AppError('Somente administradores podem modificar itens.', 403)
    }

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
      });


    if (ingredients) {
      await knex('dish_ingredients').where({ dish_id: id }).del()

      if (ingredients.length) {
        const foundIngredients = await knex('ingredients').whereIn('name', ingredients)
        const foundNames = foundIngredients.map(ingredient => ingredient.name)

        const newIngredients = ingredients.filter(name => !foundNames.includes(name))
        if (newIngredients.length) {
          await knex('ingredients').insert(newIngredients)
        }

        const allIngredients = await knex('ingredients').whereIn('name', ingredients)
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
