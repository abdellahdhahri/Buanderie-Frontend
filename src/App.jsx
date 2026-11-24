// App.jsx
import { RouterProvider } from "react-router";
import { router } from "./routes/AppRoutes";
import React, { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { I18nextProvider } from "react-i18next"; 
import i18n from "./i18n"; 
import { LingeProvider } from "./contextes/LingeContext";
import { ServiceContext, ServiceProvider } from "./contextes/ServiceContext";
import { ModalProvider } from "./contextes/ModalContext";
import BacProvider from "./contextes/BacContext";
import { ProgrammeProvider } from "./contextes/ProgrammeContext";
import { AuthProvider } from "./constants/AuthContext";
import { MachineProvider } from "./contextes/MachineContext";
import { LanguageProvider } from "./i18n/LanguageProvider"; 
import { ChatbotProvider } from "./components/chatbot/ChatbotProvider";
import { isDarkTheme, onThemeChange } from "./utils/theme";



export default function App() {
    const [dark, setDark] = useState(isDarkTheme);
    useEffect(() => onThemeChange(setDark), []);

    return (
       <I18nextProvider i18n={i18n}>
            <LanguageProvider> 
                <ProgrammeProvider>
                    <BacProvider>
                        <MachineProvider>
                            <ModalProvider>
                                <ServiceProvider>
                                    <AuthProvider>
                                      <ChatbotProvider>
                                        <LingeProvider>
                                            <RouterProvider router={router} />
                                            <Toaster 
                                                position="top-right"
                                                theme={dark ? "dark" : "light"}
                                                richColors
                                                closeButton
                                                duration={4000}
                                            />
                                        </LingeProvider>
                                      </ChatbotProvider>
                                    </AuthProvider>
                                </ServiceProvider>
                            </ModalProvider>
                        </MachineProvider>
                    </BacProvider>
                </ProgrammeProvider>
            </LanguageProvider>
        </I18nextProvider>
    );
}