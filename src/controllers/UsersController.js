const AppError = require('../utils/AppError')

const sqliteConnection = require('../database/sqlite')

class UsersController {
  async create(request, response) {
    const { name, email, password, isAdmin } = request.body  
    
    const database = await sqliteConnection()
    const checkUserExists = await database.get('SELECT * FROM users WHERE email = (?)', [email])

    if (checkUserExists) {
      throw new AppError('Esse email já está em uso.')
    }

    await database.run(
      'INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, false)',
      [name, email, password, isAdmin]
    )

    return response.status(201).json()
  }
}

module.exports = UsersController