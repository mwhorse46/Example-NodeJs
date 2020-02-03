var sapphiredb = require('sapphiredb');
var operators = require('rxjs/operators');
var inquirer = require('inquirer');
var ws = require('ws');
WebSocket = ws;

var exampleCollection;

var db = new sapphiredb.SapphireDb({
    serverBaseUrl: 'sapphiredb-demo.azurewebsites.net',
    useSsl: true
});

async function selectAction() {
    var nextAction = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: ['Add value', 'Update value', 'Remove value', 'Exit']
        }
    ]);

    if (nextAction.action === 'Add value') {
        var newValue = await inquirer.prompt([
            {
                type: 'input',
                name: 'content',
                message: 'New content:'
            }
        ]);

        exampleCollection.add(newValue);
    } else if (nextAction.action === 'Update value') {
        var value = await inquirer.prompt([
            {
                type: 'number',
                name: 'id',
                message: 'Id:'
            },
            {
                type: 'input',
                name: 'content',
                message: 'New content:'
            }
        ]);

        exampleCollection.update(value);
    } else if (nextAction.action === 'Remove value') {
        var value = await inquirer.prompt([
            {
                type: 'number',
                name: 'id',
                message: 'Id:'
            }
        ]);

        exampleCollection.remove(value);
    } else {
        process.exit();
        return;
    }

    selectAction();
}

function basic() {
    exampleCollection = db.collection('basic.examples');
    var examples$ = exampleCollection.values();
    var examplesSubscription = examples$.subscribe(function (examples) {
        console.clear();
        console.table(examples);
    });

    selectAction();
}

var messageCollection;

async function chatMain(currentUser, chatPartner) {
    var newValue = await inquirer.prompt([
        {
            type: 'input',
            name: 'content',
            message: 'New message:'
        }
    ]);
    messageCollection.add({
        content: newValue.content,
        ownerId: currentUser.id,
        receiverId: chatPartner.id
    });
    chatMain(currentUser, chatPartner);
}

async function chat() {
    var users = await db.collection('chat.users').values().pipe(operators.take(1)).toPromise();

    var currentUser = (await inquirer.prompt([
        {
            type: 'list',
            name: 'user',
            message: 'Select a username:',
            choices: users.map(function (value) {
                value.value = JSON.parse(JSON.stringify(value));
                value.name = value.username;
                return value;
            })
        }
    ])).user;

    var chatPartner = (await inquirer.prompt([
        {
            type: 'list',
            name: 'user',
            message: 'Select a username:',
            choices: users.filter(function (user) {
                return user.id !== currentUser.id;
            }).map(function (value) {
                value.value = JSON.parse(JSON.stringify(value));
                value.name = value.username;
                return value;
            })
        }
    ])).user;

    messageCollection = db.collection('chat.messages').where([
        [['ownerId', '==', currentUser.id], 'and', ['receiverId', '==', chatPartner.id]],
        'or',
        [['ownerId', '==', chatPartner.id], 'and', ['receiverId', '==', currentUser.id]]
    ]);

    var messages$ = messageCollection.values();
    var messagesSubscription = messages$.subscribe(function (messages) {
        console.clear();
        console.table(messages.map(function (value) {
            return {
                received: currentUser.id !== value.ownerId ? value.content : null,
                sent: currentUser.id === value.ownerId ? value.content : null,
                date: value.createdOn
            };
        }));
    });

    chatMain(currentUser, chatPartner);
}

async function main() {
    var mode = await inquirer.prompt([
        {
            type: 'list',
            name: 'mode',
            message: 'What mode do you want to use?',
            choices: ['Basic', 'Chat']
        }
    ]);

    if (mode.mode === 'Basic') {
        basic();
    } else {
        chat();
    }
}
main();
