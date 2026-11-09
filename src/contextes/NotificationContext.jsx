import { createContext, useContext, useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

const NotificationContext = createContext();


export function NotificationProvider({ children }) {

  const API_BASE_URL = import.meta.env.VITE_API_URL ;
    const [notifications, setNotifications] = useState([]);


    useEffect(() => {


        const client = new Client({

            webSocketFactory: () =>
                new SockJS(`${API_URL}/ws`),


            reconnectDelay: 5000,


            onConnect: () => {


                console.log("WebSocket Notification connecté");


                client.subscribe(
                    "/topic/notifications",

                    (message) => {


                        const notification =
                            JSON.parse(message.body);


                        console.log(
                            "Nouvelle notification",
                            notification
                        );


                        setNotifications(prev => [
                            {
                                id: Date.now(),
                                type: notification.type,
                                message: notification.message,
                                time: "Maintenant"
                            },
                            ...prev
                        ]);


                    }
                );

            }

        });


        client.activate();


        return () => {
            client.deactivate();
        };


    }, []);



    return (
        <NotificationContext.Provider
            value={{
                notifications,
                setNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );

}



export function useNotifications(){

    return useContext(NotificationContext);

}