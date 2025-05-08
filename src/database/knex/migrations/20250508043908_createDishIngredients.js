exports.up = knex =>
  knex.schema.createTable('dish_ingredients', table => {
    table.increments('id')

    table.integer('dish_id')
      .unsigned()
      .references('id')
      .inTable('dishes')
      .onDelete('CASCADE')

    table
      .integer('ingredient_id')
      .unsigned()
      .references('id')
      .inTable('ingredients')
      .onDelete('CASCADE')

    table.timestamp('created_at').default(knex.fn.now())
  })

exports.down = knex =>
  knex.schema.dropTable('dish_ingredients')
