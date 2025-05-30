const { hash, compare } = require('bcryptjs')
const AppError = require('../utils/AppError')

const sqliteConnection = require('../database/sqlite')

class UsersController {
  async create(request, response) {
    const { name, email, password, is_admin = false } = request.body
    const requesterIsAdmin = request.user?.is_admin ?? false

    if (is_admin && !requesterIsAdmin) {
      throw new AppError('Apenas administradores podem criar outros administradores.', 403)
    }

    if (!name) {
      throw new AppError('Nome obrigatório.')
    }
    if (!email) {
      throw new AppError('E-mail obrigatório.')
    }
    if (!password) {
      throw new AppError('Senha obrigatória.')
    }

    const database = await sqliteConnection()
    const checkUserExists = await database.get('SELECT * FROM users WHERE email = (?)', [email])

    if (checkUserExists) {
      throw new AppError('Esse e-mail já está em uso.')
    }

    const hashedPassword = await hash(password, 8)

    await database.run('INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)', [
      name,
      email,
      hashedPassword,
      is_admin ?? false
    ])

    return response.status(201).json({ message: 'Usuário criado com sucesso.' })
  }

  async update(request, response) {
    const { name, email, password, old_password, is_admin } = request.body
    const user_id = request.user.id

    const database = await sqliteConnection()
    const user = await database.get('SELECT * FROM users WHERE id = (?)', [user_id])

    if (!user) {
      throw new AppError('Usuário não encontrado.')
    }

    const userWithUpdateEmail = await database.get('SELECT * FROM users WHERE email = (?)', [email])

    if (userWithUpdateEmail && userWithUpdateEmail.id !== user.id) {
      throw new AppError('Este e-mail já está em uso.')
    }

    user.name = name ?? user.name
    user.email = email ?? user.email

    if ( password && !old_password ) {
      throw new AppError('Você precisa informar a senha antiga para definir a nova senha.')
    }

    if ( password && old_password ) {
      const checkOldPassword = await compare(old_password, user.password)

      if (!checkOldPassword) {
        throw new AppError('A senha antiga não confere.')
      }

      user.password = await hash(password, 8)
    }

    if (is_admin !== undefined && user.id !== user_id && !user.is_admin) {
      throw new AppError("Você não tem permissão para atualizar o campo 'is_admin'.", 403)
    }

    if (is_admin !== undefined && user.is_admin) {
      user.is_admin = is_admin
    }

    await database.run(
      `
        UPDATE users SET
          name = ?,
          email = ?,
          password = ?,
          is_admin = ?,
          updated_at = DATETIME('now')
        WHERE id = ?
      `,
      [user.name, user.email, user.password, user.is_admin, user_id]
    )

    return response.json({ message: 'Usuário atualizado com sucesso.' })
  }
}

module.exports = UsersController
