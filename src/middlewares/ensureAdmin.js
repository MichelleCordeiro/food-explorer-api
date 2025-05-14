const AppError = require('../utils/AppError')

function ensureAdmin(request, response, next) {
  if (!request.user?.is_admin) {
    throw new AppError('Ação permitida apenas para administradores.', 403)
  }

  return next()
}

module.exports = ensureAdmin
