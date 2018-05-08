const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Good = require('../models/goods')
const User = require('../models/user')
// 查找用户
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
    User.find(query).then(userArr => {
        res.json({
            status: 0,
            message: 'suc',
            result: userArr
        });
    }).catch(err => {
        res.json({
            status: 1,
            message: 'fail',
            result: ''
        })
    });
})
// 修改角色权限
router.post('/changeRole', (req, res, next) => {
    let operUserId = req.body.userId,
        role = req.body.role;
    
    User.findOne({
        userId: operUserId
    }).then(userDoc => {
        userDoc.role = parseInt(role);
        return userDoc.save();
    }).then(() => {
        res.json({
            status: 0,
            message: 'suc',
            result: {
                userId: operUserId,
                role
            }
        })
    }).catch(err => {
        res.json({
            status: 1,
            message: 'fail',
            result: ''
        })
    });
})

// 查找商品
router.post('/searchGood', (req, res, next) => {
    let name = req.body.name || '',
        id = req.body.id || '',
        query
        
    if (name) {
        query = {
            productName: {
                    $regex: new RegExp('\\.*' + name + '\\.*', 'i')
                }
            }
    } else if (id) {
        query = {
            productId: {
                $regex: new RegExp('\\.*' + id + '\\.*', 'i')
            }
        }
    }
    Good.find(query).then(goodArr => {
        res.json({
            status: 0,
            message: 'suc',
            result: goodArr
        });
    }).catch(err => {
        res.json({
            status: 1,
            message: 'fail',
            result: ''
        })
    });
})

// 查找商品
router.post('/updateGood', (req, res, next) => {
    let productId = req.body.productId,
        productName = req.body.productName,
        sub_title = req.body.sub_title,
        salePrice = req.body.salePrice;
        
    Good.findOne({
        productId
    }).then(goodDoc => {
        goodDoc.salePrice = salePrice;
        goodDoc.productName = productName;
        goodDoc.sub_title = sub_title;

        return goodDoc.save();
    }).then(() => {
        res.json({
            status: 0,
            message: 'suc',
            result: ''
        });       
    }).catch(err => {
        res.json({
            status: 1,
            message: 'failed',
            result: ''
        })
    });
});

router.post('/addGood', (req, res, next) => {
    let productName = req.body.productName,
        sub_title = req.body.sub_title,
        salePrice = req.body.salePrice;
    
    let r1 = Math.floor(Math.random() * 10);
    let r2 = Math.floor(Math.random() * 10);
    let productId = `1${r1}${(Date.parse(new Date())) / 100}${r2}`.slice(0, 9);
    Good.insertMany({
        productId,
        productName,
        sub_title,
        salePrice,
        limit_num: '5',
        productImageBig: '',
        productMsg: {
            "pieces_num": 0,
            "piece_height": 0,
            "height": 0,
            "width": 0,
            "url": []
        },
        "stock": 10,
        "productImageSmall": []

    }).then(() => {
        res.json({
            status: 0,
            message: 'suc',
            result: ''
        })
    }).catch(err => {
        res.json({
            status: 1,
            message: 'failed',
            result: ''
        })
    })
})

module.exports = router