const express = require('express');
const router = express.Router()
const mongoose = require('mongoose')
const Good = require('../models/goods')
const User = require('../models/user')
const Hot = require('../models/hots')
const Recommend = require('../models/recommend')
const superagent = require('superagent')

// 商品列表
router.get('/computer', function (req, res, next) {
    let sort = req.query.sort || '';
    let page = +req.query.page || 1;
    let pageSize = +req.query.pageSize || 20;
    let priceGt = +req.query.priceGt || ''; // 大于
    let priceLte = +req.query.priceLte || ''; // 小于
    let skip = (page - 1) * pageSize;//跳过多少条
    let params = {}
    if (priceGt || priceLte) {
        if (priceGt && priceLte) {
            if (priceGt > priceLte) {
                var l = priceLte, g = priceGt
                priceGt = l
                priceLte = g
            }
            params = {
                'salePrice': {
                    $gt: priceGt,
                    $lte: priceLte
                }
            }
        } else {
            params = {
                'salePrice': {
                    $gt: priceGt || 0,
                    $lte: priceLte || 99999
                }
            }
        }
    }

    let productModel = Good.find(params).skip(skip).limit(pageSize);
    // 1 升序 -1 降序
    sort && productModel.sort({'salePrice': sort})
    productModel.exec(function (err, doc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            res.json({
                status: '0',
                msg: 'successful',
                result: {
                    count: doc.length,
                    data: doc
                }
            })
        }
    })
})

// 加入购物车
router.post('/addCart', function (req, res, next) {
    let userId = req.cookies.userId;
    let productId = req.body.productId;
    let productNum = req.body.productNum || 1;
    if (userId) {
        User.find({userId: userId}, function (err, userDoc) {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                if (userDoc) {
                    var userDoc = userDoc[0]
                    var cartItem = '';
                    //  购物车有内容
                    if (userDoc.cartList.length) {
                        // 遍历用户名下的购物车列表
                        userDoc.cartList.forEach(item => {
                            // 找到该商品
                            if (item.productId === productId) {
                                cartItem = item;
                                item.productNum += productNum;
                            }
                        })
                        if (cartItem) {
                            userDoc.save(function (err2, doc2) {
                                if (err2) {
                                    res.json({
                                        status: '1',
                                        msg: err2.message,
                                        result: ''
                                    })
                                } else {
                                    // 保存成功
                                    res.json({
                                        status: '0',
                                        msg: '加入成功',
                                        result: 'suc'
                                    })
                                }
                            })
                        }
                        // 保存数据
                        if (!cartItem) {
                            // 没找到
                            Good.findOne({productId: productId}, function (err3, doc3) {
                                if (err3) {
                                    res.json({
                                        status: '1',
                                        msg: err3.message,
                                        result: ''
                                    })
                                } else {
                                    let doc = {
                                        "productId": doc3.productId,
                                        "productImg": doc3.productImageBig,
                                        "productName": doc3.productName,
                                        "checked": "1",
                                        "productNum": productNum,
                                        "productPrice": doc3.salePrice
                                    };
                                    userDoc.cartList.push(doc)
                                    userDoc.save(function (err2, doc2) {
                                        if (err2) {
                                            res.json({
                                                status: '1',
                                                msg: err2.message,
                                                result: ''
                                            })
                                        } else {
                                            // 保存成功
                                            res.json({
                                                status: '0',
                                                msg: '加入成功',
                                                result: 'suc'
                                            })
                                        }
                                    })
                                }
                            })
                        }

                    } else {
                        // 没找到
                        Good.findOne({productId: productId}, function (err3, doc3) {
                            if (err3) {
                                res.json({
                                    status: '1',
                                    msg: err3.message,
                                    result: ''
                                })
                            } else {
                                let doc = {
                                    "productId": doc3.productId,
                                    "productImg": doc3.productImageBig,
                                    "productName": doc3.productName,
                                    "checked": "1",
                                    "productNum": 1,
                                    "productPrice": doc3.salePrice
                                };
                                userDoc.cartList.push(doc)
                                userDoc.save(function (err2, doc2) {
                                    console.log(JSON.stringify(err2))
                                    if (err2) {
                                        res.json({
                                            status: '1',
                                            msg: err2.message,
                                            result: ''
                                        })
                                    } else {
                                        // 保存成功
                                        res.json({
                                            status: '0',
                                            msg: '加入成功',
                                            result: 'suc'
                                        })
                                    }
                                })
                            }
                        })
                    }
                } else {
                    console.log("没找到用户？？")
                    // 直接加入
                }
            }
        })
    } else {
        res.json({
            status: '1',
            msg: '未登录',
            result: ''
        })
    }
})

