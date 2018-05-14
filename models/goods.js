var mongoose = require('mongoose')
// 表模型
var produtSchema = new mongoose.Schema({
    'productId': { 
        type: 'string', 
        unique: true 
    },
    'salePrice': Number,
    'productName': String,
    'productImageSmall': Array,
    'productImageBig': String,
    'stock': Number,
    'sub_title': String,
    'limit_num': String,
    'productMsg': Object
},{ usePushEach: true })
module.exports = mongoose.model('Good', produtSchema)