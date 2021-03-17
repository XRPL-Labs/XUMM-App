import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { AccountDelete } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { RecipientElement } from '@components/Modules';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: AccountDelete;
}

export interface State {
    isLoading: boolean;
    destinationDetails: AccountNameType;
}

/* Component ==================================================================== */
class AccountDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            destinationDetails: {
                name: '',
                source: '',
            },
        };
    }

    componentDidMount() {
        // fetch the destination name e
        this.fetchDestinationInfo();
    }

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

    render() {
        const { transaction } = this.props;
        const { isLoading, destinationDetails } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorgrey]}>
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
            </>
        );
    }
}

export default AccountDeleteTemplate;
