require('express-async-errors')

const AppError = require('./utils/AppError')

const express = require('express')

const routes = require('./routes')

const app = express()
app.use(express.json())

app.use(routes)

app.use(( error, request, response, next ) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      status: 'error',
      messae: 'error.message'
    })
  }

  console.error(error)

  return response.status(500).json({
    status: 'error',
    messae: 'Internal Server Error'
  })
})

const PORT = 3333
app.listen(PORT, () => console.log(`🚀 Server is running on Port ${PORT}`))