import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { errorMsg } from '../plugins';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';

const PushCollection = new Mongo.Collection('_raix_push_app_tokens');
PushCollection.createIndex({ userId: 1 });

const fcmSendUrl = 'https://fcm.googleapis.com/fcm/send';

const headers = {
    'Content-Type': 'application/json',
    Authorization: `key=${Meteor.settings.private.gcm.apiKey}`,
};

export const sendPush = (notif, option) => {
    errorMsg(`Push: sending push notifications for user ${JSON.stringify(notif)}`);

    check(notif, [
        {
            userId: String,
            message: String,
        },
    ]);

    check(option, {
        title: String,
        click_action: Match.Maybe(String),
        icon: Match.Maybe(String),
        badge: Match.Maybe(String),
    });

    const userIds = notif.map((t) => t.userId);
    const appCollections = PushCollection.find({ userId: { $in: userIds } }).fetch();

    for (const t of appCollections) {
        if (t.token && t.token.gcm) {
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

            HTTP.post(fcmSendUrl, { headers, data }, (error, response) => {
                if (error) {
                    errorMsg(`ERROR: ${error}`);
                } else {
                    errorMsg(`BROWSER: Result of sender: ${JSON.stringify(response.content)}`);
                }
            });

            errorMsg(`Push: Send message to ${t.userId}`);
        } else errorMsg(`Push, GUIDE: unable to send pus to userId ${t.userId} because user not registered yet...`);
    }
};

Meteor.methods({
    'biz-push:token': function (currentToken, token) {
        if (token) {
            PushCollection.update(
                { token: currentToken },
                {
                    $set: {
                        token: token,
                        updatedAt: new Date(),
                    },
                },
                { multi: true }
            );
        }

        if (!token) {
            PushCollection.update(
                { token: currentToken },
                { $unset: { token: true } },
                { $set: { updatedAt: new Date() } },
                { multi: true }
            );
        }

        errorMsg(`Push: Token refresh`);
    },

    'biz-push:error': function (currentToken) {
        PushCollection.update(
            { token: currentToken },
            { $unset: { token: true } },
            { $set: { updatedAt: new Date() } },
            { multi: true }
        );
    },

    'biz-push:setuser': function (token) {
        let doc = PushCollection.findOne({ userId: this.userId });

        if (!doc) {
            doc = PushCollection.findOne({ $and: [{ token: token }, { token: { $exists: true } }] });
        }

        if (!doc) {
            PushCollection.insert({
                _id: Random.id(),
                appName: 'main',
                token: token,
                userId: this.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        if (doc) {
            PushCollection.update(
                { _id: doc._id },
                {
                    $set: {
                        updatedAt: new Date(),
                        token: token,
                    },
                }
            );
        }

        if (doc && doc.token) {
            const remove = PushCollection.remove({
                $and: [{ _id: { $ne: doc._id } }, { token: token }, { token: { $exists: true } }],
            });

            if (remove) errorMsg(`Push: Remove existing ${remove} app items`);
        }

        if (doc) errorMsg(`Push: Updated, ${JSON.stringify(doc)}`);

        if (!doc) throw new Meteor.Error(500, 'setuser could not create record.');

        return doc;
    },
});
