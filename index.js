var sapphiredb = require('sapphiredb');
var operators = require('rxjs/operators');
var readline = require('readline');

var ws = require('ws');
WebSocket = ws;

var db = new sapphiredb.SapphireDb({
    serverBaseUrl: 'sapphiredb-demo.azurewebsites.net',
    useSsl: true
});

var exampleCollection = db.collection('basic.examples');
var examples$ = exampleCollection.values();

var examplesSubscription = examples$.subscribe(function (examples) {
    console.log('\x1b[32m%s\x1b[0m', 'Examples:');
    console.table(examples);
});
var newContentQuestion = function () {
    var reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    reader.question('New content: (stop to stop adding entries)', function (content) {
        reader.close();

        if (content === 'stop') {
            examplesSubscription.unsubscribe();
            return;
        }

        exampleCollection.add({
            content: content
        });

        newContentQuestion();
    });
};

newContentQuestion();



