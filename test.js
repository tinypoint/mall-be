// 阿里沙箱支付
var path = require('path')
var Alipay = require('alipay-node-sdk')
var outTradeId = Date.now().toString()
var ali = new Alipay({
    appId: '2016091400513255',
    notifyUrl: 'http://39.107.236.248/goods/aliback',
    rsaPrivate: path.resolve('./rsa/private.txt'),
    rsaPublic: path.resolve('./rsa/public.txt'),
    sandbox: true,
    signType: 'RSA2'
});
var params = ali.pagePay({
    subject: '测试商品',
    body: '测试商品描述',
    outTradeId: outTradeId,
    timeout: '10m',
    amount: '10.00',
    goodsType: '0',
    qrPayMode: 0
});
console.log(params);

const https = require('https');
  
const options = {
hostname: 'openapi.alipaydev.com',
path: '/gateway.do',
method: 'POST',
headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
}
};
  
const req = https.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`响应主体: ${chunk}`);
    });
    res.on('end', () => {
        console.log('响应中已无数据。');
    });
});

req.on('error', (e) => {
    console.error(`请求遇到问题: ${e.message}`);
});

// 写入数据到请求主体
req.write(params);
req.end();