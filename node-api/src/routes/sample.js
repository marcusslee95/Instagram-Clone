const express = require('express')
const pool = require('../pool')

const router = express.Router()


router.get('/testRoute1', (req, res) => {
    res.send('test that we are receiving requests properly')
})

module.exports = router;
