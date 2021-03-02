const pool = require('./pool')
const createsAndConfiguresServer = require('./app')


createsAndConfiguresServer().listen(3333, () => {
    console.log('Yo API is UP!')
})

pool
.query('SELECT * FROM comments WHERE id = 404') //random query to test that pool can interact w/db
.then((res) => {
    console.log('Yo Thing Being Used to interact w/db - aka pool - is working! \nSee here is a column value of the row we are getting back -> ' + res.rows[0].contents)
})
.catch((err) => console.error(err))

