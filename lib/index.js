'use strict';
import { DeviceEventEmitter, NativeModules } from "react-native";
const { NotificationModule } = NativeModules;
export const notification = {
    create: (attributes) => new Promise((resolve, reject) => {
        NotificationModule.rGetApplicationName((e) => {
            reject(e);
        }, (applicationName) => {
            // Set defaults
            if (!attributes.subject)
                attributes.subject = applicationName;
            attributes = encodeNativeNotification(attributes);
            NotificationModule.rCreate(attributes.id, attributes, reject, (notification) => {
                resolve(decodeNativeNotification(notification));
            });
        });
    }),
    getIDs: () => new Promise((resolve, reject) => {
        NotificationModule.rGetIDs(reject, resolve);
    }),
    find: (id) => new Promise((resolve, reject) => {
        NotificationModule.rFind(id, reject, (notification) => {
            resolve(decodeNativeNotification(notification));
        });
    }),
    delete: (id) => new Promise((resolve, reject) => {
        NotificationModule.rDelete(id, reject, (notification) => {
            resolve(decodeNativeNotification(notification));
        });
    }),
    deleteAll: () => new Promise((resolve, reject) => {
        NotificationModule.rDeleteAll(reject, resolve);
    }),
    clear: (id) => new Promise((resolve, reject) => {
        NotificationModule.rClear(id, reject, (notification) => {
            resolve(decodeNativeNotification(notification));
        });
    }),
    clearAll: () => new Promise((resolve, reject) => {
        NotificationModule.rClearAll(reject, resolve);
    }),
    addListener: (type, listener) => {
        switch (type) {
            case 'press':
            case 'click':
                DeviceEventEmitter.addListener('sysNotificationClick', listener);
                NotificationModule.getInitialSysNotification(function (initialSysNotificationId, initialSysNotificationAction, initialSysNotificationPayload) {
                    if (initialSysNotificationId) {
                        const event = {
                            action: initialSysNotificationAction,
                            payload: JSON.parse(initialSysNotificationPayload)
                        };
                        listener(event);
                        NotificationModule.removeInitialSysNotification();
                    }
                });
                break;
        }
    },
    removeAllListeners: function (type) {
        switch (type) {
            case 'press':
            case 'click':
                DeviceEventEmitter.removeAllListeners('sysNotificationClick');
                break;
        }
    },
};
const encodeNativeNotification = (attributes) => {
    // Set defaults
    if (!attributes.smallIcon)
        attributes.smallIcon = 'ic_launcher_foreground';
    if (!attributes.id)
        attributes.id = Math.round(Math.random() * 100000);
    if (!attributes.action)
        attributes.action = 'DEFAULT';
    if (!attributes.payload)
        attributes.payload = {};
    if (!attributes.channelId)
        attributes.channelId = "default-channel";
    if (!attributes.channelName)
        attributes.channelName = "default-channel";
    if (!attributes.channelDescription)
        attributes.channelDescription = "default-channel";
    if (attributes.autoClear === undefined)
        attributes.autoClear = true;
    if (attributes.tickerText === undefined) {
        if (attributes.subject) {
            attributes.tickerText = attributes.subject + ': ' + attributes.message;
        }
        else {
            attributes.tickerText = attributes.message;
        }
    }
    if (attributes.priority === undefined)
        attributes.priority = 1;
    if (attributes.sound === undefined)
        attributes.sound = 'default';
    if (attributes.vibrate === undefined)
        attributes.vibrate = 'default';
    if (attributes.lights === undefined)
        attributes.lights = 'default';
    attributes.delayed = (attributes.delay !== undefined);
    attributes.scheduled = (attributes.sendAt !== undefined);
    // Ensure date are Dates
    if (attributes.sendAt && typeof attributes.sendAt !== 'object')
        attributes.sendAt = new Date(attributes.sendAt);
    if (attributes.endAt && typeof attributes.endAt !== 'object')
        attributes.endAt = new Date(attributes.endAt);
    if (attributes.when && typeof attributes.when !== 'object')
        attributes.when = new Date(attributes.when);
    // Unfold sendAt
    if (attributes.sendAt instanceof Date) {
        attributes.sendAtYear = attributes.sendAt.getFullYear();
        attributes.sendAtMonth = attributes.sendAt.getMonth() + 1;
        attributes.sendAtDay = attributes.sendAt.getDate();
        attributes.sendAtWeekDay = attributes.sendAt.getDay();
        attributes.sendAtHour = attributes.sendAt.getHours();
        attributes.sendAtMinute = attributes.sendAt.getMinutes();
    }
    // Convert date objects into number
    if (attributes.sendAt instanceof Date)
        attributes.sendAt = attributes.sendAt.getTime();
    if (attributes.endAt instanceof Date)
        attributes.endAt = attributes.endAt.getTime();
    if (attributes.when instanceof Date)
        attributes.when = attributes.when.getTime();
    // Prepare scheduled notifications
    if (attributes.sendAt !== undefined) {
        // Set repeatType for custom repeat time
        if (typeof attributes.repeatEvery === 'number') {
            attributes.repeatType = 'time';
            attributes.repeatTime = attributes.repeatEvery;
        }
        else if (typeof attributes.repeatEvery === 'string') {
            attributes.repeatType = attributes.repeatEvery;
        }
        // Native module only recognizes the endAt attribute, so we need to
        // convert repeatCount to the endAt time base on repeatEvery
        if (attributes.repeatCount) {
            if (typeof attributes.repeatEvery === 'number' && typeof attributes.sendAt === "number") {
                attributes.endAt = Math.round(attributes.sendAt + attributes.repeatEvery * attributes.repeatCount + (attributes.repeatEvery / 2));
            }
            else if (typeof attributes.repeatEvery === 'string' && typeof attributes.sendAt === "number") {
                switch (attributes.repeatEvery) {
                    case 'minute':
                        attributes.endAt = attributes.sendAt + 60000 * attributes.repeatCount + 1000 * 30;
                        break;
                    case 'hour':
                        attributes.endAt = attributes.sendAt + 60000 * 60 * attributes.repeatCount + 60000 * 30;
                        break;
                    case 'halfDay':
                        attributes.endAt = attributes.sendAt + 60000 * 60 * 12 * attributes.repeatCount + 60000 * 60 * 6;
                        break;
                    case 'day':
                        attributes.endAt = attributes.sendAt + 60000 * 60 * 24 * attributes.repeatCount + 60000 * 60 * 12;
                        break;
                    case 'week':
                        attributes.endAt = attributes.sendAt + 60000 * 60 * 24 * 7 * attributes.repeatCount + 60000 * 60 * 24 * 3;
                        break;
                    case 'month':
                        attributes.endAt = attributes.sendAt + 60000 * 60 * 24 * 30 * attributes.repeatCount + 60000 * 60 * 24 * 15;
                        break;
                    case 'year':
                        attributes.endAt = attributes.sendAt + 60000 * 60 * 24 * 365 * attributes.repeatCount + 60000 * 60 * 24 * 100;
                        break;
                }
            }
        }
    }
    // Convert long numbers into string before passing them into native module,
    // increase of integer overflow
    if (typeof attributes.sendAt === "number")
        attributes.sendAt = attributes.sendAt.toString();
    if (typeof attributes.endAt === "number")
        attributes.endAt = attributes.endAt.toString();
    if (typeof attributes.when === "number")
        attributes.when = attributes.when.toString();
    if (typeof attributes.repeatEvery === "number")
        attributes.repeatEvery = attributes.repeatEvery.toString();
    // Convert float into integer
    if (attributes.progress)
        attributes.progress = attributes.progress * 1000;
    // Stringify the payload
    attributes.payload = JSON.stringify(attributes.payload);
    // Convert float into integer
    if (attributes.progress)
        attributes.progress = attributes.progress * 1000;
    // Stringify the payload
    attributes.payload = JSON.stringify(attributes.payload);
    return attributes;
};
// Decode the notification data from the native module to pass into J
const decodeNativeNotification = (attributes) => {
    // Convert dates back to date object
    if (attributes.sendAt)
        attributes.sendAt = new Date(parseInt(attributes.sendAt));
    if (attributes.endAt)
        attributes.endAt = new Date(parseInt(attributes.endAt));
    if (attributes.when)
        attributes.when = new Date(parseInt(attributes.when));
    // Parse possible integer
    if (parseInt(attributes.repeatEvery).toString() === attributes.repeatEvery)
        attributes.repeatEvery = parseInt(attributes.repeatEvery);
    // Convert integer into float
    if (attributes.progress)
        attributes.progress = attributes.progress / 1000;
    // Parse the payload
    if (attributes.payload)
        attributes.payload = JSON.parse(attributes.payload);
    return attributes;
};
DeviceEventEmitter.addListener('sysModuleNotificationClick', function (e) {
    const event = {
        action: e.action,
        payload: JSON.parse(e.payload)
    };
    DeviceEventEmitter.emit('sysNotificationClick', event);
});
