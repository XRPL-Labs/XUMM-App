/**
 * Generate Account Activation explain
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Image } from 'react-native';

// components
import { Button, Spacer, Footer } from '@components/General';
import { Images } from '@common/helpers/images';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class ExplainActivationStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    goNext = () => {
        const { goNext } = this.context;
        goNext('SecurityStep');
    };

    render() {
        const { goBack } = this.context;

        return (
            <SafeAreaView testID="account-generate-explain-activation-view" style={[AppStyles.container]}>
                <View style={[AppStyles.centerAligned, AppStyles.marginVerticalSml]}>
                    <Image style={[styles.headerImage]} source={Images.ImageCoinWallet} />
                </View>

                <View style={[AppStyles.contentContainer, AppStyles.centerAligned, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.baseText, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {Localize.t('account.accountGenerateActivationExplain')}
                    </Text>

                    <Spacer size={30} />

                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('account.accountActivateReserveExplain')}
                    </Text>

                    <Spacer size={20} />

                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('account.accountReserveNotShownExplain')}
                    </Text>

                    <Spacer size={20} />
                </View>

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            secondary
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            label={Localize.t('global.nextIUnderstand')}
                            onPress={this.goNext}
                            textStyle={AppStyles.strong}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ExplainActivationStep;
