import { get, isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

import { LedgerService } from '@services';

import { CheckCash, CheckCreate } from '@common/libs/ledger/transactions';

import { NormalizeCurrencyCode } from '@common/libs/utils';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { AmountInput, Button } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: CheckCash;
}

export interface State {
    isLoading: boolean;
    cashAmount: string;
    editableAmount: boolean;
    amountField: 'DeliverMin' | 'Amount';
    sourceDetails: AccountNameType;
}

/* Component ==================================================================== */
class CheckCashTemplate extends Component<Props, State> {
    amountInput: AmountInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            editableAmount: !props.transaction.DeliverMin?.value && !props.transaction.Amount?.value,
            cashAmount: props.transaction.DeliverMin?.value || props.transaction.Amount?.value,
            amountField: props.transaction.Amount ? 'Amount' : 'DeliverMin',
            sourceDetails: { name: '', source: '' },
        };
    }

    componentDidMount() {
        // fetch the destination name e
        this.fetchCheckDetails();
    }

    fetchCheckDetails = () => {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        // assign actual check object to the CashCheck tx
        LedgerService.getLedgerEntry(transaction.CheckID)
            .then((res: any) => {
                const checkObject = get(res, 'node', undefined);
                if (checkObject) {
                    transaction.Check = new CheckCreate(checkObject);

                    // fetch destination details
                    getAccountName(transaction.Check.Account.address)
                        .then((r: any) => {
                            if (!isEmpty(res)) {
                                this.setState({
                                    sourceDetails: r,
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
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('payload.checkObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('payload.unableToGetCheckObject'));
            });
    };

    onAmountChange = (amount: string) => {
        const { transaction } = this.props;
        const { amountField } = this.state;

        this.setState({
            cashAmount: amount,
        });

        if (amount) {
            if (!transaction[amountField] || transaction[amountField].currency === 'XRP') {
                // @ts-ignore
                transaction[amountField] = amount;
            } else {
                transaction[amountField] = {
                    ...transaction[amountField],
                    ...{ value: amount },
                };
            }
        }
    };

    render() {
        const { transaction } = this.props;
        const { isLoading, editableAmount, amountField, cashAmount, sourceDetails } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorgrey]}>
                        {Localize.t('global.from')}
                    </Text>
                </View>

                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    showAvatar={false}
                    recipient={{
                        address: transaction.Check?.Account.address,
                        ...sourceDetails,
                    }}
                />

                {/* Check Amount */}
                <Text style={[styles.label]}>{Localize.t('global.checkAmount')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.amount]}>
                        {`${transaction.Check?.SendMax.value} ${NormalizeCurrencyCode(
                            transaction.Check?.SendMax.currency,
                        )}`}
                    </Text>
                </View>

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
                        <View style={[AppStyles.row, AppStyles.flex1]}>
                            <AmountInput
                                ref={(r) => {
                                    this.amountInput = r;
                                }}
                                onChange={this.onAmountChange}
                                style={[styles.amountInput]}
                                value={cashAmount}
                                editable={editableAmount}
                            />
                            <Text style={[styles.amountInput]}>
                                {' '}
                                {transaction[amountField]?.currency
                                    ? NormalizeCurrencyCode(transaction[amountField].currency)
                                    : 'XRP'}
                            </Text>
                        </View>
                        {editableAmount && (
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
                        )}
                    </TouchableOpacity>
                </View>

                {transaction.CheckID && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.checkID')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={styles.valueSubtext}>{transaction.CheckID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CheckCashTemplate;
