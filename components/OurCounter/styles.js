import { Dimensions, StyleSheet } from "react-native";

const styles = StyleSheet.create({
    mainContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    button: {
        backgroundColor: "#fff",
        borderRadius: 0,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    buttonRight: {
        borderBottomRightRadius: 8,
        borderTopRightRadius: 8,
    },
    buttonLeft: {
        borderBottomLeftRadius: 8,
        borderTopLeftRadius: 8,
    },
    textInput: {
        height: 32,
        width: 48,
        fontFamily: "Gilroy-Light",
        textAlign: "center",
        paddingVertical: 2,
        backgroundColor: "#fff",
    },
});

export default styles;