// 批量加入购物车
router.post('/addCart1', function (req, res) {
    let userId = req.cookies.userId,
        productMsg = req.body.productMsg;
    if (userId) {
        User.findOne({userId}, (err, userDoc) => {
            if (err) {
                res.json({
                    status: '0',
                    msg: err.message,
                    result: ''
                })
            } else {
                if (userDoc) {
                    // 未添加的商品
                    let sx = [];
                    let newSx = []; //
                    //  购物车有内容
                    if (userDoc.cartList.length) {
                        // 遍历用户名下的购物车列表
                        userDoc.cartList.forEach((item, i) => {
                            // 找到该商品
                            productMsg.forEach((pro, j) => {
                                if (item.productId === pro.productId) {
                                    sx.push(j)
                                    item.productNum += pro.productNum
                                }
                            })
                        })
                        // 有不是重复的商品
                        if (sx.length !== productMsg.length) {
                            productMsg.forEach((item, i) => {
                                if (sx[i] !== i) {//  找到未添加的
                                    newSx.push(item)
                                }
                            })
                            let goodList1 = [], goodNum1 = []
                            newSx.forEach(item => {
                                goodList1.push(item.productId)
                                goodNum1.push(item.productNum)
                            })
                            Good.find({productId: {$in: goodList1}}, function (err3, goodDoc) {
                                if (err3) {
                                    res.json({
                                        status: '1',
                                        msg: err3.message,
                                        result: ''
                                    })
                                } else {
                                    var userCart = []
                                    // 返回一个数组
                                    goodDoc.forEach((item, i) => {
                                        // userCart.push()
                                        userDoc.cartList.push({
                                            "productId": item.productId,
                                            "productImg": item.productImageBig,
                                            "productName": item.productName,
                                            "checked": "1",
                                            "productNum": goodNum1[i],
                                            "productPrice": item.salePrice
                                        })
                                    })
                                    // if (userCart.length) {
                                    userDoc.save(function (err2, doc2) {
                                        if (err2) {
                                            res.json({
                                                status: '1',
                                                msg: err2.message,
                                                result: ''
                                            })
                                        } else {
                                            // 保存成功
                                            res.json({
                                                status: '0',
                                                msg: '加入成功',
                                                result: 'suc'
                                            })
                                        }
                                    })
                                }

                                // }
                            })
                        } else {
                            userDoc.save(function (err2, doc2) {
                                if (err2) {
                                    res.json({
                                        status: '1',
                                        msg: err2.message,
                                        result: ''
                                    })
                                } else {
                                    // 保存成功
                                    res.json({
                                        status: '0',
                                        msg: '加入成功',
                                        result: 'suc'
                                    })
                                }
                            })
                        }

                    } else {
                        var goodList = [], goodNum = []
                        productMsg.forEach(item => {
                            goodList.push(item.productId)
                            goodNum.push(item.productNum)
                        })
                        Good.find({productId: {$in: goodList}}, function (err3, doc) {
                            if (err3) {
                                res.json({
                                    status: '1',
                                    msg: err3.message,
                                    result: ''
                                })
                            } else {
                                console.log(doc)
                                // 返回一个数组
                                doc.forEach((item, i) => {
                                    userDoc.cartList.push({
                                        "productId": item.productId,
                                        "productImg": item.productImageBig,
                                        "productName": item.productName,
                                        "checked": "1",
                                        "productNum": goodNum[i],
                                        "productPrice": item.salePrice
                                    })
                                })

                                userDoc.save(function (err2, doc2) {
                                    if (err2) {
                                        res.json({
                                            status: '1',
                                            msg: err2.message,
                                            result: ''
                                        })
                                    } else {
                                        // 保存成功
                                        res.json({
                                            status: '0',
                                            msg: '加入成功',
                                            result: 'suc'
                                        })
                                    }
                                })
                            }
                        })
                    }
                }
            }
        })
    } else {
        res.json({
            status: '0',
            msg: '未登录',
            result: ''
        })
    }

})

let czUrl = 'http://www.smartisan.com/product/home'

