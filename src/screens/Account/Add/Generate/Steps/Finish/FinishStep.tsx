/**
 * Generate Account/Finish Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ImageBackground, Image } from 'react-native';

import { Images } from '@common/helpers/images';
// components
import { Button, Footer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class FinishStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    render() {
        const { goNext } = this.context;

        return (
            <SafeAreaView style={[AppStyles.flex1]}>
                <ImageBackground
                    testID="account-generate-finish-view"
                    source={Images.backgroundPattern}
                    style={[AppStyles.container]}
                    imageStyle={styles.backgroundImageStyle}
                >
                    <View
                        style={[
                            AppStyles.flex1,
                            AppStyles.paddingSml,
                            AppStyles.centerAligned,
                            AppStyles.centerContent,
                        ]}
                    >
                        <Image style={[AppStyles.emptyIcon]} source={Images.ImageComplete} />
                        <Text style={AppStyles.h5}>{Localize.t('global.congratulations')}</Text>
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                            {Localize.t('account.accountSetupCompleted')}
                            {'\n'}
                            {Localize.t('account.YouJustCreatedAccount')}
                        </Text>
                    </View>

                    <Footer>
                        <Button testID="finish-button" label={Localize.t('account.yeahLetsGo')} onPress={goNext} />
                    </Footer>
                </ImageBackground>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default FinishStep;
