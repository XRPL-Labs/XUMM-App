/**
 * Push Notification service
 * handle push notification permission and received notifications
 */
import { get } from 'lodash';
import { Alert, NativeModules } from 'react-native';

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Payload } from '@common/libs/payload';

import LoggerService from '@services/LoggerService';
import NavigationService from '@services/NavigationService';

import Localize from '@locale';

import EventEmitter from 'events';

/* Constants  ==================================================================== */
const { LocalNotificationModule } = NativeModules;

// events
declare interface PushNotificationsService {
    on(event: 'signRequestUpdate', listener: () => void): this;
    on(event: string, listener: Function): this;
}

/* Service  ==================================================================== */
class PushNotificationsService extends EventEmitter {
    initialized: boolean;
    logger: any;

    constructor() {
        super();
        this.initialized = false;
        this.logger = LoggerService.createLogger('Push');
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
            try {
                return this.checkPermission()
                    .then((hasPermission: boolean) => {
                        if (hasPermission) {
                            this.onPermissionGranted();
                        } else {
                            this.logger.warn('Push don"t have the right permission');
                        }
                        return resolve();
                    })
                    .catch((e) => {
                        return reject(e);
                    });
            } catch (e) {
                return reject(e);
            }
        });
    };

    setBadge = async (badge?: number) => {
        // this.badge = badge;
        // set badge count on tabbar
        if (typeof badge !== 'undefined') {
            await LocalNotificationModule.setBadge(badge);
            Navigator.setBadge(AppScreens.TabBar.Events, badge === 0 ? '' : badge.toString());
        } else {
            const appBadge = await LocalNotificationModule.getBadge();
            Navigator.setBadge(AppScreens.TabBar.Events, appBadge === 0 ? '' : appBadge.toString());
        }
    };

    onPermissionGranted = async () => {
        if (!this.initialized) {
            this.prepareNotifications();
            this.createNotificationListeners();
            this.initialized = true;
        }
    };

    checkPermission = async (): Promise<boolean> => {
        const authStatus = await messaging().hasPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            const token = await this.getToken();
            return !!token;
        }
        return false;
    };

    getToken = (): Promise<string> => {
        return messaging()
            .getToken()
            .then((token) => {
                return token;
            })
            .catch((e) => {
                this.logger.error('Cannot get token from firebase', e);
                return undefined;
            });
    };

    requestPermission = async (): Promise<boolean> => {
        try {
            await messaging().requestPermission();
            const token = await this.getToken();
            this.onPermissionGranted();
            return !!token;
        } catch (error) {
            /* User has rejected permissions */
            return false;
        }
    };

    prepareNotifications = () => {};

    createNotificationListeners = async () => {
        await messaging().getToken();

        messaging().onMessage(this.handleNotification);
        messaging().onNotificationOpenedApp(this.handleNotificationOpen);
    };

    isSignRequest = (notification: any) => {
        return get(notification, ['data', 'category']) === 'SIGNTX';
    };

    /* If the app was launched by a push notification  */
    checkInitialNotification = async () => {
        const notificationOpen = await messaging().getInitialNotification();
        if (notificationOpen) {
            this.handleNotificationOpen(notificationOpen);
        }
    };

    /* Handle notifications within the app when app is running in foreground */
    handleNotification = (message: FirebaseMessagingTypes.RemoteMessage) => {
        const isSignRequest = this.isSignRequest(message);
        const shouldShowNotification =
            isSignRequest && NavigationService.getCurrentScreen() !== AppScreens.Modal.ReviewTransaction;

        LocalNotificationModule.complete(message.messageId, shouldShowNotification);

        if (isSignRequest) {
            this.emit('signRequestUpdate');
        }

        // update badge
        this.setBadge();
    };

    /* Handle notifications when app is open from the notification */
    handleNotificationOpen = async (notification: any) => {
        if (!notification) return;

        if (this.isSignRequest(notification)) {
            // get payload uuid
            const payloadUUID = get(notification, ['data', 'payload']);

            if (payloadUUID) {
                await Payload.from(payloadUUID)
                    .then((payload) => {
                        // show review transaction screen
                        Navigator.showModal(
                            AppScreens.Modal.ReviewTransaction,
                            { modalPresentationStyle: 'fullScreen' },
                            {
                                payload,
                            },
                        );
                    })
                    .catch((e) => {
                        Alert.alert(Localize.t('global.error'), e.message);
                        this.logger.error('Cannot fetch payload from backend', payloadUUID);
                    });
            }
        }
    };
}

export default new PushNotificationsService();
