import React, { useEffect } from "react";
import { View, StatusBar, Platform } from "react-native";
import Modal from 'react-native-modal';

import OurImage from "~/components/OurImage";
import OurTextButton from "~/components/OurTextButton";
import styles from "./styles";
import PagerView from "react-native-pager-view";

const BACKDROP_OPACITY = .7;

const OurImageSlider = (props) => {
    const { data, isModalVisible, toggleModal } = props;

    useEffect( () => {
        if ( Platform.OS === "android" )
            if ( isModalVisible )
                StatusBar.setBackgroundColor(`rgba(0, 0, 0, ${BACKDROP_OPACITY})`);
            else
                StatusBar.setBackgroundColor("rgba(0, 0, 0, 0)");
    }, [isModalVisible]);

    return (
        <Modal onBackdropPress={toggleModal} onBackButtonPress={toggleModal} isVisible={isModalVisible} backdropOpacity={BACKDROP_OPACITY} backdropTransitionOutTiming={0}>      
            <PagerView style={styles.viewPager} showPageIndicator={true}>
                {
                    data.map((url, i) =>
                        <View 
                        style={styles.modalPicture}
                        key = {i}>
                            <OurImage
                                url={url}
                                style={styles.modalPictureGallery}
                                disabled={true}
                            />
                        </View>
                )}
            </PagerView>
            <OurTextButton
                style={styles.modalButton}
                onPress={toggleModal}
                translate={true}
            >close</OurTextButton>
        </Modal>
    );
};

export default OurImageSlider;