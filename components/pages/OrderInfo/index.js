import React, { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useQuery } from "@apollo/client";
import { QUERY_GET_ORDER, QUERY_GET_ORDER_INFO } from "~/apollo/queries";
import { useTranslation } from "react-i18next";

import { HeaderBackButton, HeaderCartButton } from "~/components/Header";
import OurActivityIndicator from "~/components/OurActivityIndicator";
import OurText from "~/components/OurText";
import OurImage from "~/components/OurImage";
import styles from "./styles";
import countries from "~/CountriesEnum.json";
import MapView, {Marker, PROVIDER_DEFAULT, UrlTile} from "react-native-maps";
import SyncStorage from "sync-storage";
import OurIconButton from "~/components/OurIconButton";
import { faSignInAlt } from "@fortawesome/free-solid-svg-icons/faSignInAlt";
import { ShowLoginModal } from "~/redux/ModalReducer/actions";
import { useDispatch } from "react-redux";
import client from "~/apollo";
import CourierIcon from "~/components/CourierIcon";

const ProductCard = (props) => {
    const { name, imageUrl, price, quantity, id, variation, navigation } = props;
    const { t } = useTranslation();

    return (
        <TouchableOpacity style={styles.productCard} onPress={() => {
            navigation.navigate("ProductInfo", { name, id, imageUrl })}
        }>
            <OurImage style={styles.productCardImage} url={imageUrl} disabled={true} />
            <OurText style={styles.productCardName}>{name}</OurText>
            <View style={styles.productCardBottom}>
                <OurText style={styles.productCardName} params={{
                    price: ( !price && !variation ) ? t("productFree") : variation ? variation.price : price
                }}>productPrice</OurText>
                <OurText style={styles.productCardName}>{`x${quantity || 1}`}</OurText>
            </View>
        </TouchableOpacity>
    )
};

const DeliveryDetailsItem = (props) => {
    const { field, text } = props;

    return (
        <View style={styles.itemContainer}>
            <OurText style={styles.fieldText} translate={true}>{field}</OurText>
            <OurText style={styles.text} adjustsFontSizeToFit={true} translate={!text}>{text || "notAvailable"}</OurText>
        </View>
    );
};

const OrderInfo = (props) => {
    const { navigation } = props;
    const { id, status } = props.route.params;

    const dispatch = useDispatch();

    const [abortController, setAbortController] = useState(new AbortController());
    const [coord, setCoord] = useState(null);

    const FetchCoordinates = async () => {
        try {
            const resp = await client.query({query: QUERY_GET_ORDER_INFO, variables: {id}, fetchPolicy: "no-cache"});
            const data = JSON.parse(resp.data.orderInfo.courier_data);
            setCoord(data);
        } catch(e) {
            console.log("WELL SHIT", e);
        }
    };

    useEffect(() => {
        FetchCoordinates();
        if ( timer ) {
            clearInterval(timer);
        }
        var timer = setInterval(FetchCoordinates, 5000 );
        return () => {
            if ( timer ) {
                clearInterval(timer);
            }
        };
    }, []);

    const [gradStart, gradEnd] = ["#fdc830", "#f37335"];

    useLayoutEffect( () => {
        navigation.setOptions({
            headerLeft: (props)=><HeaderBackButton navigation={navigation}/>,
            headerCenter: ()=>{},
            headerRight: (props)=> {
                const auth = SyncStorage.get("auth");
                const refresh = SyncStorage.get("refresh-auth");

                if ( !auth || !refresh )
                    return <OurIconButton icon={faSignInAlt} size={50} onPress={() => ShowLoginModal(dispatch, navigation)} />;
                else
                    return <HeaderCartButton navigation={navigation}/>;
            },
            headerStyle: {
                backgroundColor: gradStart,
            },
        });
    }, [navigation]);

    const { loading, error, data, refetch } = useQuery(QUERY_GET_ORDER, {
        variables: { id: String(id) },
        context: {
            fetchOptions: {
                signal: abortController.signal,
            },
        },
        onCompleted: (data) => {

        },
        onError: (err) => {
            console.log("Error while fetching product data", error)
        }
    });

    return (
        <>
            <LinearGradient
                style={styles.background}
                locations={[.2, 1]}
                colors={[gradStart, gradEnd]} />
            <ScrollView contentContainerStyle={styles.mainContainer}>
                <View style={styles.orderNumberContainer}>
                    <OurText style={styles.orderNumber} translate={true} params={{id}}>orderNumber</OurText>
                    <OurText style={styles.orderStatus} translate={true}>{`orderStatus_${status}`}</OurText>
                </View>
                <View style={styles.orderInfo}>
                    {
                        loading || error?
                            <View style={styles.activityIndicator}>
                                <OurActivityIndicator abortControllerModel={[abortController, setAbortController]} error={error} style={{position: null}}/>
                            </View>
                        :
                            <>
                                <View style={styles.orderProducts}>
                                    <OurText style={styles.productsTitle} translate={true}>orderInfoProducts</OurText>
                                    {
                                        data?.order?.lineItems?.nodes?.length && data.order.lineItems.nodes.map(v => {
                                            return <ProductCard key={v.databaseId} navigation={navigation} variation={v.variation} id={v.product.databaseId} quantity={v.quantity}  price={v.product.price} name={v.product.name} imageUrl={v.product.image.sourceUrl} />
                                        })
                                    }
                                </View>
                                <View style={styles.deliveryDetailsContainer}>
                                    <OurText style={styles.deliveryDetailsTitle} translate={true}>deliveryDetailsTitle</OurText>
                                    <View style={styles.deliveryDetailsInfo}>
                                        <DeliveryDetailsItem field={"orderFormFirstName"}
                                                             text={data?.order?.billing?.firstName}/>
                                        <DeliveryDetailsItem field={"orderFormLastName"}
                                                             text={data?.order?.billing?.lastName}/>
                                        <DeliveryDetailsItem field={"orderFormEmail"}
                                                             text={data?.order?.billing?.email}/>
                                        <DeliveryDetailsItem field={"orderFormPhone"}
                                                             text={data?.order?.billing?.phone}/>
                                        <DeliveryDetailsItem field={"orderFormCountry"}
                                                             text={countries[data?.order?.billing?.country]?.name || null}/>
                                        <DeliveryDetailsItem field={"orderFormAddress"}
                                                             text={data?.order?.billing?.address1}/>
                                        <DeliveryDetailsItem field={"orderFormPostcode"}
                                                             text={data?.order?.billing?.postcode}/>
                                    </View>
                                </View>
                                <View style={styles.deliveryDetailsContainer}>
                                    <OurText style={styles.deliveryDetailsTitle} translate={true}>deliveryMap</OurText>
                                    {
                                        coord ?
                                            <MapView
                                                style={{width: 320, height: 320}}
                                                mapPadding={{bottom: 32}}
                                                mapType={"none"}
                                                provider={"google"}
                                                initialRegion={{
                                                    ...coord,
                                                    latitudeDelta: 0.00922,
                                                    longitudeDelta: 0.00421,
                                                }}>
                                                <UrlTile
                                                    shouldReplaceMapContent={true}
                                                    tileSize={1}
                                                    urlTemplate="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
                                                />
                                                <Marker opacity={.99} coordinate={coord}>
                                                    <CourierIcon />
                                                </Marker>
                                            </MapView>
                                        :
                                            <OurActivityIndicator containerStyle={{width: 320, height: 320, position: null}} />
                                    }
                                </View>
                            </>
                    }
                </View>
            </ScrollView>
        </>
    );
};

export default OrderInfo;