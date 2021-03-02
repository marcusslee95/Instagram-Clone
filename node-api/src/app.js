const express = require('express')
const sampleRouter = require('./routes/sample')
const usersRouter = require('./routes/users')


module.exports = () => {
    const app = express()

    //B4: setting up server specs
    app.use(express.json())
    app.use(sampleRouter)
    app.use(usersRouter)
    //AFTER: setting up server specs
    
    return app

}