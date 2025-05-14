const knex = require('../database/knex')
const AppError = require('../utils/AppError')
const DiskStorage = require('../providers/DiskStorage')

class DishesImageController {
  async update(request, response) {
    const user_id = request.user.id
    const { id } = request.params
    const imageFilename = request.file?.filename

    const diskStorage = new DiskStorage()

    if (!imageFilename) {
      throw new AppError('Nenhuma imagem foi enviada.')
    }

    const dish = await knex('dishes').where({ id }).first()

    if (!dish) {
      throw new AppError('Prato não encontrado.')
    }

    if (dish.image) {
      await diskStorage.deleteFile(dish.image)
    }

    const filename = await diskStorage.saveFile(imageFilename)

    dish.image = filename

    await knex('dishes').where({ id }).update({
      image: filename,
      updated_by: user_id,
      updated_at: knex.fn.now()
    })

    return response.json({ message: 'Imagem atualizada com sucesso.', dish })
  }
}

module.exports = DishesImageController
