import React, {useContext, useState, useEffect} from "react";
import { Image, View, TouchableOpacity, Dimensions, Animated } from "react-native";
import styles from "./styles";
import config from "../../../../config";
import { stateContext, dispatchContext } from "../../../../contexts";
import PickerModal from 'react-native-picker-modal-view';
import OurText from "../../../OurText";
import PickerButton from "../../../PickerButton";
import {useTranslation} from "react-i18next";
import { addImage, getImage } from "../../../../db_handler";
import Modal from 'react-native-modal';

import {
    AddToCart,
    ComputeTotalPrice,
} from "../../../../actions";
import { clockRunning } from "react-native-reanimated";
const address = config.getCell("StoreAddress");

const totalHeight = Dimensions.get("window").height 
const itemHeight = totalHeight / 2;




const AttrPicker = (props) =>
{
    const {data, onValueChange} = props;
    const items = data.options.map( (v, i) => { return {Name: v, Value: v, Id: i} });
    const [selected, setSelected] = useState(items[0]);

    return (
        <>
            <OurText style={{color:  "#FFF", fontWeight: "bold", marginTop: 15,}}>{data.name}</OurText>

            <PickerModal
                renderSelectView={(disabled, sel, showModal) =>
                    <PickerButton
                        disabled={disabled}
                        onPress={showModal}>{selected.Name || ""}</PickerButton>
                }
                onSelected={(val) => {
                    if ( val && Object.keys(val).length !== 0 ) {
                        setSelected(val);

                        if (onValueChange)
                            onValueChange(val);
                    }
                }}
                items={items}
                showToTopButton={true}
                selected={selected}
                backButtonDisabled={true}
                showAlphabeticalIndex={true}
                autoGenerateAlphabeticalIndex={true}
                requireSelection={false}
                autoSort={false}
            />
        </>
    )
};

const AttrPickersParent = (props) =>
{
    const {data} = props;
    return (
        <>
            {data.map( (v, i) =>
            {
                return <AttrPicker data={v} key={i}/>
            })}
        </>
    )
};

/** Список товаров той или иной категории */
const ProductsItem = (props) =>
{
    const {data, y, index, name, galleryImg, imageUrl} = props;
    const state = useContext(stateContext);
    const dispatch = useContext(dispatchContext);
    const [image, setImage] = useState();
    const [selected, setSelected] = useState({});
    const itemAttributes = data?.attributes?.nodes || [];
    const {t} = useTranslation();
    const [isModalVisible, setModalVisible] = useState(false);

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
      };
    
    useEffect( () => {
        const url = data?.image?.mediaDetails?.file ? `${address}wp-content/uploads/` + data.image.mediaDetails.file
        :  `${address}wp-content/uploads/woocommerce-placeholder.png`;


        

        const cb = ( tr, result )=> {
            if ( !result.rows.length ) {
                fetch(url)
                .then( res =>  res.blob() )
                .then( data => {
                    const reader = new FileReader();
                    reader.readAsDataURL(data);
                    reader.onload = () => {
                        setImage(reader.result);
                        addImage(url, reader.result);
                    }
                });
            } else {
                setImage(url, result.rows[0]);
            }

        }
        getImage(url, cb, (tr, err) => console.log(`ERROR ${err}`));
        
        
        
    }, []);

    const position = Animated.subtract(index * itemHeight, y);
    const isDisappearing = -itemHeight;
    const isTop = 0;
    const isBottom = totalHeight - itemHeight;
    const isAppearing = totalHeight;
    const translateY = Animated.add(
        Animated.add(
        y,
        y.interpolate({
            inputRange: [0, 0.00001 + index * itemHeight],
            outputRange: [0, -index * itemHeight],
            extrapolateRight: "clamp",
        })
        ),
        position.interpolate({
        inputRange: [isBottom, isAppearing],
        outputRange: [0, -itemHeight / 4],
        extrapolate: "clamp",
        })
    );
    const scale = position.interpolate({
        inputRange: [isDisappearing, isTop, isBottom, isAppearing],
        outputRange: [0.5, 1, 1, 0.5],
        extrapolate: "clamp",
    });
    const opacity = position.interpolate({
        inputRange: [isDisappearing, isTop, isBottom, isAppearing],
        outputRange: [0.5, 1, 1, 0.5],
    });


    return (
        <Animated.View style={[styles.container, {height: itemHeight}, { opacity, transform: [{ translateY }, { scale }] }]}>

            <OurText style={styles.title}>{name}</OurText>
            <View style={styles.card}>
                <View style={styles.left}>
                <TouchableOpacity
                onPress={toggleModal}
                >
                <Image
                        style={styles.picture}
                        source={{uri: imageUrl ? `${address}wp-content/uploads/` + imageUrl
                        :  `${address}wp-content/uploads/woocommerce-placeholder.png` }}
                    />
                    </TouchableOpacity>
                <Modal isVisible={isModalVisible}>
                    <Image
                        style={styles.picture}
                        source={{uri: image}}
                    />
                    <TouchableOpacity style={styles.modal_button} onPress={toggleModal}>
                     <OurText style={styles.text_button}>Close</OurText>
                     </TouchableOpacity>
                    </Modal>
                </View>
                    
                        <View style={styles.right}>
                            <AttrPickersParent data={itemAttributes}/>
                         </View>
            </View>
            <View style={styles.left_bottom}>

                {galleryImg && galleryImg.length ?
            <Image
            style={styles.picture_bottom}
            source={{uri: galleryImg ?  `${address}wp-content/uploads/` + galleryImg
            :  `${address}wp-content/uploads/woocommerce-placeholder.png` }}
            /> : <></>
                }
                    </View>
                <View style={styles.bottom}>
                    <OurText style={styles.price} params={{
                        price: ( data.price === 0 || !data.price ) ? t("productFree") : data.price
                    }}>productPrice</OurText>
                        <TouchableOpacity style={styles.button} onPress={ (e) =>
                        {
                            // Обрабатываем нажатие на кнопку "Купить"

                            // Заносим данные
                            let payload = {
                                id: data.productId,
                                name: data.name,
                                count: 1,
                                price: data.price ? data.price.match(/\d{1,5}.*\d*/)[0] : 0,
                                stockQuantity: data.stockQuantity || 99,
                                selectedVariants: [
                                    "variantID"
                                ]
                            };
                            // Добавляем в корзину
                            dispatch(AddToCart(payload, dispatch, t));
                            dispatch(ComputeTotalPrice());
                        }}>
                            <OurText style={styles.text_button} translate={true}>productBuy</OurText>
                        </TouchableOpacity>
                </View>
                    <View>
                        <OurText style={styles.descriptionText}>{data.description?.replace(/<\/*.+?\/*>/gi, "") || ""}</OurText>
                    </View>
        </Animated.View>
            

    );
};

export default ProductsItem;