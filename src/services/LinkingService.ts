/**
 * DeepLink service
 * handle app deep linking
 */

import EventEmitter from 'events';
import { Linking, Alert } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { StringTypeDetector, StringDecoder, StringType, XrplDestination, PayId } from 'xumm-string-decode';

import NavigationService from '@services/NavigationService';

import { Payload, PayloadOrigin } from '@common/libs/payload';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';
import { AppScreens } from '@common/constants';

import { NormalizeDestination } from '@common/libs/utils';

import Localize from '@locale';

/* Service  ==================================================================== */
class LinkingService extends EventEmitter {
    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                NavigationService.on('setRoot', async (root: string) => {
                    if (root === 'DefaultStack') {
                        // Listen for deep link as the app is open
                        Linking.addEventListener('url', this.handleDeepLink);
                    }
                });
                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    checkInitialDeepLink = () => {
        // handle if app opens with link
        Linking.getInitialURL().then((url) => {
            setTimeout(() => {
                this.handleDeepLink({ url });
            }, 100);
        });
    };

    handlePayloadReference = async (uuid: string) => {
        try {
            // fetch the payload
            const payload = await Payload.from(uuid, PayloadOrigin.DEEP_LINK);

            // review the transaction
            Navigator.showModal(
                AppScreens.Modal.ReviewTransaction,
                { modalPresentationStyle: 'fullScreen' },
                { payload },
            );
        } catch (e) {
            Alert.alert(Localize.t('global.error'), e.message, [{ text: 'OK' }], { cancelable: false });
        }
    };

    handleSignedTransaction = (txblob: string) => {
        Alert.alert(
            Localize.t('global.signedTransaction'),
            Localize.t('global.signedTransactionDetectedSubmit'),
            [
                {
                    text: Localize.t('global.cancel'),
                },
                {
                    text: Localize.t('global.submit'),
                    onPress: () => {
                        Navigator.showModal(
                            AppScreens.Modal.Submit,
                            { modalPresentationStyle: 'fullScreen' },
                            { txblob },
                        );
                    },
                    style: 'default',
                },
            ],
            { cancelable: false },
        );
    };

    handleXrplDestination = async (destination: XrplDestination & PayId) => {
        if (destination.payId) {
            Navigator.push(
                AppScreens.Transaction.Payment,
                {},
                {
                    scanResult: {
                        to: destination.payId,
                    },
                },
            );
            return;
        }

        let amount;

        const { to, tag } = NormalizeDestination(destination);

        // if amount present as XRP pass the amount
        if (!destination.currency && destination.amount) {
            amount = destination.amount;
        }

        Navigator.push(
            AppScreens.Transaction.Payment,
            {},
            {
                scanResult: {
                    to,
                    tag,
                },
                amount,
            },
        );
    };

    handleXAPPLink = (url: string, parsed: { xapp: string; path: string; params: any }) => {
        Navigator.showModal(
            AppScreens.Modal.XAppBrowser,
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
            {
                identifier: parsed.xapp,
                origin: PayloadOrigin.DEEP_LINK,
                originData: { url },
                path: parsed.path,
                params: parsed.params,
            },
        );
    };

    handleAlternativeSeedCodec = (parsed: {
        name: string;
        alphabet: string | boolean;
        params?: Record<string, unknown>;
    }) => {
        const { alphabet } = parsed;
        if (alphabet) {
            Navigator.push(
                AppScreens.Account.Import,
                {},
                {
                    alternativeSeedAlphabet: parsed,
                },
            );
        }
    };

    handleXummFeature = (parsed: { feature: string; type: string; params?: Record<string, unknown> }) => {
        const { feature, type } = parsed;

        // Feature: allow import of Secret Numbers without Checksum
        if (feature === 'secret' && type === 'offline-secret-numbers') {
            Prompt(
                Localize.t('global.warning'),
                Localize.t('account.importSecretWithoutChecksumWarning'),
                [
                    {
                        text: Localize.t('global.cancel'),
                    },
                    {
                        text: Localize.t('global.continue'),
                        style: 'destructive',
                        onPress: () => {
                            Navigator.push(
                                AppScreens.Account.Import,
                                {},
                                {
                                    importOfflineSecretNumber: true,
                                },
                            );
                        },
                    },
                ],
                { type: 'default' },
            );
        }
    };

    handle = (url: string) => {
        const detected = new StringTypeDetector(url);

        // normalize detected type
        let detectedType = detected.getType();

        if (detectedType === StringType.PayId) {
            detectedType = StringType.XrplDestination;
        }

        const parsed = new StringDecoder(detected).getAny();

        // the screen will handle the content
        switch (detected.getType()) {
            case StringType.XummPayloadReference:
                this.handlePayloadReference(parsed.uuid);
                break;
            case StringType.XrplSignedTransaction:
                this.handleSignedTransaction(parsed.txblob);
                break;
            case StringType.XrplDestination:
            case StringType.PayId:
                this.handleXrplDestination(parsed);
                break;
            case StringType.XummXapp:
                this.handleXAPPLink(url, parsed);
                break;
            case StringType.XrplAltFamilySeedAlphabet:
                this.handleAlternativeSeedCodec(parsed);
                break;
            case StringType.XummFeature:
                this.handleXummFeature(parsed);
                break;
            default:
                break;
        }
    };

    handleDeepLink = async ({ url }: { url: string }) => {
        // ignore if the app is not initialized or not url
        if (!url || typeof url !== 'string') return;

        this.handle(url);
    };
}

export default new LinkingService();
