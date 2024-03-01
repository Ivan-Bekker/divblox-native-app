import {StyleSheet} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import WebView from "react-native-webview";
import {divblox} from "./assets/js/divblox.js";
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export default function App() {
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        (async () => {
            await divblox.init();
            let token = await divblox.registerDeviceForPushNotifications();
            await divblox.createPushRegistration(token);

            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                setNotification(notification);
            });

            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                console.log(response);
            });
        })();

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    return (
        <WebView
            style={styles.container}
            source={{uri: divblox.getLoadingUrl()}}
            onMessage={event => divblox.receiveMessageFromWeb(event)}
            onError={syntheticEvent => {
                const {nativeEvent} = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
            }}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});