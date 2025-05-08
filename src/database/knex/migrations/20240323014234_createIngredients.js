exports.up = knex =>
  knex.schema.createTable('ingredients', table => {
    table.increments('id')

    table.text('name').notNullable().unique()
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('created_at').default(knex.fn.now())
  })

exports.down = knex => knex.schema.dropTable('ingredients')
