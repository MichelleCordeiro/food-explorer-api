exports.up = knex =>
  knex.schema.createTable('ingredients', table => {
    table.increments('id')
    table.integer('dish_id').references('id').inTable('dishes').onDelete('CASCADE').notNullable()

    table.text('name').notNullable()
  })

exports.down = knex => knex.schema.dropTable('ingredients')
