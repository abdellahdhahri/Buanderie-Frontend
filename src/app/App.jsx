// App.jsx
import { RouterProvider } from "react-router";
import { router } from "./routes";
import React, { useEffect } from "react";
import { Toaster } from "sonner";
import { I18nextProvider } from "react-i18next"; 
import i18n from "../i18n"; 
import { LingeProvider } from "./contextes/LingeContext";
import { ServiceContext, ServiceProvider } from "./contextes/ServiceContext";
import { ModalProvider } from "./contextes/ModalContext";
import BacProvider from "./contextes/BacContext";
import { ProgrammeProvider } from "./contextes/ProgrammeContext";
import { AuthProvider } from "./contextes/Authentication/AuthContext";
import { MachineProvider } from "./contextes/MachineContext";
import { LanguageProvider } from "../i18n/LanguageProvider"; 
import { ChatbotProvider } from "../app/components/chatbot/ChatbotProvider";


import { 
    startNotificationService, 
    stopNotificationService 
} from "./services/NotificationService";

export default function App() {
    useEffect(() => {
        // Démarrer le service de notification
        startNotificationService();

        // Nettoyer à la fermeture
        return () => {
            stopNotificationService();
        };
    }, []);

    return (
       <I18nextProvider i18n={i18n}>
        <ChatbotProvider>
            <LanguageProvider> 
                <ProgrammeProvider>
                    <BacProvider>
                        <MachineProvider>
                            <ModalProvider>
                                <ServiceProvider>
                                    <AuthProvider>
                                        <LingeProvider>
                                            <RouterProvider router={router} />
                                            <Toaster 
                                                position="top-right"
                                                richColors
                                                closeButton
                                                duration={4000}
                                            />
                                        </LingeProvider>
                                    </AuthProvider>
                                </ServiceProvider>
                            </ModalProvider>
                        </MachineProvider>
                    </BacProvider>
                </ProgrammeProvider>
            </LanguageProvider>
            </ChatbotProvider>
        </I18nextProvider>
    );
}