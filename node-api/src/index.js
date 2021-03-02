const express = require('express')
const sampleRouter = require('./routes/sample')
const pg = require('pg')


const app = express()

//B4: setting up server specs
app.use(express.json())
app.use(sampleRouter)
//AFTER: setting up server specs

app.listen(3333, () => {
    console.log('Yo API is UP!')
})


const pool = new pg.Pool({ // connecting to db
    host: 'localhost',
    port: 5432,
    database: 'instagram-clone-used-by-node-api',
    user: 'marcusslee95',
    password: ''
})

pool
.query('SELECT * FROM comments WHERE id = 404') //random query to test that pool can interact w/db
.then((res) => {
    console.log('Yo Thing Being Used to interact w/db - aka pool - is working! \nSee here is a column value of the row we are getting back -> ' + res.rows[0].contents)
})
.catch((err) => console.error(err))

