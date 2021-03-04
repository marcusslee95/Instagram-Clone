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

router.get('/posts/:userID', async (req, res) => { //allPostsByAParticularUser... so all posts information is in posts table.
    const queryResult = await pool.query('SELECT * FROM posts WHERE posts.user_id = $1', [req.params.userID]) 
    
    res.send(queryResult.rows)

})

router.get('/numberOfPostsByEachUser', async (req, res) => { //I'm not sure what's the best way to represent this resource as url.... like /posts is all posts.... but it's more than just about one user so... posts/:userID is too narrow.... oh well. Anways it involves getting information from multiple tables (users, posts). A telltale sign we're going to have to use joins.
    //1. join posts and users table to get info about post and user who created that post onto the same row
    //2. do group by username to get all the unique users and put all the rows in each group
    //3. do count for each group to see how many posts were created by each user
    const queryResult = await pool.query('SELECT username, COUNT(*) FROM (SELECT * FROM posts JOIN users ON users.id = posts.user_id) AS postsAndUsers GROUP BY username ') 
    
    res.send(queryResult.rows)

})

router.get('/numberOfPostsByAParticularUser/:username', async (req, res) => {//#posts a certain user has made
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



router.get('/numberOfFollowersOfAParticularUser/:id', async (req, res) => {//even though I could have passed in username and do a join insteadd... that would not have shown the value of the bridge table. Where can see all that info in one table
    // const queryResult = await pool.query('SELECT * FROM followers WHERE leader_id = $1 ', [req.params.id]) 
    // res.send(queryResult.rows)
    const queryResult = await pool.query('SELECT COUNT(*) FROM followers WHERE leader_id = $1 ', [req.params.id]) 
    
    res.send(queryResult.rows[0])

})

router.get('/numberOfPeopleAParticularUserIsFollowing/:id', async (req, res) => {//even though I could have passed in username and do a join insteadd... that would not have shown the value of the bridge table. Where can see all that info in one table
    // const queryResult = await pool.query('SELECT * FROM followers WHERE follower_id = $1 ', [req.params.id]) 
    // res.send(queryResult.rows)
    const queryResult = await pool.query('SELECT COUNT(*) FROM followers WHERE follower_id = $1 ', [req.params.id]) 
    
    res.send(queryResult.rows[0])

})

router.get('/usernameOfFollowersOfAParticularUser/:id', async (req, res) => {//even though I could have passed in username and do a join insteadd... that would not have shown the value of the bridge table. Where can see all that info in one table
    //realize can't just look at followers table because it has just follwer id and user that's being followed id -> need join -> w/what? -> users table where can get username of follower
    // const queryResult = await pool.query('SELECT username, leader_id FROM followers JOIN users ON followers.follower_id = users.id WHERE followers.leader_id = $1', [req.params.id]) 
    const queryResult = await pool.query('SELECT username FROM followers JOIN users ON followers.follower_id = users.id WHERE followers.leader_id = $1', [req.params.id]) 

    res.send(queryResult.rows)

})

router.get('/usernameOfPeopleAParticularUserIsFollowing/:id', async (req, res) => {
    // const queryResult = await pool.query('SELECT * FROM followers JOIN users ON followers.leader_id = users.id WHERE followers.follower_id = $1', [req.params.id]) 
    // const queryResult = await pool.query('SELECT username, followers.follower_id   FROM followers JOIN users ON followers.leader_id = users.id WHERE followers.follower_id = $1', [req.params.id]) 
    const queryResult = await pool.query('SELECT username FROM followers JOIN users ON followers.leader_id = users.id WHERE followers.follower_id = $1', [req.params.id]) 
    
    res.send(queryResult.rows)

})

router.post('/followers', async (req, res) => {//userClickedFollowOnAnotherUserProfile -> post method because we're creating a new row in followers table -> we're not sure how 1. we'll get the info on user who just made the click 2. info on user that they just followed. Let's just say for now the pass id of both in a path parameter. Actually no that goes against our naming convention where we just have the table we are creating into. So we'll send it in the request body
    const {idOfUserWhoMadeClick, idOfUserWhoTheyJustFollowed }= req.body
    const queryResult = await pool.query('INSERT INTO followers (follower_id, leader_id) VALUES ($1, $2) RETURNING *', [idOfUserWhoMadeClick, idOfUserWhoTheyJustFollowed]) 
    
    res.send(queryResult.rows)

})

router.delete('/followers/:idOfUserWhoMadeClick&:idOfUserWhoTheyJustFollowed', async (req, res) => {//userClickedUnFollowOnAnotherUserProfile aka. they were the follower 
    const queryResult = await pool.query('DELETE FROM followers WHERE follower_id = $1 AND leader_id = $2 RETURNING *', [req.params.idOfUserWhoMadeClick, req.params.idOfUserWhoTheyJustFollowed]) 
    // DELETE FROM users WHERE id = $1 RETURNING *
    res.send(queryResult.rows)

})

router.get('/topFourHashtagsInPostsOfThisUser/:id', async (req, res) => {//so more specifically this would be those hashtags in the caption of a user's post
    //Step 1: get all the instances of hashtags used in user's many posts
    // const { rows } = await pool.query('SELECT * FROM posts WHERE user_id = $1', [req.params.id])
    // const { rows } = await pool.query('SELECT id FROM posts WHERE user_id = $1', [req.params.id])
    // const { rows } = await pool.query('SELECT * FROM hashtags_posts WHERE post_id IN (SELECT id FROM posts WHERE user_id = $1)', [req.params.id])
    // const { rows } = await pool.query('SELECT * FROM hashtags WHERE id IN (SELECT hashtag_id FROM hashtags_posts WHERE post_id IN (SELECT id FROM posts WHERE user_id = $1))', [req.params.id])

      //*gets all the posts of the user -> uses all those posts to find hashtags in those posts 
    // const { rows } = await pool.query('SELECT title FROM hashtags WHERE id IN (SELECT hashtag_id FROM hashtags_posts WHERE post_id IN (SELECT id FROM posts WHERE user_id = $1))', [req.params.id])
  
    
    //step 2: group by to pick out the unique hashtags and then count(*) to get # times they appear
    //*get all the unique hashtags 
    // const { rows } = await pool.query('SELECT title, COUNT(*) FROM (SELECT title FROM hashtags WHERE id IN (SELECT hashtag_id FROM hashtags_posts WHERE post_id IN (SELECT id FROM posts WHERE user_id = $1))) as hashtagsUserUsed GROUP BY title', [req.params.id])

    //step 3: pick the 4 hashtags w/the highest count
    //*Show only the 4 hashtags that appeared the most in posts.-> you can't really tell it's working in this data set because all the hashtags happen only once for the most part
    const { rows } = await pool.query('SELECT title, COUNT(*) FROM (SELECT title FROM hashtags WHERE id IN (SELECT hashtag_id FROM hashtags_posts WHERE post_id IN (SELECT id FROM posts WHERE user_id = $1))) as hashtagsUserUsed GROUP BY title ORDER BY COUNT(*) DESC LIMIT 4', [req.params.id])


    res.send(rows)
})

router.get('/allTheDetailsToShowWhenGoToAProfilePageOFAUser/:userId', async (req, res) => {// can't just say 'users/:userId' because what we want to show is info beyond just what's in user's table -> the plan is to write multiple queries to get the different data that we need to show, combine them in one thing, and then send it back
    const queryResult1 = await pool.query('SELECT username, status, avatar, bio FROM users WHERE id = $1', [req.params.userId]) 
    // const queryResult = await pool.query('SELECT username, followers.follower_id   FROM followers JOIN users ON followers.leader_id = users.id WHERE followers.follower_id = $1', [req.params.id]) 
    // const queryResult = await pool.query('SELECT username FROM followers JOIN users ON followers.leader_id = users.id WHERE followers.follower_id = $1', [req.params.id]) 
    const queryResult2 = await pool.query('SELECT COUNT(*) AS numOfPosts FROM posts WHERE posts.user_id = $1', [req.params.userId]) 
    const queryResult3 = await pool.query('SELECT COUNT(*) AS numOfFollowers FROM followers WHERE leader_id = $1 ', [req.params.userId]) 
    const queryResult4 = await pool.query('SELECT COUNT(*) AS numOfFollowing FROM followers WHERE follower_id = $1 ', [req.params.userId]) 
    const queryResult5 = await pool.query('SELECT title FROM (SELECT title FROM hashtags WHERE id IN (SELECT hashtag_id FROM hashtags_posts WHERE post_id IN (SELECT id FROM posts WHERE user_id = $1))) as hashtagsUserUsed GROUP BY title ORDER BY COUNT(*) DESC LIMIT 4', [req.params.userId])
    const queryResult6 = await pool.query('SELECT url FROM posts WHERE user_id = $1 ', [req.params.userId]) 

    // console.log (queryResult1.rows[0])
    // console.log (queryResult2.rows[0])
    // console.log (queryResult3.rows[0])
    // console.log (queryResult4.rows[0]) , ...queryResult5 
    // console.log (queryResult5.rows) 
    // const queryResult = [queryResult1.rows[0], queryResult2.rows[0], queryResult3.rows[0], queryResult4.rows[0], queryResult5.rows, queryResult6.rows ] // <- a legitimate way to send values back. As an array of objects. Just wanted to get experimental and send back just a single objects w/all the fields in it
    const queryResult = {...queryResult1.rows[0], ...queryResult2.rows[0], ...queryResult3.rows[0], ...queryResult4.rows[0]}
    queryResult['topFourHashtags'] = queryResult5.rows
    queryResult['photoUrls'] = queryResult6.rows
    // console.log (queryResult)
    res.send(queryResult)

})

router.get('/allTheDetailsToShowWhenGoToAPostPageOFAUser/:postId', async (req, res) => {// can't just say 'posts/:postId' because what we want to show is info beyond just what's in posts table -> it's safe to assume when the user clicks a post image / photo on someone else's profile page we'll get back some info about the post which is why i send over photoID in path parameter -> the plan is to write multiple queries to get the different data that we need to show, combine them in one thing, and then send it back
const queryResult0 = await pool.query('SELECT username FROM  (SELECT *  FROM posts WHERE id = $1 ) AS thePost JOIN users ON users.id = thePost.user_id ', [req.params.postId]) 
const queryResult1 = await pool.query('SELECT url, caption FROM posts WHERE id = $1', [req.params.postId]) 

    const queryResult2 = await pool.query('SELECT username, x, y FROM ( SELECT user_id, x, y FROM photo_tags  WHERE post_id = $1 ) AS photoTagInfoAndUsername JOIN users ON users.id = photoTagInfoAndUsername.user_id', [req.params.postId]) //the only value we have available to us is the post id -> but we know that every post has a foreign key to the user who created it -> we can use that value to look find the correct user in the users table -> alternatively I could just do a join operation to attach the user row to the post and then get the username value but.... didn't I learn that join operations are costly / take time? Anyways chose to go w/this subquery way because thought it was more intuitive (aka. use postID info to get userId -> use userID to get username)
    const queryResult3 = await pool.query('SELECT COUNT(*) AS numberOfLikesOnPost FROM likes WHERE post_id = $1 ', [req.params.postId]) 
    const queryResult4 = await pool.query('SELECT contents, updated_at FROM comments WHERE post_id = $1 ORDER BY updated_at DESC', [req.params.postId]) 
    const queryResult5 = await pool.query('SELECT comment_id, COUNT(*) FROM likes WHERE comment_id IN ( SELECT id FROM comments WHERE post_id = $1 ORDER BY updated_at DESC ) GROUP BY comment_id', [req.params.postId])

    // console.log (queryResult1.rows[0])
    // console.log (queryResult2.rows)
    // console.log (queryResult3.rows[0])
    // console.log (queryResult4.rows)
    // console.log (queryResult5.rows) 
    // const queryResult = [queryResult1.rows[0], queryResult2.rows, queryResult3.rows[0], queryResult4.rows, queryResult5.rows] 
    const queryResult = {...queryResult0.rows[0], ...queryResult1.rows[0], ...queryResult3.rows[0]}
    queryResult['tagsonPhoto'] = queryResult2.rows
    queryResult['commentsOnPostStartingFromMostRecent'] = queryResult4.rows
    queryResult['numOfLikesOnEachComment'] = queryResult5.rows
    console.log (queryResult)
    // res.send(queryResult1)

})

module.exports = router;