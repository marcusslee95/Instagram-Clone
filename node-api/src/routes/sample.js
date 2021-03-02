const express = require('express')
const pool = require('../pool')

const router = express.Router()


router.get('/testRoute1', (req, res) => {
    res.send('test that we are receiving requests properly')
})

// //B4: .then version
// router.get('/users', (req, res) => {
//     pool
//     .query('SELECT * FROM users')
//     .then((queryResult) => {
//         res.send(queryResult.rows)
//     })

// })
// //AFTER: .then version

router.get('/users', async (req, res) => { //marked function as async because any db operation has chance of taking a long time and don't want that process to block app from doing other things
    const queryResult = await pool.query('SELECT * FROM users') //await just says don't execute code below before this code executes. If i did need to execute some code while this process was happening I'd probably be better off using .then() syntax
    
    res.send(queryResult.rows)

})

router.get('/users/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]) //rows is 1 element array if there was a user w/matchind id or empty array if no match
        const user = rows[0]
    
        user ? res.send(user) : res.status(404).send("ID you put in did not match any user")
    } catch (error) {//will enter this block if any code in try block errors
        console.error(error);
        res.status(404).send("You put in something that's not a #. Perhaps trying to SQL injection attack me bro?")
    }

})

module.exports = router;
