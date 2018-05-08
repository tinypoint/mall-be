var express = require('express')
var router = express.Router()
const https = require('https')
require('./../util/dateFormat')
var User = require('../models/user')
var Good = require('../models/goods')
var fs = require('fs');
var qn = require('qn');
// 空间名
var bucket = 'avatar-img-d';
// 七牛云
var client = qn.create({
    accessKey: 'n83SaVzVtzNbZvGCz0gWsWPgpERKp0oK4BtvXS-Y',
    secretKey: '1Uve9T2_gQX9pDY0BFJCa1RM_isy9rNjfC4XVliW',
    bucket: bucket,
    origin: 'http://ouibvkb9c.bkt.clouddn.com'
})
// 阿里沙箱支付
var path = require('path')
var Alipay = require('alipay-node-sdk')
var ali = new Alipay({
    appId: '2016091400513255',
    notifyUrl: 'http://39.107.236.248/users/aliNotice',
    rsaPrivate: path.resolve('./rsa/private.txt'),
    rsaPublic: path.resolve('./rsa/public.txt'),
    sandbox: true,
    signType: 'RSA2'
});

// 登陆接口
router.post('/login', function (req, res) {
    var params = {
        userName: req.body.userName,
        userPwd: req.body.userPwd
    }
    User.findOne(params, function (err, doc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else if (doc) {
            // cookie 留存 24小时
            res.cookie("userId", doc.userId, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24
            });
            res.json({
                status: '0',
                msg: '登陆成功',
                result: {
                    name: doc.name,
                    avatar: doc.avatar
                }
            })
        } else {
            res.json({
                status: '1',
                msg: '账号或者密码错误',
                result: ''
            })
        }
    })
})
// 登出登陆
router.post('/loginOut', function (req, res) {
    res.cookie("userId", "", {
        path: "/",
        maxAge: -1
    });
    res.json({
        status: "0",
        msg: '',
        result: ''
    })
})
// 注册账号
router.post('/register', function (req, res) {
    let userName = req.body.userName, //账号　
        userPwd = req.body.userPwd;　// 密码
    User.findOne({userName}, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (doc) {
                res.json({
                    status: '1',
                    msg: '账号已存在!',
                    result: ''
                })
            } else {
                let r1 = Math.floor(Math.random() * 10);
                let r2 = Math.floor(Math.random() * 10);
                let userId = `${r1}${(Date.parse(new Date())) / 1000}${r2}`
                // 可以注册
                User.insertMany({
                    userName: userName,
                    name: `新用户${userId.slice(userId.length - 6)}`,
                    avatar: 'http://osc9sqdxe.bkt.clouddn.com/default-user-avatar.png',
                    userId: userId,
                    userPwd: userPwd,
                    orderList: [],
                    cartList: [],
                    addressList: []
                })
                res.json({
                    status: '0',
                    msg: '注册成功',
                    result: ''
                })
            }
        }
    })
})
// 上传图片
router.post('/upload', function (req, res, next) {
    // 图片数据流
    var imgData = req.body.imgData;
    // 构建图片名
    var fileName = Date.now() + '.png';
    // 构建图片路径
    var filePath = './image/' + fileName;
    // 过滤data:URL
    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(base64Data, 'base64');
    fs.writeFile(filePath, dataBuffer, function (err) {
        if (err) {
            res.end(JSON.stringify({status: '102', msg: '文件写入失败'}));
        } else {
            client.uploadFile(filePath, {key: `/avatar/${fileName}`}, function (err1, result) {
                if (err1) {
                    res.json({
                        status: '1',
                        msg: '上传失败',
                        result: ''
                    });
                } else {
                    res.json({
                        status: '0',
                        result: {
                            path: result.url
                        },
                        msg: 'suc'
                    })
                }
                // 上传之后删除本地文件
                fs.unlinkSync(filePath);
            });
        }
    })
})
// 修改头像
router.post('/updateheadimage', function (req, res, next) {
    var userId = req.cookies.userId;
    var imageSrc = req.body.imageSrc;
    if (userId && imageSrc) {
        User.update({"userId": userId},
            {
                "avatar": imageSrc
            }, (err, doc) => {
                if (err) {
                    res.json({
                        status: '1',
                        msg: err.message,
                        result: ''
                    })
                } else {
                    res.json({
                        status: '0',
                        msg: '',
                        result: '修改成功'
                    });
                }
            })
    } else {
        res.json({
            status: '1',
            msg: '未登录或者缺少所需参数',
            result: ''
        })
    }
});
// 获取用户信息
router.post('/userInfo', function (req, res) {
    let userId = req.cookies.userId
    if (userId) {
        User.findOne({
            userId
        }, function (err, doc) {
            if (err) {
                res.json({
                    status: '1',
                    msg: 'fail',
                    result: ''
                })
            } else {
                if (doc) {
                    res.json({
                        status: '0',
                        msg: 'suc',
                        result: {
                            name: doc.name,
                            avatar: doc.avatar
                        }
                    })
                } else {
                    res.json({
                        status: '1',
                        msg: 'fail',
                        result: ''
                    })
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
// 获取购物车
router.post('/cartList', function (req, res) {
    let userId = req.cookies.userId;
    if (userId) {
        // 去查用户名下的
        User.findOne({
            userId: userId
        }, function (err, userDoc) {
            if (userDoc) {
                res.json({
                    status: '1',
                    msg: "suc",
                    count: userDoc.cartList.length,
                    result: userDoc.cartList
                })
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
// 修改数量
router.post('/cartEdit', function (req, res) {
    let userId = req.cookies.userId,
        productId = req.body.productId,
        productNum = req.body.productNum > 10 ? 10 : req.body.productNum,
        checked = req.body.checked;
    if (userId) {
        User.update({
            "userId": userId,
            "cartList.productId": productId
        }, {
            "cartList.$.productNum": productNum,
            "cartList.$.checked": checked,
        }, (err, doc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                });
            } else {
                res.json({
                    status: '0',
                    msg: '',
                    result: 'suc'
                });
            }
        })
    }

})
// 全选
router.post('/editCheckAll', function (req, res) {
    let userId = req.cookies.userId,
        checkAll = req.body.checkAll ? '1' : '0';
    User.findOne({
        userId
    }, function (err, doc) {
        if (err) {
            res.json({
                status: '0',
                msg: err.message,
                result: ''
            })
        } else {
            if (doc) {
                doc.cartList.forEach(item => {
                    item.checked = checkAll
                })
                doc.save(function (err1, doc) {
                    if (err1) {
                        res.json({
                            status: '1',
                            msg: err1,
                            message,
                            result: ''
                        });
                    } else {
                        res.json({
                            status: '0',
                            msg: '',
                            result: 'suc'
                        });
                    }
                })
            }
        }
    })
})
// 删除购物车
router.post('/cartDel', function (req, res) {
    let userId = req.cookies.userId,
        productId = req.body.productId;
    User.update({
        userId
    }, {
        $pull: {
            'cartList': {
                'productId': productId
            }
        }
    }, function (err, doc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            });
        } else {
            res.json({
                status: '0',
                msg: '',
                result: 'suc'
            });
        }
    })
})
// 获取地址
router.post('/addressList', function (req, res) {
    let userId = req.cookies.userId,
        addressId = req.body.addressId || ''; // 地址id
    if (userId) {
        User.findOne({
            userId
        }, function (err, doc) {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                let addressList = doc.addressList;
                if (addressId) {
                    addressList.forEach(item => {
                        if (item.addressId == addressId) {
                            addressList = item
                        }
                    })
                }
                res.json({
                    status: '0',
                    msg: 'suc',
                    result: addressList
                })
            }
        })
    }
})
// 更新地址
router.post('/addressUpdate', function (req, res) {
    let userId = req.cookies.userId,
        addressId = req.body.addressId, // 地址id
        userName = req.body.userName,
        tel = req.body.tel,
        streetName = req.body.streetName,
        isDefault = req.body.isDefault || false;
    if (userId && addressId && userName && tel && streetName) {
        User.findOne({
            userId
        }, (err, userDoc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                let addressList = userDoc.addressList;
                if (isDefault) { // 如果修改了默认地址
                    addressList.forEach((item, i) => {
                        if (item.addressId === addressId) {
                            item.isDefault = true;
                            item.userName = userName;
                            item.tel = tel;
                            item.streetName = streetName;
                        } else {
                            item.isDefault = false;
                        }
                    })
                    // 保存数据
                    userDoc.save((err1, doc1) => {
                        if (err1) {
                            res.json({
                                status: '1',
                                msg: err1.message,
                                result: ''
                            })
                        } else {
                            res.json({
                                status: '0',
                                msg: 'suc1',
                                result: ''
                            })
                        }
                    })
                } else {
                    User.update({
                        "addressList.addressId": addressId
                    }, {
                        "addressList.$.userName": userName,
                        "addressList.$.tel": tel,
                        "addressList.$.streetName": streetName
                    }, (err2, doc2) => {
                        if (err2) {
                            res.json({
                                status: '0',
                                msg: err2.message,
                                result: ''
                            })
                        } else {
                            res.json({
                                status: '0',
                                msg: 'suc2',
                                result: ''
                            })
                        }
                    })

                }
            }
        })
    } else {
        res.json({
            status: '1',
            msg: '缺少必须参数',
            result: ''
        })
    }
})
// 添加地址
router.post('/addressAdd', function (req, res) {
    let userId = req.cookies.userId,
        userName = req.body.userName,
        tel = req.body.tel,
        streetName = req.body.streetName,
        isDefault = req.body.isDefault || false;
    if (userId && userName && tel && streetName) {
        User.findOne({
            userId
        }, (err, doc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                let addressList = doc.addressList
                if (isDefault) {
                    addressList.forEach((item, i) => {
                        item.isDefault = false;
                    })
                }
                addressList.push({
                    "addressId": parseInt(Date.parse(new Date())),
                    userName,
                    tel,
                    streetName,
                    isDefault: isDefault
                })
                doc.save((err1, doc1) => {
                    if (err1) {
                        res.json({
                            status: '1',
                            msg: err1.message,
                            result: ''
                        })
                    } else {
                        res.json({
                            status: '0',
                            msg: 'suc',
                            result: ''
                        })
                    }
                })
            }
        })
    } else {
        res.json({
            status: '1',
            msg: '缺少必须参数',
            result: ''
        })
    }
})
// 地址删除
router.post('/addressDel', function (req, res) {
    let userId = req.cookies.userId,
        addressId = req.body.addressId;
    if (userId && addressId) {
        User.update({
            userId
        }, {
            $pull: {
                'addressList': {
                    'addressId': addressId
                }
            }
        }, (err, doc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                });
            } else {
                res.json({
                    status: '0',
                    msg: '',
                    result: 'suc'
                });
            }
        })
    } else {
        res.json({
            status: '1',
            msg: '缺少必须参数',
            result: ''
        })
    }

})
// 阿里支付
router.get('/aliPay', function (req, res) {
    let userId = req.cookies.userId,
        orderId = req.query.orderId; 

        User.findOne({
            userId
        }).then(userDoc => {
            let orderList = userDoc.orderList,
                currentOrder;
            orderList.forEach(order => {
                if (order.orderId === orderId) {
                    currentOrder = order;
                }
            })
            if (!currentOrder) {
                // 重定向到订单错误页
                res.redirect('https://www.baidu.com')
            } else {
                let params = ali.pagePay({
                    subject: `订单${orderId}`,
                    body: currentOrder.goodsList.map(item => item.productName).join(','),
                    outTradeId: orderId,
                    timeout: '1c',
                    amount: currentOrder.orderTotal,
                    goodsType: '1',
                    // goodsDetail: JSON.parse(JSON.stringify(goodsList.map(item => item.productId))),
                    passbackParams: JSON.stringify({
                        userId
                    }),
                    // extendParams: {},
                    qrPayMode: 1,
                    return_url: `http://39.107.236.248/#/order/paysuccess?price=${currentOrder.orderTotal}&orderId=${orderId}`
                });

                res.redirect('https://openapi.alipaydev.com/gateway.do?' + params)
            }
        }).catch(err => {
            // 重定向到订单错误页
            res.redirect('https://www.baidu.com')
        })
})

// TODO 接受阿里的回调
router.post('/aliNotice', (req, res) => {    
    let passback_params = JSON.parse(req.body.passback_params);
    let out_trade_no = req.body.out_trade_no;
    let userId = passback_params.userId;
    let isSuccess = ali.signVerify(req.body);
     if (isSuccess) {
        // TODO 更新用户的订单状态 
        if (userId) {
            User.findOne({
                userId
            }, (err, userDoc) => {
                if (err) {
                    // TODO 
                } else {
                    userDoc.orderList = userDoc.orderList.map(order => {
                        if (order.orderId == out_trade_no) {
                            return Object.assign({}, order, {
                                orderStatus: '2'
                            })
                        } else {
                            return order;
                        }
                    })

                    userDoc.save().then(() => {
                        // TODO 成功存储
                    })
                }
            })
        }

        res.send('success');
    } else {
        if (userId) {
            User.findOne({
                userId
            }, (err, userDoc) => {
                if (err) {
                    // TODO 
                } else {
                    userDoc.orderList = userDoc.orderList.map(order => {
                        if (order.orderId == out_trade_no) {
                            return Object.assign({}, order, {
                                orderStatus: '3'
                            })
                        } else {
                            return order;
                        }
                    })

                    userDoc.save().then(() => {
                        // TODO 成功存储
                    })
                }
            })
        }

        res.send('fail');  
    }
})

router.get('/aliQuery', (req, res) => {
    let userId = req.cookies.userId,
    out_trade_no = req.query.out_trade_no;
    
    if (userId) {
        User.findOne({
            userId
        },  (err, userDoc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                var hasOrder = false;
                userDoc.orderList.forEach(item => {
                    if (item.orderId == out_trade_no) {
                        hasOrder = true
                    }
                })
                if (hasOrder) {
                    var params = ali.query({
                        outTradeId: out_trade_no
                    }).then(function (ret) {
                        var ok = ali.signVerify(ret.json());
                        if (ok) {
                            let parsedBody = JSON.parse(ret.body)
                            if (parsedBody.alipay_trade_query_response.code === 10000 ) {
                                // userDoc.orderList.forEach(order => {
                                //     if (order.orderId == out_trade_no) {
                                //         order.orderStatus = '2'
                                //     }
                                // })
                                res.json({
                                    status: '0',
                                    message: parsedBody.alipay_trade_query_response.msg,
                                    result: parsedBody.alipay_trade_query_response.trade_status
                                })
                            } else {
                                userDoc.orderList.forEach(order => {
                                    if (order.orderId == out_trade_no) {
                                        order.orderStatus = '3'
                                    }
                                })
                                res.json({
                                    status: parsedBody.alipay_trade_query_response.code,
                                    message: parsedBody.alipay_trade_query_response.msg,
                                    result: parsedBody.alipay_trade_query_response.trade_status
                                })
                            } 
                            // userDoc.save((err1, doc1) => {
                            //     if (err1) {
                                    
                            //     } else {
                                    
                            //     }
                            // })
                        } else {
                            res.json({
                                status: '1',
                                message: '支付宝校验失败',
                                result: ''
                            })
                        }
                    });
                } else {
                    res.json({
                        status: '1',
                        message: '查无此单',
                        result: ''
                    })
                }
            }
        })
    } else {
        res.json({
            status: '0',
            msg: '用户未登录',
            result: ''
        })
    }
})
// 查询订单
router.post('/orderList', function (req, res) {
    let userId = req.cookies.userId,
        orderId = req.body.orderId;
    if (userId) {
        User.findOne({
            userId
        }, (err, doc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                let orderList = doc.orderList,
                    msg = 'suc';
                if (!orderList.length) {
                    msg = '该用户暂无订单'
                }
                res.json({
                    status: '0',
                    msg: msg,
                    result: orderList
                })
            }
        })
    }
})
// 删除订单
router.post('/delOrder', function (req, res) {
    let userId = req.cookies.userId,
        orderId = req.body.orderId;
    if (userId) {
        if (orderId) {
            User.update({userId}, {
                $pull: {
                    'orderList': {
                        'orderId': orderId
                    }
                }
            }, (err, doc) => {
                if (err) {
                    res.json({
                        status: '1',
                        msg: err.message,
                        result: ''
                    })
                } else {
                    res.json({
                        status: '0',
                        msg: '',
                        result: 'suc'
                    });
                }
            })
        } else {
            res.json({
                status: '1',
                msg: '缺少订单号',
                result: ''
            })
        }
    } else {
        res.json({
            status: '1',
            msg: '未登录',
            result: ''
        })
    }
})

