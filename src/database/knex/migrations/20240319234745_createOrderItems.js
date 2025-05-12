exports.up = knex =>
  knex.schema.createTable('order_items', table => {
    table.increments('id')

    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE')
    table.integer('dish_id').unsigned().references('id').inTable('dishes').onDelete('RESTRICT')

    table.integer('quantity').notNullable()
    table.decimal('price', 8, 2).notNullable()
    table.timestamp('created_at').default(knex.fn.now())
  })

exports.down = knex => knex.schema.dropTable('order_items')
