const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Good = require('../models/goods')
const User = require('../models/user')

router.post('/searchUser', (req, res, next) => {
    let name = req.body.name || '',
        id = req.body.id || '',
        query
        
    if (name) {
        query = {
                userName: {
                    $regex: new RegExp('\\.*' + name + '\\.*', 'i')
                }
            }
    } else if (id) {
        query = {
            userId: {
                $regex: new RegExp('\\.*' + id + '\\.*', 'i')
            }
        }
    }
    User.find(query, (err, userArr) => {
        if (err) {
            res.json({
                status: 1,
                message: 'fail',
                result: userArr
            })
        } else {
            res.json({
                status: 0,
                message: 'suc',
                result: userArr
            })
        }
    })
})

module.exports = router