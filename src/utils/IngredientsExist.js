const knex = require('../database/knex')

async function ensureIngredientsExist(ingredientNames, created_by) {
  if (!Array.isArray(ingredientNames) || ingredientNames.length === 0) {
    return []
  }

  const existingIngredients = await knex('ingredients').whereIn('name', ingredientNames)
  const existingNames = existingIngredients.map(i => i.name)

  const newIngredients = ingredientNames
    .filter(name => !existingNames.includes(name))
    .map(name => ({ name, created_by }))

  if (newIngredients.length > 0) {
    await knex('ingredients').insert(newIngredients)
  }

  const allIngredients = await knex('ingredients').whereIn('name', ingredientNames)

  return allIngredients
}

module.exports = ensureIngredientsExist
