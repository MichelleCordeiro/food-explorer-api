exports.up = knex =>
  knex.schema.createTable('orders', table => {
    table.increments('id')

    table.text('order_status').notNullable().default('pendente')
    table.decimal('order_amount', 8, 2)
    table.text('payment_method').notNullable()

    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('created_at').default(knex.fn.now())
    table.timestamp('updated_at').default(knex.fn.now())
  })

exports.down = knex => knex.schema.dropTable('orders')
