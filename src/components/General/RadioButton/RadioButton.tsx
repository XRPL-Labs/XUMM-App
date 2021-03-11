/**
 * Radio Button
 *
    <RadioButton />
 *
 */
import React, { Component } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    onPress: () => void;
    checked: boolean;
    label: string;
    labelSmall?: string;
    description?: string;
    testID?: string;
}

/* Component ==================================================================== */
class RadioButton extends Component<Props> {
    onPress = () => {
        const { onPress } = this.props;
        if (onPress) {
            onPress();
        }
    };

    render() {
        const { checked, label, labelSmall, description, testID } = this.props;
        return (
            <TouchableOpacity
                testID={testID}
                activeOpacity={0.8}
                onPress={this.onPress}
                style={[styles.content, checked ? styles.selected : null]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[styles.dot, checked ? styles.dotSelected : null]}>
                        {checked && <View style={styles.filled} />}
                    </View>
                </View>
                <View style={AppStyles.flex6}>
                    <Text
                        style={[AppStyles.p, AppStyles.strong, checked ? styles.textColorSelected : styles.textColor]}
                    >
                        {label}
                    </Text>
                    {labelSmall && (
                        <Text style={[styles.labelSmall, checked ? styles.textColorSelected : styles.textColor]}>
                            {labelSmall}
                        </Text>
                    )}
                    {description && (
                        <Text
                            style={[
                                AppStyles.subtext,
                                styles.descriptionText,
                                checked ? styles.textColorSelected : styles.textColor,
                            ]}
                        >
                            {description}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    }
}

/* Export Component ==================================================================== */
export default RadioButton;
