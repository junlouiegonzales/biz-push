# biz-push

An implementation of brower push notification using firebase API and hook to raix:push app collection

## Installation and configuration
- meteor add `jhunlouiegonzales:biz-push`
- create these following snippet and place it under public/firebase folder

</br>
/// app_manifest.json
</br>
<pre>
<code>
{  
    "gcm_sender_id": ""
}
</code>
</pre>
/// app_service_worker.js
</br>
<pre>
<code>
importScripts('https://www.gstatic.com/firebasejs/5.3.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.3.0/firebase-messaging.js');

const apiKey = new URL(location).searchParams.get('apiKey');
const authDomain = new URL(location).searchParams.get('authDomain');
const databaseURL = new URL(location).searchParams.get('databaseURL');
const projectId = new URL(location).searchParams.get('projectId');
const storageBucket = new URL(location).searchParams.get('storageBucket');
const messagingSenderId = new URL(location).searchParams.get('messagingSenderId');

const fbase = firebase.initializeApp({
    apiKey: apiKey,
    authDomain: authDomain,
    databaseURL: databaseURL,
    projectId: projectId,
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId
});

const messaging = fbase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    return self.registration.showNotification();
});
</code>
</pre>

- Add these following configuration to your settings.json file.
<pre>
<code>
{
    "public": 
    {
        "fcm": {
            "apiKey": "",
            "authDomain": "",
            "databaseURL": "",
            "projectId": "",
            "storageBucket": "",
            "messagingSenderId": "",
            "appId": ""
        },
    }
}
</code>
</pre>

## Using the pushSend api
<pre>
<code>
import { sendPush } from 'meteor/jhunlouiegonzales:biz-push';

const notifications = [
    {
        userId: 'The userId of the user that you want to send the message',
        message: 'This is a test message'
    }
]

sendPush(notifications, {
    title: '',
    click_action: '',
    icon: '',
    badge: '',
});
</code>
</pre>


