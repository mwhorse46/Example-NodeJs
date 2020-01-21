var sapphiredb = require('sapphiredb');

var ws = require('ws');
WebSocket = ws;

var db = new sapphiredb.SapphireDb({
    serverBaseUrl: 'localhost:5000',
    useSsl: false,
    apiKey: 'webapp',
    apiSecret: 'pw1234'
});

db.collection('demo.entries').values().subscribe(function (values) {
    console.log(values);
});

db.execute('example', 'AsyncDelay').subscribe(function (value) {
    console.log(value);
});
