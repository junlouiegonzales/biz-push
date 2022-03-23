import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import firebase from 'firebase/app';
import 'firebase/messaging';
import { errorMsg, isChromeSupported, isFirefoxSupported, getStorageToken, saveStorageToken } from '../plugins';

if (location.protocol == 'http:') {
    // check if current browser is supported push notification
    if (isChromeSupported() || isFirefoxSupported()) {
        // Start tracking the user then update the apptokencollection
        Tracker.autorun(() => {
            if (Meteor.userId()) {
                Meteor.call('biz-push:setuser', getStorageToken(), (error) => {
                    if (error) errorMsg(error);
                });
            }
        });

        // create and attatch a link element for manifest.json
        const config = Meteor.settings.public.fcm;
        const manifest = document.createElement('link');
        manifest.setAttribute('rel', 'manifest');
        manifest.setAttribute('href', '/firebase/app_manifest.json');
        document.head.appendChild(manifest);

        // inialize firebase
        const fbase = firebase.initializeApp(config);
        const messaging = fbase.messaging();

        // check if service worker is supported
        if ('serviceWorker' in navigator) {
            const { apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId } = config;

            // construct URL params to handle firebase config per environment
            const swParams = `apiKey=${apiKey}&authDomain=${authDomain}&databaseURL=${databaseURL}&projectId=${projectId}&storageBucket=${storageBucket}&messagingSenderId=${messagingSenderId}`;
            const url = `/firebase/app_service_worker.js?${swParams}`;
            const storedToken = getStorageToken();

            const getToken = () => {
                messaging
                    .getToken()
                    .then((token) => {
                        if (token) {
                            saveStorageToken({ gcm: token });
                            Meteor.call('biz-push:token', storedToken, { gcm: token }, (error) => {
                                if (error) errorMsg(error);
                            });
                        }
                    })
                    .catch((err) => {
                        errorMsg(err);
                        Meteor.call('biz-push:error', storedToken, (error) => {
                            if (error) errorMsg(error);
                        });
                    });
            };

            // register service worker
            navigator.serviceWorker
                .register(url)
                .then((registration) => {
                    messaging.useServiceWorker(registration);
                    messaging
                        .requestPermission()
                        .then(() => getToken())
                        .catch((err) => errorMsg(`FCM: Unable to get permission to notify' ${err}`));

                    // callback fired if Instance ID token is updated.
                    messaging.onTokenRefresh(() => getToken());
                })
                .catch((err) => errorMsg(`FCM: Unable to register service worker' ${err}`));
        } else errorMsg('Service Worker is not supported');
    } else
        errorMsg(
            `Your browser doesn't support push notification. Please use the latest version of chrome or firefox only${'.'}`
        );
}
