const pg = require('pg')

const pool = new pg.Pool({ // connecting to db
    host: 'localhost',
    port: 5432,
    database: 'instagram-clone-used-by-node-api',
    user: 'marcusslee95',
    password: ''
})

module.exports = pool