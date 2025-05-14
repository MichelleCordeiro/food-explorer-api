const knex = require('../database/knex')
const AppError = require('../utils/AppError')

class OrdersController {
  async create(request, response) {
    const { payment_method, order_items } = request.body
    const user_id = request.user.id

    if (!Array.isArray(order_items) || order_items.length === 0) {
      throw new AppError('É necessário incluir ao menos um prato no pedido.')
    }

    const allowedMethods = ['dinheiro', 'pix', 'cartão']
    if (!allowedMethods.includes(payment_method)) {
      throw new AppError('Método de pagamento inválido.')
    }

    const dishIds = order_items.map(item => item.dish_id)
    const dishes = await knex('dishes').whereIn('id', dishIds)

    const processedOrderItems = order_items.map(item => {
      const dish = dishes.find(d => d.id === item.dish_id)
      if (!dish) {
        throw new AppError(`Prato com ID ${item.dish_id} não encontrado.`)
      }

      return {
        dish_id: item.dish_id,
        quantity: item.quantity,
        price: dish.price
      }
    })

    const order_amount = Number(
      processedOrderItems.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)
    )

    const [order_id] = await knex('orders').insert({
      order_amount,
      payment_method,
      order_status: 'pendente',
      created_by: user_id,
      updated_at: knex.fn.now()
    })

    const itemsInsert = processedOrderItems.map(item => {
      return {
        ...item,
        order_id
      }
    })

    await knex('order_items').insert(itemsInsert)

    return response.json({ message: 'Pedido realizado com sucesso.' })
  }

  async index(request, response) {
    const created_by = request.user.id
    const isAdmin = request.user.is_admin

    const orders = isAdmin
      ? await knex('orders').orderBy('created_at', 'desc')
      : await knex('orders').where({ created_by }).orderBy('created_at', 'desc')

    const orderIds = orders.map(order => order.id)

    const items = await knex('order_items')
      .whereIn('order_id', orderIds)
      .join('dishes', 'dishes.id', '=', 'order_items.dish_id')
      .select('order_items.*', 'dishes.name as dish_name', 'dishes.image')

    const result = orders.map(order => {
      return {
        ...order,
        items: items.filter(item => item.order_id === order.id)
      }
    })

    return response.json(result)
  }

  async show(request, response) {
    const { id } = request.params
    const user_id = request.user.id
    const isAdmin = request.user.is_admin

    const order = await knex('orders').where({ id }).first()
    if (!order) {
      throw new AppError('Pedido não encontrado.')
    }

    if (!isAdmin && order.created_by !== user_id) {
      throw new AppError('Você não tem permissão para ver esse pedido.', 403)
    }

    const items = await knex('order_items')
      .where({ order_id: id })
      .join('dishes', 'dishes.id', '=', 'order_items.dish_id')
      .select(['order_items.*', 'dishes.name as dish_name', 'dishes.image'])
      .orderBy('name')

    return response.json({
      ...order,
      items
    })
  }

  async cancel(request, response) {
    const { id } = request.params
    const user_id = request.user.id
    const isAdmin = request.user.is_admin

    const order = await knex('orders').where({ id }).first()
    if (!order) throw new AppError('Pedido não encontrado.')

    if (!isAdmin && order.created_by !== user_id) {
      throw new AppError('Você não pode cancelar um pedido de outro usuário.', 403)
    }

    if (!isAdmin && !['pendente'].includes(order.order_status)) {
      throw new AppError('O pedido não pode mais ser cancelado.')
    }

    await knex('orders').where({ id }).update({
      order_status: 'cancelado',
      updated_at: knex.fn.now()
    })

    return response.json({ message: 'Pedido cancelado com sucesso.' })
  }

  async update(request, response) {
    const { id } = request.params
    const { order_status, payment_method } = request.body

    const order = await knex('orders').where({ id }).first()
    if (!order) throw new AppError('Pedido não encontrado.')

    const updateData = {}

    if (order_status) {
      const validStatus = ['pendente', 'em preparo', 'entregue', 'cancelado']
      if (!validStatus.includes(order_status)) {
        throw new AppError(`Status inválido. Permitidos: ${validStatus.join(', ')}`)
      }
      updateData.order_status = order_status
    }

    if (payment_method) {
      const allowedMethods = ['dinheiro', 'pix', 'cartão']
      if (!allowedMethods.includes(payment_method)) {
        throw new AppError(
          `Método de pagamento inválido. Permitidos: ${allowedMethods.join(', ')}`
        )
      }
      updateData.payment_method = payment_method
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Nenhuma alteração informada.')
    }

    updateData.updated_at = knex.fn.now()

    await knex('orders').where({ id }).update(updateData)

    return response.json({ message: 'Pedido atualizado com sucesso.' })
  }
}

module.exports = OrdersController
