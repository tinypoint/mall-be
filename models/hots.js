var mongoose = require('mongoose')
// 表模型
var hotSchema = new mongoose.Schema({
    'productId': { 
        type: 'string', 
        unique: true 
    }
},{ usePushEach: true })
module.exports = mongoose.model('Hot', hotSchema)