// 生成订单
router.post('/createOrder', (req, res, err) => {
    let userId = req.cookies.userId,
        addressId = req.body.addressId,
        productId = req.body.productId,
        num = req.body.num

    User.findOne({
        userId
    }).then(userDoc => {
        let userAddress = {},
            goodsList = [],
            newCartList = [],
            orderTotal = 0

        let addressList = userDoc.addressList,
            cartList = userDoc.cartList;

        addressList.forEach(item => {
            if (item.addressId == addressId) {
                userAddress = item
            }
        })
        
        let platform = '618';
        let r1 = Math.floor(Math.random() * 10);
        let r2 = Math.floor(Math.random() * 10);
        let sysDate = new Date().Format('yyyyMMddhhmmss');
        let createDate = new Date().Format('yyyy-MM-dd hh:mm:ss');
        let orderId = platform + r1 + sysDate + r2;
        let order = {
            orderId: orderId,
            orderTotal: orderTotal,
            addressInfo: userAddress,
            goodsList: goodsList,
            orderStatus: '0',
            createDate: createDate
        }

        if (productId && num) {
            return Good.findOne({productId}).then(goodDoc => {
                let item = {
                    productId: goodDoc.productId,
                    productImg: goodDoc.productImageBig,
                    productName: goodDoc.productName,
                    checked: '1',
                    productNum: num,
                    productPrice: goodDoc.salePrice
                }
                goodsList.push(item)
                order.orderTotal += num * goodDoc.salePrice
                // 同步数据库
                // 订单状态置为未支付
                order.orderStatus = '0'
                userDoc.orderList.push(order)
                return userDoc.save().then(() => {
                    return orderId
                })
            })
        } else {
            cartList.forEach((item) => {
                if (item.checked == '1') {
                    goodsList.push(item)
                    order.orderTotal += item.productNum * item.productPrice
                } else {
                    newCartList.push(item)
                }
            });
            
            // 同步数据库
            userDoc.cartList = newCartList;
            // 订单状态置为未支付
            order.orderStatus = '0'
            userDoc.orderList.push(order)
            return userDoc.save().then(() => {
                return orderId
            })
        }
    }).then(orderId => {
        res.json({
            status: 0,
            message: 'suc',
            result: {
                orderId
            }
        })
    }).catch(err => {
        res.json({
            status: 1,
            message: 'failed',
            result: ''
        })
    })
})

router.post('/queryOrderById', (req, res, err) => {
    let userId = req.cookies.userId,
        orderId = req.body.orderId;
    
    User.findOne({
        userId
    }).then(userDoc => {
        let orderList = userDoc.orderList,
            currentOrder;

        orderList.forEach(order => {
            if (order.orderId === orderId) {
                currentOrder = order
            }
        })

        res.json(currentOrder ? {
            status: 0,
            message: 'suc',
            result: currentOrder
        } : {
            status: 1,
            message: 'fail',
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