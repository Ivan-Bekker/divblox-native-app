import AsyncStorage from "@react-native-async-storage/async-storage";
import {Platform} from "expo-modules-core";
import * as Application from "expo-application";
import * as Device from "expo-device";

export const getDeviceUniqueId = async (forceReset = false) => {
    let deviceUniqueId = await AsyncStorage.getItem("deviceUniqueId");

    if (!forceReset && (deviceUniqueId !== null && deviceUniqueId.length > 0)) {
        return deviceUniqueId;
    }

    if (Platform.OS === "android") {
        deviceUniqueId = Application.getAndroidId();
    } else if (Platform.OS === "ios") {
        deviceUniqueId = await Application.getIosIdForVendorAsync();
    } else {
        deviceUniqueId = Application.applicationId;
    }

    await AsyncStorage.setItem("deviceUniqueId", deviceUniqueId);
    return deviceUniqueId;
}
export const getDeviceId = async (forceReset = false) => {
    let deviceId = await AsyncStorage.getItem("deviceId");

    if (!forceReset && (deviceId !== null && deviceId.length > 0)) {
        return deviceId;
    }

    if (Platform.OS === "android") {
        deviceId = Device.designName;
    } else if (Platform.OS === "ios") {
        deviceId = Device.modelId;
    } else {
        deviceId = Device.deviceName;
    }

    await AsyncStorage.setItem("deviceId", deviceId);
    return deviceId;
}
export const getDevicePlatform = () => {
    return Platform.OS;
}