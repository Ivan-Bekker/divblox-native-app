import {Alert, Linking} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import appJson from "./../../app.json";
import {dxRequestInternal, isJsonString} from "./utilities";
import {getDeviceId, getDevicePlatform, getDeviceUniqueId} from "./device_info";
import {Platform} from "expo-modules-core";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

export const divblox = {
    baseUrl: appJson.expo.serverBaseUrl,
    dxAuthenticationToken: null,

    getLoadingUrl: function() {
        return this.baseUrl+"?view=native_landing&init_native=1"
    },
    errorHandler: (error, stackTrace) => {
        console.error(error);
    },

    async receiveMessageFromWeb(event) {
        if (!isJsonString(event.nativeEvent.data)) {
            console.log("Payload received is not json format", receivedData);
            return;
        }
        if (typeof event.nativeEvent === "undefined") {
            console.log("nativeEvent not set in event", receivedData);
            return;
        }

        let receivedData = JSON.parse(event.nativeEvent.data);

        if (typeof receivedData.function_to_execute === "undefined") {
            console.log("function_to_execute not set in data", receivedData);
            return;
        }

        if (typeof this[receivedData.function_to_execute] === "undefined") {
            console.log("Function not yet implemented", receivedData);
            return;
        }

        await this[receivedData.function_to_execute](receivedData);
    },
    async redirectToExternalPath(receivedData) {
        const canOpenURL = await Linking.canOpenURL(receivedData.redirect_url);
        if (!canOpenURL) {
            console.log("Don`t know how to open URI", receivedData.redirect_url);
            return;
        }
        Alert.alert(
            "Open Web Page",
            "You are now leaving the app and will be redirected.",
            [{
                text: "Go",
                onPress: async () => await Linking.openURL(receivedData.redirect_url),
            }, {
                text: "Cancel"
            }],
            {cancelable: true}
        );
    },
    async sendPushNotification(receivedData) {
        if (typeof receivedData.pushNotificationData === "undefined") {
            return false;
        }

        // https://docs.expo.dev/push-notifications/sending-notifications/#message-request-format
        let data = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(receivedData.pushNotificationData),
        });
        data = await data.json();
        if (typeof data.errors !== "undefined") {
            console.warn(data);
        }
    },

    async init() {
        await this.loadDxAuthenticationToken();
        if (this.dxAuthenticationToken === null) {
            await divblox.registerDevice();
        }
    },
    async loadDxAuthenticationToken(forceReload = false) {
        try {
            if (forceReload) {
                this.dxAuthenticationToken = null;
                return;
            }
            this.dxAuthenticationToken = await AsyncStorage.getItem("dxAuthenticationToken");
        } catch (error) {
            this.dxAuthenticationToken = null;
            console.warn(error);
        }
    },
    async registerDevice() {
        let registerResult = await dxRequestInternal(
            this.baseUrl + "/api/client_authentication_token/registerDevice",
            {
                AuthenticationToken: this.dxAuthenticationToken,
                DeviceUuid: await getDeviceUniqueId(),
                DevicePlatform: await getDeviceId(),
                DeviceOs: getDevicePlatform(),
            },
        );

        if (registerResult.Result !== "Success") {
            throw new Error("Error occurred generating Authentication Token: "+registerResult.Message);
        }

        this.dxAuthenticationToken = registerResult.AuthenticationToken;
        await AsyncStorage.setItem("dxAuthenticationToken", this.dxAuthenticationToken);
    },
    async createPushRegistration(registrationId) {
        let returnData = {error: "Unknown"};
        if (typeof registrationId === "undefined") {
            returnData.error = "No registration id provided";
            return returnData;
        }
        this.pushRegistrationId = await AsyncStorage.getItem("PushRegistrationId");
        if (this.pushRegistrationId !== null) {
            // We only want to send the push registration once
            returnData.error = "Already registered";
            return returnData;
        }

        const pushRegistrationResult = await dxRequestInternal(
            this.baseUrl + "/api/global_functions/updatePushRegistration",
            {
                registration_id: registrationId,
                device_uuid: await getDeviceUniqueId(),
                device_platform: await getDeviceId(),
                device_os: getDevicePlatform(),
                AuthenticationToken: this.dxAuthenticationToken,
            },
        );
        if (typeof pushRegistrationResult.dxRequestInternalError === "undefined") {
            if (pushRegistrationResult.Result === "Success") {
                await AsyncStorage.setItem("PushRegistrationId", registrationId);
            }
        }
    },
    async registerDeviceForPushNotifications() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            let {status} = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                status = {status} = await Notifications.requestPermissionsAsync();
            }
            if (status !== 'granted') {
                return;
            }
            token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig.extra.eas.projectId,
            });
        }

        if (typeof token.data === "undefined") {
            return;
        }

        return token.data;
    }
}