var mongoose = require('mongoose')
// 表模型

var recommendSchema = new mongoose.Schema({
    'image': Object,
    'tabs': Array,
},{ usePushEach: true })
module.exports = mongoose.model('Recommend', recommendSchema)