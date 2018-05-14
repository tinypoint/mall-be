var mongoose = require('mongoose')
var userSchema = new mongoose.Schema({
    "userId": { 
        type: 'string', 
        unique: true 
    },
    "name": String,
    "avatar": String,
    "userName": String,
    "userPwd": String,
    "orderList": Array,
    "role": Number,
    "cartList": [
        {
            "productId": String,
            "productImg": String,
            "productName": String,
            "checked": String,
            "productNum": Number,
            "productPrice": Number
        }
    ],
    'addressList': [
        {
            "addressId": Number,
            "userName": String,
            "streetName": String,
            "tel": Number,
            "isDefault": Boolean
        }
    ]
},{ usePushEach: true })
module.exports = mongoose.model('User', userSchema)
