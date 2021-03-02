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

router.delete('/users/:id', async (req, res) => { 
    try {
        const queryResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]) 
        const deletedUser = queryResult.rows[0]; 
    
        deletedUser ? res.send(deletedUser) : res.status(404).send('Nothing was deleted because ID you put in did not match any user')    
    } catch (error) {
        console.error(error)
        res.status(404).send('Broooo... to delete a user you gots to send an actual id as in an integer. Not some other stuff')
    }

})

router.post('/users/', async (req, res) => {
    try {//as a rule of thumb if code has high chance of erroring out (i.e. cuz bad user input) put try catch block around it. 'Try it but if error here's how to handle it
        const valuesToCreateNewUserWith = req.body

        let queryResult;
        if (valuesToCreateNewUserWith.phone){//request sender can try to create a new user either by filling out email info or phone info. In either case username is required. If no username is provided pool.query errors therefore goes into catch block.
            queryResult = await pool.query('INSERT INTO users (username, phone) VALUES ($1, $2) RETURNING *', 
            [valuesToCreateNewUserWith.username, valuesToCreateNewUserWith.phone]) 
        }
        else if (valuesToCreateNewUserWith.email){
            queryResult = await pool.query('INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *', 
            [valuesToCreateNewUserWith.username, valuesToCreateNewUserWith.email]) 
        }
        else {
            res.status(404).send("You didn't send all the necessary info needed to create a new user")
        }

        const newlyAddedUser = queryResult.rows[0]; 

        newlyAddedUser ? res.send(newlyAddedUser) : res.status(404).send('I dunno what but something went wrong')
    } catch (error) {
        console.error(error)
        res.status(404).send(error)
    }

})

//stuck on updating an existing user cuz.... request sender could send any # of things like they might just want to update the phone so just send phone, just email, both, bio, avatar, etc....
//so should I just create if cases for every scenario? seems rather crude. should be a better way
//also didn't have this problem in Gridder class cuz just assumed request sender would send in certain things all the time
// router.put('/users/:id', async (req, res) => { 
//     const
//     try {
//         const queryResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]) 
//         const deletedUser = queryResult.rows[0]; 
    
//         deletedUser ? res.send(deletedUser) : res.status(404).send('Nothing was deleted because ID you put in did not match any user')    
//     } catch (error) {
//         console.error(error)
//         res.status(404).send('Broooo... to delete a user you gots to send an actual id as in an integer. Not some other stuff')
//     }

// })

module.exports = router;
