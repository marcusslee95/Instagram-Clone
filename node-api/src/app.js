const express = require('express')
const sampleRouter = require('./routes/sample')


module.exports = () => {
    const app = express()

    //B4: setting up server specs
    app.use(express.json())
    app.use(sampleRouter)
    //AFTER: setting up server specs
    
    return app

}