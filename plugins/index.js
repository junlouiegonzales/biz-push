import { Meteor } from 'meteor/meteor';

const localStorageKey = 'biz-push';

export const errorMsg = (msg) => {
    if (Meteor.isDevelopment) console.log(msg);
};

export const isChromeSupported = () => {
    const { userAgent } = navigator;
    const isChrome = userAgent.indexOf('Chrome') !== -1;

    const chrome = userAgent.match(/Chrome\/([0-9]+)/);
    const isVer = chrome && parseInt(chrome[1]) >= 68;

    return isChrome && isVer;
};

export const isFirefoxSupported = () => {
    const { userAgent } = navigator;
    const isFirefox = userAgent.indexOf('Firefox') !== -1;

    const firefox = userAgent.match(/Firefox\/([0-9]+)\./);
    const isVer = firefox && parseInt(firefox[1]) >= 61;

    return isFirefox && isVer;
};

export const getStorageToken = () => JSON.parse(localStorage.getItem(localStorageKey));

export const saveStorageToken = (value) => localStorage.setItem(localStorageKey, JSON.stringify(value));
