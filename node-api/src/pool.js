const pg = require('pg')

const pool = new pg.Pool({
    host: 'localhost',
    port: 5432 //where postgresql server that holds all the dbs lives
})

module.exports = pool
