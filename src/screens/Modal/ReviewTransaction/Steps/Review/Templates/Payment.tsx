import BigNumber from 'bignumber.js';
import { isEmpty, isEqual, has } from 'lodash';
import React, { Component } from 'react';
import { View, Alert, Text, Platform, TouchableOpacity, InteractionManager } from 'react-native';

import { BackendService, LedgerService } from '@services';

import { CoreRepository } from '@store/repositories';

import LedgerExchange from '@common/libs/ledger/exchange';
import { Payment } from '@common/libs/ledger/transactions';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { NormalizeCurrencyCode } from '@common/libs/utils';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { AmountInput, AmountText, Button, InfoMessage, Spacer } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { Toast } from '@common/helpers/interface';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: Payment;
}

export interface State {
    account: string;
    isLoading: boolean;
    amount: string;
    editableAmount: boolean;
    destinationDetails: AccountNameType;
    isPartialPayment: boolean;
    exchangeRate: number;
    xrpRoundedUp: string;
    currencyRate: any;
    isLoadingRate: boolean;
}

/* Component ==================================================================== */
class PaymentTemplate extends Component<Props, State> {
    amountInput: AmountInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            account: undefined,
            isLoading: false,
            editableAmount: !props.transaction.Amount?.value,
            amount: props.transaction.Amount?.value,
            destinationDetails: { name: '', source: '' },
            isPartialPayment: false,
            exchangeRate: undefined,
            xrpRoundedUp: undefined,
            currencyRate: undefined,
            isLoadingRate: false,
        };
    }

    componentDidMount() {
        // fetch the destination name e
        this.fetchDestinationInfo();

        // Payload payment request in IOU amount: handle conversion if required:
        this.checkForConversationRequired();

        // if XRP then show equal amount in selected currency
        this.fetchCurrencyRate();
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.transaction.Account?.address !== prevState.account) {
            return { account: nextProps.transaction.Account.address };
        }
        return null;
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        const { account } = this.state;

        if (!isEqual(prevState.account, account)) {
            InteractionManager.runAfterInteractions(() => {
                this.checkForConversationRequired();
            });
        }
    }

    fetchCurrencyRate = () => {
        const { transaction } = this.props;

        // only for XRP payments
        if (transaction.Amount && transaction.Amount.currency !== 'XRP') {
            return;
        }

        this.setState({
            isLoadingRate: true,
        });

        const { currency } = CoreRepository.getSettings();

        BackendService.getCurrencyRate(currency)
            .then((r) => {
                this.setState({
                    currencyRate: r,
                    isLoadingRate: false,
                });
            })
            .catch(() => {
                this.setState({
                    isLoadingRate: false,
                });
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

    checkForConversationRequired = async () => {
        const { transaction } = this.props;
        const { account } = this.state;

        if (!account) return;

        try {
            if (transaction.Amount && transaction.Amount.currency !== 'XRP') {
                // get source trust lines
                const sourceLines = await LedgerService.getAccountLines(transaction.Account.address);

                const { lines } = sourceLines;

                const trustLine = lines.filter(
                    (l: any) => l.currency === transaction.Amount.currency && l.account === transaction.Amount.issuer,
                )[0];

                let shouldPayWithXRP =
                    !trustLine ||
                    (parseFloat(trustLine.balance) < parseFloat(transaction.Amount.value) &&
                        account !== transaction.Amount.issuer);

                // just ignore if the sender is the issuer
                if (account === transaction.Amount.issuer) {
                    shouldPayWithXRP = false;
                }

                // if not have the same trust line or the balance is not covering requested value
                // Pay with XRP instead
                if (shouldPayWithXRP) {
                    const PAIR = { issuer: transaction.Amount.issuer, currency: transaction.Amount.currency };

                    const ledgerExchange = new LedgerExchange(PAIR);
                    // sync with latest order book
                    await ledgerExchange.initialize();

                    // get liquidity grade
                    const liquidity = await ledgerExchange.getLiquidity('buy', Number(transaction.Amount.value));

                    // not enough liquidity
                    if (!liquidity.safe || liquidity.errors.length > 0) {
                        this.setState({
                            isPartialPayment: true,
                            exchangeRate: 0,
                        });
                        return;
                    }

                    const sendMaxXRP = new BigNumber(transaction.Amount.value)
                        .multipliedBy(liquidity.rate)
                        .decimalPlaces(8)
                        .toString(10);

                    // @ts-ignore
                    transaction.SendMax = sendMaxXRP;
                    transaction.Flags = [txFlags.Payment.PartialPayment];

                    this.setState({
                        isPartialPayment: true,
                        exchangeRate: new BigNumber(1).dividedBy(liquidity.rate).decimalPlaces(8).toNumber(),
                        xrpRoundedUp: sendMaxXRP,
                    });
                } else {
                    // check for transfer fee
                    // add PartialPayment
                    const issuerAccountInfo = await LedgerService.getAccountInfo(transaction.Amount.issuer);
                    // eslint-disable-next-line max-len
                    if (
                        has(issuerAccountInfo, ['account_data', 'TransferRate']) ||
                        account === transaction.Amount.issuer
                    ) {
                        transaction.Flags = [txFlags.Payment.PartialPayment];
                    }

                    if (transaction.SendMax) {
                        transaction.SendMax = undefined;
                    }
                    this.setState({
                        isPartialPayment: false,
                    });
                }
            }
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('payload.unableToCheckAssetConversion'));
        }
    };

    fetchDestinationInfo = () => {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        // fetch destination details
        getAccountName(transaction.Destination.address)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        destinationDetails: res,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    onAmountChange = (amount: string) => {
        const { transaction } = this.props;

        this.setState({
            amount,
        });

        if (amount) {
            if (!transaction.Amount || transaction.Amount.currency === 'XRP') {
                // @ts-ignore
                transaction.Amount = amount;
            } else {
                const payAmount = { ...transaction.Amount };
                Object.assign(payAmount, { value: amount });
                transaction.Amount = payAmount;
            }
        }
    };

    renderAmountRate = () => {
        const { amount, isLoadingRate, currencyRate } = this.state;

        if (isLoadingRate) {
            return (
                <View style={[styles.rateContainer]}>
                    <Text style={styles.rateText}>Loading ...</Text>
                </View>
            );
        }

        // only show rate for XRP
        if (currencyRate && amount) {
            const rate = Number(amount) * currencyRate.lastRate;
            if (rate > 0) {
                return (
                    <View style={[styles.rateContainer]}>
                        <Text style={styles.rateText}>
                            ~{currencyRate.code} {Localize.formatNumber(rate)}
                        </Text>
                    </View>
                );
            }
        }

        return null;
    };

    render() {
        const { transaction } = this.props;
        const {
            isLoading,
            isPartialPayment,
            exchangeRate,
            xrpRoundedUp,
            editableAmount,
            amount,
            destinationDetails,
        } = this.state;
        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>

                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    showAvatar={false}
                    recipient={{
                        address: transaction.Destination.address,
                        tag: transaction.Destination.tag,
                        ...destinationDetails,
                    }}
                />

                {/* Amount */}
                <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>

                <View style={[styles.contentBox]}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[AppStyles.row]}
                        onPress={() => {
                            if (editableAmount && this.amountInput) {
                                this.amountInput.focus();
                            }
                        }}
                    >
                        {editableAmount ? (
                            <>
                                <View style={[AppStyles.row, AppStyles.flex1]}>
                                    <AmountInput
                                        ref={(r) => {
                                            this.amountInput = r;
                                        }}
                                        onChange={this.onAmountChange}
                                        style={[styles.amountInput]}
                                        value={amount}
                                        editable={editableAmount}
                                    />
                                    <Text style={[styles.amountInput]}>
                                        {' '}
                                        {transaction.Amount?.currency
                                            ? NormalizeCurrencyCode(transaction.Amount.currency)
                                            : 'XRP'}
                                    </Text>
                                </View>
                                <Button
                                    onPress={() => {
                                        if (this.amountInput) {
                                            this.amountInput.focus();
                                        }
                                    }}
                                    style={styles.editButton}
                                    roundedSmall
                                    iconSize={13}
                                    light
                                    icon="IconEdit"
                                />
                            </>
                        ) : (
                            <AmountText
                                style={styles.amountInput}
                                value={amount}
                                currency={transaction.Amount.currency}
                            />
                        )}
                    </TouchableOpacity>
                    {isPartialPayment &&
                        (exchangeRate ? (
                            <>
                                <Spacer size={Platform.OS === 'ios' ? 15 : 0} />
                                <InfoMessage
                                    label={Localize.t('payload.payingWithXRPExchangeRate', {
                                        xrpRoundedUp,
                                        exchangeRate,
                                    })}
                                    type="info"
                                />
                            </>
                        ) : (
                            <>
                                <Spacer size={Platform.OS === 'ios' ? 15 : 0} />
                                <InfoMessage
                                    label={Localize.t('payload.notEnoughLiquidityToSendThisPayment')}
                                    type="error"
                                />
                            </>
                        ))}

                    {this.renderAmountRate()}
                </View>

                {transaction.InvoiceID && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.invoiceID')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={styles.value}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default PaymentTemplate;
