exports.up = knex =>
  knex.schema.createTable('dishes', table => {
    table.increments('id')

    table.text('name').notNullable().unique()
    table.text('description').notNullable()
    table.text('category').notNullable()
    table.text('image').default(null)

    table.decimal('price', 8, 2).notNullable()

    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
    table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('created_at').default(knex.fn.now())
    table.timestamp('updated_at').default(knex.fn.now())
  })

exports.down = knex => knex.schema.dropTable('dishes')
