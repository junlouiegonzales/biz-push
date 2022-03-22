Package.describe({
    name: 'jhunlouiegonzales:biz-push',
    version: '0.0.1',
    summary: '',
    git: 'https://github.com/junlouiegonzales/biz-push',
    documentation: 'README.md',
});

Npm.depends({
    firebase: '7.24.0',
});

Package.onUse(function (api) {
    api.versionsFrom('2.6.1');
    api.use(['ecmascript', 'mongo', 'check']);

    api.mainModule('lib/server.js', 'server');
    api.mainModule('lib/client.js', 'client');

    api.export('getToken', 'client');
    api.export('sendPush', 'server');
});

Package.onTest(function (api) {
    api.use('ecmascript');
    api.use('tinytest');
    api.use('jhunlouiegonzales:biz-push');
    api.mainModule('biz-push-tests.js');
});
