/**
 * Request Screen
 */

import { find } from 'lodash';

import React, { Component } from 'react';
import {
    View,
    TouchableOpacity,
    Keyboard,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Text,
    InteractionManager,
} from 'react-native';

import { BackendService } from '@services';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { NormalizeAmount } from '@common/libs/utils';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, CoreSchema } from '@store/schemas/latest';

// components
import { Header, AmountInput, QRCode, CheckBox, HorizontalLine } from '@components/General';
import { AccountPicker } from '@components/Modules';

// local
import Localize from '@locale';

// style
import { AppStyles, AppColors, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
interface Props {}

interface State {
    coreSettings: CoreSchema;
    accounts: any;
    source: AccountSchema;
    amount: string;
    amountRate: string;
    currencyRate: any;
    withAmount: boolean;
}

/* Component ==================================================================== */
class RequestView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Request;
    private amountInput: any;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const accounts = AccountRepository.getAccounts();

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            accounts,
            source: find(accounts, { default: true }) || accounts[0],
            amount: '',
            currencyRate: undefined,
            amountRate: '',
            withAmount: false,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchCurrencyRate);
    }

    fetchCurrencyRate = () => {
        const { coreSettings } = this.state;

        const { currency } = coreSettings;

        BackendService.getCurrencyRate(currency)
            .then((r) => {
                this.setState(
                    {
                        currencyRate: r,
                    },
                    this.onUpdateRate,
                );
            })
            .catch(() => {
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

    onUpdateRate = () => {
        const { amount, currencyRate } = this.state;

        if (amount && currencyRate) {
            const inRate = Number(amount) * currencyRate.lastRate;
            this.setState({
                amountRate: String(inRate),
            });
        }
    };

    onAccountChange = (item: AccountSchema) => {
        this.setState({
            source: item,
        });
    };

    onAmountChange = (amount: string) => {
        const { currencyRate } = this.state;

        this.setState({
            amount,
        });

        if (!amount) {
            this.setState({
                amountRate: '',
            });

            return;
        }

        if (currencyRate) {
            const inRate = Number(amount) * currencyRate.lastRate;
            this.setState({
                amountRate: String(inRate),
            });
        }
    };

    onRateAmountChange = (amount: string) => {
        const { currencyRate } = this.state;

        this.setState({
            amountRate: amount,
        });

        if (!amount) {
            this.setState({
                amount: '',
            });
            return;
        }

        if (currencyRate) {
            const inXRP = Number(amount) / currencyRate.lastRate;
            this.setState({
                amount: String(NormalizeAmount(inXRP)),
            });
        }
    };

    getQRContent = () => {
        const { source, amount, withAmount } = this.state;

        let content = `https://xumm.app/detect/request:${source.address}`;

        if (amount && withAmount) {
            content += `&amount=${amount}`;
        }

        return content;
    };

    toggleUseAmount = () => {
        const { withAmount } = this.state;

        this.setState({
            withAmount: !withAmount,
        });
    };

    onHeaderBackPress = () => {
        Keyboard.dismiss();
        setTimeout(() => {
            Navigator.pop();
        }, 10);
    };

    render() {
        const { accounts, source, amount, amountRate, currencyRate, coreSettings, withAmount } = this.state;

        return (
            <View testID="request-screen" style={[styles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.onHeaderBackPress,
                    }}
                    centerComponent={{ text: 'Request' }}
                />

                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior="padding"
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    keyboardVerticalOffset={AppSizes.extraKeyBoardPadding}
                >
                    <ScrollView>
                        <View style={styles.qrCodeContainer}>
                            <View style={styles.qrCode}>
                                <QRCode size={AppSizes.moderateScale(150)} value={this.getQRContent()} />
                            </View>
                        </View>

                        <HorizontalLine />

                        <View style={[styles.rowItem]}>
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorgrey]}>
                                    {Localize.t('global.to')}
                                </Text>
                            </View>
                            <View style={styles.accountPickerContainer}>
                                <AccountPicker
                                    onSelect={this.onAccountChange}
                                    accounts={accounts}
                                    selectedItem={source}
                                />
                            </View>
                        </View>

                        {/* Amount */}
                        <View style={[styles.rowItem]}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[AppStyles.row, styles.rowTitle]}
                                onPress={this.toggleUseAmount}
                            >
                                <View style={AppStyles.flex5}>
                                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorgrey]}>
                                        {Localize.t('global.requestWithAmount')}
                                    </Text>
                                </View>
                                <View style={AppStyles.flex1}>
                                    <CheckBox checked={withAmount} onPress={this.toggleUseAmount} />
                                </View>
                            </TouchableOpacity>

                            {withAmount && (
                                <>
                                    <View style={[styles.amountContainer]}>
                                        <View style={AppStyles.flex1}>
                                            <AmountInput
                                                testID="amount-input"
                                                onChange={this.onAmountChange}
                                                returnKeyType="done"
                                                style={[styles.amountInput]}
                                                placeholderTextColor={AppColors.grey}
                                                value={amount}
                                            />
                                        </View>
                                    </View>

                                    <View style={[styles.amountRateContainer]}>
                                        <View style={AppStyles.centerContent}>
                                            <Text style={[styles.amountRateInput]}>~ </Text>
                                        </View>
                                        <View style={AppStyles.flex1}>
                                            <AmountInput
                                                editable={!!currencyRate}
                                                testID="amount-rate-input"
                                                onChange={this.onRateAmountChange}
                                                returnKeyType="done"
                                                style={[styles.amountRateInput]}
                                                placeholderTextColor={AppColors.grey}
                                                value={amountRate}
                                            />
                                        </View>
                                        <View style={styles.currencySymbolTextContainer}>
                                            <Text style={[styles.currencySymbolText]}>{coreSettings.currency}</Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default RequestView;
