/**
 * Generate Account/Label Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert } from 'react-native';

// components
import { Button, Spacer, TextInput, KeyboardAwareScrollView, Footer } from '@components/General';

// locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    label: string;
}

/* Component ==================================================================== */
class LabelStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            label: '',
        };
    }

    goNext = () => {
        const { goNext, setLabel } = this.context;
        const { label } = this.state;

        if (label.length > 16) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountMaxLabelLengthError'));
            return;
        }

        // set the label
        setLabel(label.trim());

        // go to next step
        goNext('FinishStep');
    };

    render() {
        const { goBack } = this.context;
        const { label } = this.state;
        return (
            <SafeAreaView testID="account-generate-label-view" style={[AppStyles.container]}>
                <KeyboardAwareScrollView
                    style={[AppStyles.flex1]}
                    contentContainerStyle={[AppStyles.paddingHorizontal]}
                >
                    <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {Localize.t('account.pleaseChooseAccountLabel')}
                    </Text>

                    <Spacer size={50} />

                    <TextInput
                        testID="label-input"
                        maxLength={16}
                        placeholder={Localize.t('account.accountLabel')}
                        value={label}
                        onChangeText={(l) => this.setState({ label: l })}
                        inputStyle={styles.inputText}
                        autoCapitalize="sentences"
                    />
                </KeyboardAwareScrollView>
                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            light
                            onPress={goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            isDisabled={!label.trim()}
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.next')}
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default LabelStep;
