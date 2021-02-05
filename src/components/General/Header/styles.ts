import { StyleSheet, Platform } from 'react-native';

import { AppStyles, AppSizes, AppColors } from '@theme';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        // paddingTop: Platform.OS === 'ios' ? AppSizes.statusBarHeight : 0,
        paddingTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 99999,
        height: AppSizes.heightPercentageToDP(9) + (Platform.OS === 'ios' ? AppSizes.statusBarHeight : 0),
    },

    centerContainer: {
        flex: 3,
    },
    rightLeftContainer: {
        flex: 1,
    },
    childContainer: {
        height: '100%',
        justifyContent: 'center',
    },
    textStyle: {
        ...AppStyles.h5,
        textAlign: 'center',
    },
    textStyleSmall: {
        ...AppStyles.pbold,
        textAlign: 'center',
    },
    iconStyle: {
        tintColor: AppColors.black,
    },
});

export default styles;
