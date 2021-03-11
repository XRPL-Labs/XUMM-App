/**
 * General Settings Screen
 */

import { uniqBy, sortBy } from 'lodash';

import React, { Component } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { GetDeviceLocaleSettings } from '@common/helpers/device';

import { AppScreens } from '@common/constants';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';

import { Header, Icon, Switch } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    onPress: () => void;
}

export interface State {
    coreSettings: CoreSchema;
    locales: any;
}

/* Component ==================================================================== */
class GeneralSettingsView extends Component<Props, State> {
    static screenName = AppScreens.Settings.General;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = { coreSettings: CoreRepository.getSettings(), locales: Localize.getLocales() };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({ coreSettings });
    };

    showLanguagePicker = () => {
        const { coreSettings, locales } = this.state;

        let normalizedLocales = [];

        for (const locale of locales) {
            normalizedLocales.push({
                value: locale.code,
                title: locale.nameLocal,
            });
        }

        normalizedLocales = sortBy(uniqBy(normalizedLocales, 'title'), 'title');

        Navigator.push(
            AppScreens.Modal.Picker,
            {},
            {
                title: Localize.t('global.language'),
                description: Localize.t('settings.selectLanguage'),
                items: normalizedLocales,
                selected: coreSettings.language,
                onSelect: this.onLanguageSelected,
            },
        );
    };

    showCurrencyPicker = () => {
        const { coreSettings } = this.state;

        Navigator.push(
            AppScreens.Modal.CurrencyPicker,
            {},
            {
                selected: coreSettings.currency,
                onSelect: this.onCurrencySelected,
            },
        );
    };

    onCurrencySelected = (currencyCode: string) => {
        // save in store
        CoreRepository.saveSettings({ currency: currencyCode });
    };

    onLanguageSelected = ({ value }: { value: string }) => {
        // save in store
        CoreRepository.saveSettings({ language: value });

        // change it from local instance
        Localize.setLocale(value);

        // re-render the app
        Navigator.reRender();
    };

    onSystemSeparatorChange = async (value: boolean) => {
        CoreRepository.saveSettings({
            useSystemSeparators: value,
        });

        if (value) {
            const localeSettings = await GetDeviceLocaleSettings();
            Localize.setSettings(localeSettings);
        } else {
            Localize.setSettings(undefined);
        }

        // re-render the app
        Navigator.reRender();
    };

    hapticFeedbackChange = (value: boolean) => {
        CoreRepository.saveSettings({
            hapticFeedback: value,
        });
    };

    getLanguageTitle = (): string => {
        const { coreSettings, locales } = this.state;

        const locale = locales.find((x: any) => x.code === coreSettings.language);

        return locale.nameLocal;
    };

    selectTheme = (value: string) => {
        // console.log(`Selected -> ${value}`);
        CoreRepository.saveSettings({ theme: value });
        // console.log(value.toLowerCase())
        // global.theme = value.toLowerCase()
        // console.log(global.theme);
        global.theme = value;
        // re-render the app
        Navigator.reRender();
    }

    render() {
        const { coreSettings } = this.state;

        return (
            <View testID="general-settings-view" style={[styles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('settings.generalSettings') }}
                />
                <ScrollView>
                    <View style={styles.row}>
                        <View style={[AppStyles.flex1]}>
                            <Text style={AppStyles.pbold}>Theme</Text>
                        </View>
                    </View>
                    <View style={styles.rowNoborder}>
                        <View style={[AppStyles.flex1]}>
                            <TouchableOpacity
                                // testID={testID}
                                activeOpacity={0.8}
                                onPress={() => { this.selectTheme('light'); }}
                                style={[styles.themeItem, global.theme === 'light'
                                ? styles.themeItemSelected : null]}
                            >
                                <View style={AppStyles.flex1}>
                                    <View style={[styles.themeItemDot, global.theme === 'light'
                                    ? styles.themeItemDotSelected : null]}>
                                        {global.theme === 'light' && <View style={styles.themeItemFilled} />}
                                    </View>
                                </View>
                                <View style={AppStyles.flex5}>
                                    <Text
                                        style={[AppStyles.p, AppStyles.strong, global.theme === 'light'
                                        ? AppStyles.colorBlack : AppStyles.colorSilver]}
                                    >
                                        Default
                                    </Text>
                                    <Text style={[styles.themeItemLabelSmall, global.theme === 'light'
                                    ? AppStyles.colorBlack : AppStyles.colorSilver]}>
                                        Fresh and bright
                                    </Text>
                                </View>
                                <View style={[AppStyles.flex1, styles.themePreview, styles.themePreviewLight]}>
                                    <Text style={[AppStyles.p, AppStyles.strong, styles.themePreviewLight]}>Aa</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                // testID={testID}
                                activeOpacity={0.8}
                                onPress={() => { this.selectTheme('dark'); }}
                                style={[styles.themeItem, global.theme === 'dark'
                                ? styles.themeItemSelected : null]}
                            >
                                <View style={AppStyles.flex1}>
                                    <View style={[styles.themeItemDot, global.theme === 'dark'
                                    ? styles.themeItemDotSelected : null]}>
                                        {global.theme === 'dark' && <View style={styles.themeItemFilled} />}
                                    </View>
                                </View>
                                <View style={AppStyles.flex5}>
                                    <Text
                                        style={[AppStyles.p, AppStyles.strong, global.theme === 'dark'
                                        ? AppStyles.colorBlack : AppStyles.colorSilver]}
                                    >
                                        Dark
                                    </Text>
                                    <Text style={[styles.themeItemLabelSmall, global.theme === 'dark'
                                    ? AppStyles.colorBlack : AppStyles.colorSilver]}>
                                        Really dark
                                    </Text>
                                </View>
                                <View style={[AppStyles.flex1, styles.themePreview, styles.themePreviewDark]}>
                                    <Text style={[AppStyles.p, AppStyles.strong, styles.themePreviewDark]}>Aa</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                // testID={testID}
                                activeOpacity={0.8}
                                onPress={() => { this.selectTheme('moonlight'); }}
                                style={[styles.themeItem, global.theme === 'moonlight'
                                ? styles.themeItemSelected : null]}
                            >
                                <View style={AppStyles.flex1}>
                                    <View style={[styles.themeItemDot, global.theme === 'moonlight'
                                    ? styles.themeItemDotSelected : null]}>
                                        {global.theme === 'moonlight' && <View style={styles.themeItemFilled} />}
                                    </View>
                                </View>
                                <View style={AppStyles.flex5}>
                                    <Text
                                        style={[AppStyles.p, AppStyles.strong, global.theme === 'moonlight'
                                        ? AppStyles.colorBlack : AppStyles.colorSilver]}
                                    >
                                        Moonlight
                                    </Text>
                                    <Text style={[styles.themeItemLabelSmall, global.theme === 'moonlight'
                                    ? AppStyles.colorBlack : AppStyles.colorSilver]}>
                                        A touch of moon
                                    </Text>
                                </View>
                                <View style={[AppStyles.flex1, styles.themePreview, styles.themePreviewMoonlight]}>
                                    <Text style={[AppStyles.p, AppStyles.strong, styles.themePreviewMoonlight]}>
                                        Aa
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                // testID={testID}
                                activeOpacity={0.8}
                                onPress={() => { this.selectTheme('royal'); }}
                                style={[styles.themeItem, global.theme === 'royal'
                                ? styles.themeItemSelected : null]}
                            >
                                <View style={AppStyles.flex1}>
                                    <View style={[styles.themeItemDot, global.theme === 'royal'
                                    ? styles.themeItemDotSelected : null]}>
                                        {global.theme === 'royal' && <View style={styles.themeItemFilled} />}
                                    </View>
                                </View>
                                <View style={AppStyles.flex5}>
                                    <Text
                                        style={[AppStyles.p, AppStyles.strong, global.theme === 'royal'
                                        ? AppStyles.colorBlack : AppStyles.colorSilver]}
                                    >
                                        Royal
                                    </Text>
                                    <Text style={[styles.themeItemLabelSmall, global.theme === 'royal'
                                    ? AppStyles.colorBlack : AppStyles.colorSilver]}>
                                        Royal blue blue
                                    </Text>
                                </View>
                                <View style={[AppStyles.flex1, styles.themePreview, styles.themePreviewRoyal]}>
                                    <Text style={[AppStyles.p, AppStyles.strong, styles.themePreviewRoyal]}>Aa</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.row]} onPress={this.showLanguagePicker}>
                        <View style={[AppStyles.flex3]}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.language')}
                            </Text>
                        </View>
                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={[styles.value]}>{this.getLanguageTitle()}</Text>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.row]} onPress={this.showCurrencyPicker}>
                        <View style={[AppStyles.flex3]}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.currency')}
                            </Text>
                        </View>
                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={[styles.value]}>{coreSettings.currency}</Text>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={[AppStyles.flex3]}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.hapticFeedback')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={coreSettings.hapticFeedback} onChange={this.hapticFeedbackChange} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[AppStyles.flex3]}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.useSystemSeparators')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch
                                checked={coreSettings.useSystemSeparators}
                                onChange={this.onSystemSeparatorChange}
                            />
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default GeneralSettingsView;
