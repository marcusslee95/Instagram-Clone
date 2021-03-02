const { json } = require('express')
const express = require('express')
const sampleRouter = require('./routes/sample')

const app = express()

//B4: setting up server specs
app.use(express.json())
app.use(sampleRouter)
//AFTER: setting up server specs

app.listen(3333, () => {
    console.log('Yo API is UP!')
})