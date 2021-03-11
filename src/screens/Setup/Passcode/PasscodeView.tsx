/**
 * Setup Passcode Screen
 */

import React, { Component } from 'react';

import { SafeAreaView, View, Text, Image, LayoutAnimation, Alert } from 'react-native';
import FingerprintScanner from 'react-native-fingerprint-scanner';

import { CoreRepository } from '@store/repositories';
import { BiometryType } from '@store/types';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { VibrateHapticFeedback, Toast } from '@common/helpers/interface';

import { PushNotificationsService, LoggerService } from '@services';

// components
import { Button, Spacer, Footer, PinInput, InfoMessage } from '@components/General';

// locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    passcode: string;
    passcodeConfirm: string;
    step: 'explanation' | 'entry' | 'confirm';
}

/* Component ==================================================================== */
class PasscodeSetupView extends Component<Props, State> {
    static screenName = AppScreens.Setup.Passcode;
    pinInput: PinInput;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            passcode: '',
            passcodeConfirm: '',
            step: 'explanation',
        };
    }

    onFinishStep = async () => {
        const { passcode } = this.state;

        try {
            // encrypt/save passcode
            const encryptedPasscode = await CoreRepository.setPasscode(passcode);

            // reload the core settings
            const coreSettings = CoreRepository.getSettings();

            // check if passcode is saved correctly
            if (!encryptedPasscode || !coreSettings || coreSettings.passcode !== encryptedPasscode) {
                Alert.alert(Localize.t('global.error'), Localize.t('setupPasscode.UnableToStoreThePasscode'));
                return;
            }
            // if biometric auth supported move to page
            if (await this.isBiometricSupported()) {
                Navigator.push(AppScreens.Setup.Biometric);
                return;
            }

            // biometric is not supported
            CoreRepository.saveSettings({ biometricMethod: BiometryType.None });

            // if push notification already granted then go to last part
            const granted = await PushNotificationsService.checkPermission();
            if (granted) {
                Navigator.push(AppScreens.Setup.Disclaimers);
                return;
            }

            // go to the next step
            Navigator.push(AppScreens.Setup.PushNotification);
        } catch (e) {
            LoggerService.recordError('Finish Setup Passcode Failed', e);
        }
    };

    onNext = () => {
        const { step } = this.state;

        LayoutAnimation.easeInEaseOut();

        if (step === 'explanation') {
            this.setState({
                step: 'entry',
            });
        } else if (step === 'entry') {
            this.setState({
                step: 'confirm',
            });

            if (this.pinInput) {
                this.pinInput.clean();
                this.pinInput.focus();
            }
        } else {
            this.onFinishStep();
        }
    };

    onBack = () => {
        const { step } = this.state;

        // animation the step change
        LayoutAnimation.easeInEaseOut();

        if (step === 'entry') {
            this.setState({
                passcode: '',
                step: 'explanation',
            });
        } else {
            this.setState({
                passcode: '',
                passcodeConfirm: '',
                step: 'entry',
            });
            this.pinInput.clean();
        }
    };

    isBiometricSupported = () => {
        return new Promise((resolve) => {
            return FingerprintScanner.isSensorAvailable()
                .then(() => {
                    return resolve(true);
                })
                .catch(() => {
                    return resolve(false);
                });
        });
    };

    onPinFinish = (code: string) => {
        const { step, passcode } = this.state;

        if (step === 'entry') {
            VibrateHapticFeedback('impactLight');
            this.setState({
                passcode: code,
            });
            return;
        }

        if (step === 'confirm') {
            // pincode doesn't match the confirm pin
            if (passcode !== code) {
                Toast(Localize.t('setupPasscode.passcodeDoNotMatch'));
                VibrateHapticFeedback('notificationError');

                // clean pin code
                if (this.pinInput) {
                    this.pinInput.clean();
                    this.pinInput.focus();
                }

                // go back to entry step
                this.setState({
                    passcode: '',
                    step: 'entry',
                });
                return;
            }

            VibrateHapticFeedback('impactLight');
            this.setState({
                passcodeConfirm: code,
            });
        }
    };

    renderHeader = () => {
        return (
            <View style={[AppStyles.flex2, AppStyles.centerContent]}>
                <Image style={styles.logo} source={Images.xummLogo} />
            </View>
        );
    };

    renderFooter = () => {
        const { step, passcode, passcodeConfirm } = this.state;

        if (step === 'explanation') {
            return (
                <Footer style={[AppStyles.paddingBottom]}>
                    <Button testID="go-button" onPress={this.onNext} label={Localize.t('global.go')} />
                </Footer>
            );
        }

        return (
            <Footer style={[AppStyles.row, AppStyles.paddingBottom]}>
                <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                    <Button
                        light
                        isDisabled={false}
                        icon="IconChevronLeft"
                        iconStyle={styles.IconChevronLeft}
                        onPress={this.onBack}
                    />
                </View>

                <View style={[AppStyles.flex4]}>
                    <Button
                        testID="next-button"
                        isDisabled={step === 'entry' ? passcode.length < 6 : passcode !== passcodeConfirm}
                        onPress={this.onNext}
                        label={step === 'entry' ? Localize.t('global.next') : Localize.t('global.save')}
                    />
                </View>
            </Footer>
        );
    };

    renderContent() {
        const { step } = this.state;

        if (step === 'explanation') {
            return (
                <View testID="pin-code-explanation-view" style={[AppStyles.flex8, AppStyles.paddingSml]}>
                    <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Image style={[AppStyles.emptyIcon]} source={Images.ImagePincode} />
                    </View>

                    <View style={[AppStyles.flex2, AppStyles.centerAligned]}>
                        <Text style={[AppStyles.h5, AppStyles.strong]}>
                            {Localize.t('setupPasscode.setupAPasscode')}
                        </Text>
                        <Spacer size={20} />
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('setupPasscode.passCodeDescription')}
                        </Text>
                    </View>
                </View>
            );
        }

        return (
            <View testID="pin-code-entry-view" style={[AppStyles.flex8, AppStyles.paddingSml, AppStyles.stretchSelf]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.centerAligned]}>
                    <Text style={[AppStyles.h5, AppStyles.textCenterAligned, AppStyles.stretchSelf]}>
                        {step === 'entry'
                            ? Localize.t('setupPasscode.setPasscode')
                            : Localize.t('setupPasscode.repeatPasscode')}
                    </Text>
                    <Spacer size={30} />
                    <PinInput
                        ref={(r) => {
                            this.pinInput = r;
                        }}
                        autoFocus
                        codeLength={6}
                        onFinish={this.onPinFinish}
                    />
                </View>

                <InfoMessage label={Localize.t('setupPasscode.warnNeedPasscode')} type="warning" />
            </View>
        );
    }

    render() {
        return (
            <SafeAreaView testID="setup-passcode-screen" style={[AppStyles.container]}>
                {this.renderHeader()}
                {this.renderContent()}
                {this.renderFooter()}
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default PasscodeSetupView;
