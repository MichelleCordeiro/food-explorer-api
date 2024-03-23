exports.up = knex =>
  knex.schema.createTable('dishes', table => {
    table.increments('id')
    table.text('name').notNullable()
    table.text('description').default('A descrição será adicionada em breve.')
    table.text('image').notNullable()
    table.text('category')
    
    table.float('price', 5, 2)
    table.timestamp('created_at').default(knex.fn.now())
    table.timestamp('updated_at').default(knex.fn.now())
  })

exports.down = knex => knex.schema.dropTable('dishes')
