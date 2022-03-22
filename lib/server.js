import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { errorMsg } from '../plugins';
import { HTTP } from 'meteor/http';

const PushCollection = new Mongo.Collection('_raix_push_app_tokens');
PushCollection.createIndex({ userId: 1 });

const fcmSendUrl = 'https://fcm.googleapis.com/fcm/send';

const fcmHeaders = {
    'Content-Type': 'application/json',
    Authorization: `key=${Meteor.settings.private.gcm.apiKey}`,
};

export const sendPush = (notif, option) => {
    const userIds = notif.map((t) => t.userId);

    const findAsync = Meteor.wrapAsync(PushCollection.find, PushCollection);
    const appCollections = findAsync({ userId: { $in: userIds } });

    appCollections.forEach((t) => {
        if (!t.token && t.token.gcm) {
            const notification = notif.find((n) => n.userId == t.userId);
            if (!notification) return;

            const data = {
                notification: {
                    title: option.title,
                    body: notification.message,
                    click_action: option.click_action,
                    icon: option.icon,
                    badge: option.badge,
                },
                to: t.token.gcm,
            };

            const postAsync = Meteor.wrapAsync(HTTP.post, HTTP);
            postAsync(fcmSendUrl, { fcmHeaders, data }, (error, response) => {
                if (error) {
                    errorMsg(`ERROR: ${error}`);
                } else {
                    errorMsg(`BROWSER: Result of sender: ${JSON.stringify(response.content)}`);
                }
            });

            errorMsg(`Push: Send message to ${t.userId}`);
        } else errorMsg(`Push, GUIDE: unable to send pus to userId ${t.userId} because user not registered yet...`);
    });
};

Meteor.methods({
    'biz-push:token': function (currentToken, token) {
        check(currentToken, Match.Maybe(Object));
        check(currentToken.gcm, Match.Maybe(String));
        check(token, Match.Maybe(Object));
        check(token.gcm, Match.Maybe(String));

        if (token) PushCollection.update({ token: currentToken }, { $set: { token: token } }, { multi: true });
        if (!token) PushCollection.update({ token: currentToken }, { $unset: { token: true } }, { multi: true });
    },

    'biz-push:error': function (currentToken) {
        check(currentToken, Match.Maybe(Object));
        check(currentToken.gcm, Match.Maybe(String));

        PushCollection.update({ token: currentToken }, { $unset: { token: true } }, { multi: true });
    },
});
