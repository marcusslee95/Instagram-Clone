const express = require('express')
const pool = require('../pool')

const router = express.Router()

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
router.put('/users/:id', async (req, res) => { 
    //as we have done in above endpoints... we're not going to do api side validation of if id was proper value. Because db handling that. All we need to do here is if db throws an error then handle it
    try {
        //the idea here is to 1. create a generic query string that builds itself using the values request sender provided -> this way the query string will change according to what values request send provides
        //2. at the same time we are building the values array that we use to pass values into our query parameters
        const queryPt1 = 'UPDATE users SET ' 
        let queryPt2 = ''
        const valuesToUpdateUserWith = req.body
        const keys = Object.keys(valuesToUpdateUserWith)
        const values = []
        await keys.forEach((key, index) => {
            const realQueryParameter = index + 1
            queryPt2 = (realQueryParameter == 1 ? queryPt2 + ' ' + key + ' = $' + realQueryParameter : queryPt2 + ', ' + key + ' = $' + realQueryParameter)
            const value = valuesToUpdateUserWith[key]
            values.push(value)
        })
        values.push(req.params.id)
        const queryPt3 = ' WHERE id = $' + values.length + ' RETURNING *'
        // 'UPDATE users SET bio = $1, username = $2 WHERE id = $3 RETURNING *'
        const query = queryPt1 + queryPt2 + queryPt3
        console.log(query)
        console.log(values)
        const queryResult = await pool.query(query, values)
        const updatedUser = queryResult.rows[0]

        res.send(updatedUser)
    } catch(error) {
        console.error(error)
        res.status(404).send('you boofed up son. Maybe you had an id in your request url that was not a number. Maybe you sent in an object with fields that did not exist in the db. Maybe you did send in the right fields but for those fields provided the wrong type of value. Who knows. Just know son. One way or another you dun boofed')
    }
})

router.get('/userWithHighestId', async (req, res) => { //userWithHighestId url will always refer to.... well the user with highest id
    const queryResult = await pool.query('SELECT * FROM users ORDER BY id DESC LIMIT 1') 
    
    res.send(queryResult.rows[0])

})

router.get('/posts/:userID', async (req, res) => { //allPostsByAParticularUser... so that's getting information from multiple tables (users, posts). A telltale sign we're going to have to use joins.
    //1. join posts and users table to get info about post and user who created that post onto the same row
    //2. just get the rows where users id is correct
    const queryResult = await pool.query('SELECT * FROM posts JOIN users ON posts.user_id = users.id WHERE users.id = $1', [req.params.userID]) 
    
    res.send(queryResult.rows)

})

router.get('/numberOfPostsByEachUser', async (req, res) => { //I'm not sure what's the best way to represent this resource as url.... like /posts is all posts.... but it's more than just about one user so... posts/:userID is too narrow.... oh well. Anways it involves getting information from multiple tables (users, posts). A telltale sign we're going to have to use joins.
    //1. join posts and users table to get info about post and user who created that post onto the same row
    //2. do group by username to get all the unique users and put all the rows in each group
    //3. do count for each group to see how many posts were created by each user
    const queryResult = await pool.query('SELECT username, COUNT(*) FROM (SELECT * FROM posts JOIN users ON users.id = posts.user_id) AS postsAndUsers GROUP BY username ') 
    
    res.send(queryResult.rows)

})

router.get('/numberOfPostsByAParticularUser/:username', async (req, res) => {//#likes a certain user gave out
    const queryResult = await pool.query('SELECT COUNT(*) FROM posts JOIN users ON users.id = posts.user_id WHERE username = $1 ', [req.params.username]) 
    
    res.send(queryResult.rows[0])

})

router.get('/numberOfLikesByEachUser', async (req, res) => {//pretty much same as previous endpoint just swap out posts and likes tables
    const queryResult = await pool.query('SELECT username, COUNT(*) FROM (SELECT * FROM likes JOIN users ON users.id = likes.user_id) AS likesAndUsers GROUP BY username ') 
    
    res.send(queryResult.rows)

})

router.get('/numberOfLikesByAParticularUser/:username', async (req, res) => {//#likes a certain user gave out
    const queryResult = await pool.query('SELECT COUNT(*) FROM likes JOIN users ON users.id = likes.user_id WHERE username = $1 ', [req.params.username]) 
    
    res.send(queryResult.rows[0])

})

module.exports = router;