router.post('/configHot', function (req, res) {
    // oper in ['del', 'add']
    let oper = req.body.oper,
        ids = unique(req.body.ids.split(','));
        function unique (arr) {
            let res1 = [];
            arr.forEach(o => {
                if (res1.indexOf(o) === -1) {
                    res1.push(o)
                }
            })
            return res1;
        }

    switch (oper) {
        case 'del': 
            Hot.remove({
                productId: {
                    $in: ids
                }
            }).then(() => {
                res.json({
                    status: 0,
                    message: 'suc'
                })
            });
            break;
        case 'add':
            Hot.insertMany(ids.map(id => ({
                productId: id
            }))).then(() => {
                res.json({
                    status: 0,
                    message: 'suc'
                })
            }).catch(() => {
                res.json({
                    status: 1,
                    message: 'failed'
                })
            });
            break;
    }
})

router.get('/productHome', function (req, res) {
    let hotProductIds;

    let hotp = Hot.find().then(docs => {
        hotProductIds = docs.map(p => p.productId)
        return Good.find({
            productId: {
                $in: hotProductIds
            } 
        })
    }).then(goods => {
        return goods;
    });

    let recp = Recommend.find().then(docs => {
        let recps = docs.map(doc => {
            return Good.find({
                productId: {
                    $in: doc.tabs
                }
            }).then(prods => {
                return {
                    title: doc.title,
                    image: doc.image,
                    tabs: prods
                }
            }) 
        })

        return Promise.all(recps)
    });

    Promise.all([hotp, recp]).then(([h, r]) => {
        res.json({
            status: 0,
            message: 'suc',
            result: {
                "home_hot": h,
                'home_floors': r
            }
        });
    }).catch(err => {
        res.json({
            status: 1,
            message: 'failed'
        });
    });

    // 老逻辑，转发锤子接口
    // superagent.get(czUrl).end(function (err, res1) {
    //     if (err) {
    //         res.json({
    //             status: '1',
    //             msg: err.message,
    //             result: ''
    //         })
    //     } else {
    //         let result = JSON.parse(res1.text)
    //         let home_hot = result.data.home_hot || ['100031816', '100032201', '100025104', '100023501'];
    //         let home_floors = result.data.home_floors
    //         let pId = [], // 保存总商品id
    //             hotId = [], // 热门id
    //             floorsId = [],// 官方精选 品牌精选
    //             floorsList = [];
    //         home_hot.forEach(item => {
    //             hotId.push(item.spu_id + '01')
    //             pId.push(item.spu_id + '01')
    //         })
    //         home_floors.forEach((item, i) => {
    //             let tab_items = item.tabs[0].tab_items // 
    //             floorsId[i] = []
    //             floorsList[i] = {};
    //             floorsList[i].tabs = [];
    //             floorsList[i].image = home_floors[i].tabs[0].tab_items[0]
    //             floorsList[i].title = home_floors[i].title
    //             tab_items.forEach(tab => {
    //                 let id = tab.spu_id
    //                 if (id) {
    //                     floorsId[i].push(id + '01') // 存储id
    //                     pId.push(id + '01')
    //                 }
    //             })
    //         })
    //         Good.find({productId: {$in: pId}}, (goodsErr, goodsDoc) => {
    //             if (goodsErr) {
    //                 res.json({
    //                     status: '1',
    //                     msg: goodsErr.message,
    //                     result: ''
    //                 })
    //             } else {
    //                 let hotList = [];
    //                 goodsDoc.forEach(item => {
    //                     let itemId = item.productId;
    //                     hotId.forEach(id => {
    //                         if (itemId === id) {
    //                             hotList.push(item)
    //                         }
    //                     })
    //                     floorsId.forEach((fitem, i) => {
    //                         fitem.forEach(fid => {
    //                             if (itemId === fid) {
    //                                 floorsList[i].tabs.push(item)
    //                             }
    //                         })
    //                     })
    //                 })

    // Recommend.insertMany(floorsList.map(item => {
    //     return {
    //         title: item.title,
    //         image: item.image,
    //         tabs: item.tabs.map(p => {
    //             return p.productId
    //         }),
    //     }
    // })).then(() => {
    //     console.log('suc')
    // })

    //                 res.json({
    //                     status: '0',
    //                     msg: 'suc',
    //                     result: {
    //                         "home_hot": hotList,
    //                         'home_floors': floorsList
    //                     }
    //                 })
    //             }
    //         })
    //     }
    // })
})

// 商品信息
router.get('/productDet', function (req, res) {
    let productId = req.query.productId
    Good.findOne({productId}, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            res.json({
                status: '1',
                msg: 'suc',
                result: doc
            })
        }
    })
})

module.exports = router



