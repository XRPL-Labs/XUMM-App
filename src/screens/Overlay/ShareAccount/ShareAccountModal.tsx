/**
 * Switch Account Overlay
 */
import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback, Share } from 'react-native';

import Clipboard from '@react-native-community/clipboard';

import Interactable from 'react-native-interactable';

import { Toast } from '@common/helpers/interface';

import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';
// components
import { Button, QRCode, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
interface Props {
    account: AccountSchema;
}

interface State {}

/* Component ==================================================================== */
class ShareAccountModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ShareAccount;

    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;
    isOpening: boolean;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);

        this.isOpening = true;
    }

    componentDidMount() {
        this.slideUp();
    }

    slideUp = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 1 });
            }
        }, 10);
    };

    slideDown = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 0 });
            }
        }, 10);
    };

    onAlert = (event: any) => {
        const { top, bottom } = event.nativeEvent;

        if (top && bottom) return;

        if (top === 'enter' && this.isOpening) {
            this.isOpening = false;
        }

        if (bottom === 'leave' && !this.isOpening) {
            Navigator.dismissOverlay();
        }
    };

    onSharePress = () => {
        const { account } = this.props;

        this.slideDown();

        setTimeout(() => {
            Share.share({
                title: Localize.t('home.shareAccount'),
                message: account.address,
                url: undefined,
            }).catch(() => {});
        }, 1000);
    };

    onCopyAddressPress = () => {
        const { account } = this.props;

        this.slideDown();

        Clipboard.setString(account.address);
        Toast(Localize.t('account.publicKeyCopiedToClipboard'));
    };

    render() {
        const { account } = this.props;

        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [1.3, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onAlert={this.onAlert}
                    verticalOnly
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - (AppSizes.moderateScale(430) + AppSizes.navigationBarHeight) },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - (AppSizes.moderateScale(450) + AppSizes.navigationBarHeight),
                    }}
                    alertAreas={[
                        { id: 'bottom', influenceArea: { bottom: AppSizes.screen.height } },
                        {
                            id: 'top',
                            influenceArea: {
                                top:
                                    AppSizes.screen.height -
                                    (AppSizes.moderateScale(430) + AppSizes.navigationBarHeight),
                            },
                        },
                    ]}
                    initialPosition={{ y: AppSizes.screen.height }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View style={[styles.visibleContent]}>
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>
                        <View style={styles.qrCodeContainer}>
                            <QRCode
                                size={AppSizes.moderateScale(150)}
                                value={`${account.address}`}
                                style={styles.qrCode}
                            />
                            <Text style={styles.addressText}>{account.address}</Text>
                        </View>

                        {/* <Spacer size={10} /> */}

                        <Button
                            numberOfLines={1}
                            light
                            rounded
                            block
                            icon="IconShare"
                            iconStyle={AppStyles.imgColorBlue}
                            label={Localize.t('global.share')}
                            onPress={this.onSharePress}
                        />
                        <Spacer size={10} />

                        <Button
                            numberOfLines={1}
                            light
                            rounded
                            block
                            label={Localize.t('account.copyAddress')}
                            icon="IconClipboard"
                            iconStyle={AppStyles.imgColorBlue}
                            onPress={this.onCopyAddressPress}
                        />
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ShareAccountModal;
