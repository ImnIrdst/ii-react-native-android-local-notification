declare type EventType = 'press' | 'click';
declare type TimeInterval = 'minute' | 'hour' | 'halfDay' | 'day' | 'week' | 'month' | 'year';
declare type Category = 'alarm' | 'call' | 'email' | 'event' | 'progress' | 'reminder' | 'social';
declare type EventCallback<P = {}> = (e: Event<P>) => void;
interface Attributes<P = {}> {
    id?: number;
    subject?: string;
    message: string;
    action?: string;
    payload?: P;
    delay?: number;
    sendAt?: Date | number | string;
    sendAtYear?: number;
    sendAtMonth?: number;
    sendAtDay?: number;
    sendAtWeekDay?: number;
    sendAtHour?: number;
    sendAtMinute?: number;
    repeatEvery?: TimeInterval | number | string;
    repeatCount?: number;
    repeatTime?: number;
    repeatType?: string;
    endAt?: Date | number | string;
    delayed?: boolean;
    scheduled?: boolean;
    channelId?: string;
    channelName?: string;
    channelDescription?: string;
    priority?: number;
    smallIcon?: string;
    largeIcon?: string;
    sound?: string | null;
    vibrate?: string | null;
    lights?: string | null;
    autoClear?: boolean;
    onlyAlertOnce?: boolean;
    tickerText?: string | null;
    when?: Date | number | string;
    bigText?: string;
    bigStyleImageBase64?: string;
    subText?: string;
    progress?: number;
    color?: string;
    number?: number;
    private?: boolean;
    ongoing?: boolean;
    category?: Category;
    localOnly?: boolean;
}
interface Event<P = {}> {
    action: string;
    payload: P;
}
interface INotification {
    create: <P = {}>(notification: Attributes<P>) => Promise<Attributes<P>>;
    addListener: <P = {}>(type: EventType, callback: EventCallback<P>) => void;
    removeAllListeners: (type: EventType) => void;
    getIDs: () => Promise<number[]>;
    find: <P = {}>(id: number) => Promise<Attributes<P>>;
    delete: <P = {}>(id: number) => Promise<Attributes<P>>;
    deleteAll: () => Promise<void>;
    clear: <P = {}>(id: number) => Promise<Attributes<P>>;
    clearAll: () => Promise<void>;
}
export declare const notification: INotification;
export {};
