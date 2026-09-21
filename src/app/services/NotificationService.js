import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

const WS_URL = import.meta.env.VITE_WS_URL || 
               (import.meta.env.VITE_API_URL 
                 ? import.meta.env.VITE_API_URL.replace('/api', '') 
                 : 'http://localhost:8082');

const WS_ENDPOINT = `${WS_URL}/ws`;



const isDevelopment = import.meta.env.MODE === 'development';

const log = (...args) => {
    if (isDevelopment) {
        console.log(...args);
    }
};

const logError = (...args) => {
    if (isDevelopment) {
        console.error(...args);
    }
};

const logWarn = (...args) => {
    if (isDevelopment) {
        console.warn(...args);
    }
};



class NotificationService {

    constructor() {
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.initialized = false;
        this.subscriptions = [];
        this.active = false;
        

    }

   

    async getAllNotifications() {
        try {
            const response = await fetch(`${API_URL}/api/notifications`);

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const notifications = await response.json();
            return notifications;

        } catch (error) {
            logError('❌ Erreur récupération notifications:', error);
            
            if (isDevelopment) {
                toast.error('Impossible de récupérer les notifications');
            }
            
            throw error;
        }
    }

    async getUnreadNotifications() {
        try {
            const notifications = await this.getAllNotifications();
            return notifications.filter(notification => !notification.lue);
        } catch (error) {
            logError('❌ Erreur récupération notifications non lues:', error);
            throw error;
        }
    }

    async getUnreadCount() {
        try {
            const notifications = await this.getUnreadNotifications();
            return notifications.length;
        } catch (error) {
            logError('❌ Erreur compteur notifications:', error);
            return 0;
        }
    }

    async markAsRead(id) {
        try {
            if (!id) {
                throw new Error('ID de notification obligatoire');
            }

            const response = await fetch(`${API_URL}/api/notifications/${id}/lire`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const notification = await response.json();
            log('✅ Notification marquée comme lue:', notification);
            return notification;

        } catch (error) {
            logError('❌ Erreur marquage notification:', error);
            
            if (isDevelopment) {
                toast.error('Impossible de marquer la notification comme lue');
            }
            
            throw error;
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch(`${API_URL}/api/notifications/lire-toutes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            log('✅ Toutes les notifications sont lues');
            return true;

        } catch (error) {
            logError('❌ Erreur marquage toutes notifications:', error);
            
            if (isDevelopment) {
                toast.error('Impossible de marquer toutes les notifications comme lues');
            }
            
            throw error;
        }
    }

    initialize() {
        if (this.initialized) return;
        if (this.active) return;


        this.client = new Client({
            webSocketFactory: () => {
                return new SockJS(WS_ENDPOINT);
            },

            reconnectDelay: 5000,

            debug: (str) => {
                // Désactiver les logs STOMP en production
                if (isDevelopment) {
                    // console.debug('STOMP:', str);
                }
            },

            onConnect: () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.active = true;

          
            },

            onDisconnect: () => {
                this.isConnected = false;
                this.active = false;
                log('❌ WebSocket déconnecté');

                
            },

            onStompError: (frame) => {
                logError('❌ Erreur STOMP:', frame);
                this.handleError(frame);
            },

            onWebSocketError: (error) => {
                logError('❌ Erreur WebSocket:', error);
                this.handleError(error);
            }
        });

        this.initialized = true;
    }


    subscribeToTopics() {
        if (!this.client || !this.client.connected) {
            logWarn('⚠️ Impossible de s\'abonner: client non connecté');
            return;
        }

        this.subscriptions.forEach(sub => {
            try {
                sub.unsubscribe();
            } catch (e) {
                logWarn('Erreur désabonnement:', e);
            }
        });

        this.subscriptions = [];

        const subscription = this.client.subscribe(
            '/topic/notifications',
            (message) => {
                try {
                    const notification = JSON.parse(message.body);
                    log('📨 Nouvelle notification:', notification);
                    this.handleNotification(notification);
                } catch (error) {
                    logError('❌ Erreur parsing notification:', error);
                }
            }
        );

        this.subscriptions.push(subscription);
        log('📡 Abonné à /topic/notifications');
    }


    handleNotification(notification) {
        log('📨 Notification reçue:', notification);

        const {
            type,
            titre,
            title,
            message,
            lingeId,
            codeBarre,
            categorie
        } = notification;

        const notificationTitle = titre || title || 'Notification';

        // Notification réclamation
        if (type === 'RECLAMATION') {
            this.showStandardNotification('WARNING', notificationTitle, message, null);
            return;
        }

        // Fin de vie
        if (type === 'FIN_DE_VIE') {
            this.showCriticalNotification(notificationTitle, message, 'WARNING');
            return;
        }

        // Stock uniforme
        if (type === 'STOCK_UNIFORME') {
            this.showStandardNotification('SUCCESS', notificationTitle, message, null);
            return;
        }

        // Notification générale
        this.showStandardNotification('INFO', notificationTitle, message, null);
    }


    showCriticalNotification(title, message, type) {
        // Afficher seulement si pas en mode silencieux
        if (import.meta.env.VITE_SILENT_MODE === 'true') {
            log('🔇 Mode silencieux - notification critique ignorée');
            return;
        }

        Swal.fire({
            title: title || '🚨 Alerte Critique',
            text: message || 'Une notification importante nécessite votre attention',
            icon: type === 'ERROR' ? 'error' : 'warning',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Voir maintenant',
            timer: 15000,
            timerProgressBar: true,
            showCancelButton: true,
            cancelButtonText: 'Ignorer'
        }).then((result) => {
            if (result.isConfirmed) {
                toast.info('📋 Redirection vers les notifications');
            }
        });
    }



    showStandardNotification(type, title, message, link) {
        // Afficher seulement si pas en mode silencieux
        if (import.meta.env.VITE_SILENT_MODE === 'true') {
            log('🔇 Mode silencieux - notification ignorée');
            return;
        }

        const options = {
            description: message,
            duration: 5000
        };

        if (link) {
            options.action = {
                label: '🔗 Voir',
                onClick: () => window.location.href = link
            };
        }

        switch (type) {
            case 'SUCCESS':
                toast.success(title || '✅ Succès', options);
                break;
            case 'INFO':
                toast.info(title || 'ℹ️ Information', options);
                break;
            case 'WARNING':
                toast.warning(title || '⚠️ Attention', options);
                break;
            case 'ERROR':
                toast.error(title || '❌ Erreur', options);
                break;
            default:
                toast(title || '📬 Notification', options);
        }
    }


    handleError(error) {
        this.reconnectAttempts++;

        logError('❌ Erreur notification:', error);

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logError('❌ Nombre maximum de tentatives atteint');
            
            if (isDevelopment) {
                toast.error('❌ Impossible de se connecter au service de notifications', {
                    description: 'Vérifiez votre connexion réseau',
                    duration: 10000
                });
            }
        }
    }


    start() {
        try {
        

            if (!this.initialized) {
                this.initialize();
            }

            if (this.client && !this.active) {
                this.client.activate();
                return true;
            }

            return false;

        } catch (error) {
            logError('❌ Erreur démarrage service:', error);
            
            if (isDevelopment) {
                toast.error('Erreur de démarrage du service de notifications');
            }
            
            return false;
        }
    }


    stop() {
        try {
            log('🔕 Arrêt du service de notification...');

            this.subscriptions.forEach(sub => {
                try {
                    sub.unsubscribe();
                } catch (e) {
                    logWarn('Erreur désabonnement:', e);
                }
            });

            this.subscriptions = [];

            if (this.client && this.client.connected) {
                this.client.deactivate();
            }

            this.isConnected = false;
            this.active = false;

            return true;

        } catch (error) {
            logError('❌ Erreur arrêt service:', error);
            return false;
        }
    }


    getConnectionStatus() {
        return this.isConnected;
    }

    isActive() {
        return this.active;
    }

    getConfig() {
        return {
            apiUrl: API_URL,
            wsEndpoint: WS_ENDPOINT,
            mode: import.meta.env.MODE,
            isConnected: this.isConnected,
            isActive: this.active
        };
    }


    sendMessage(destination, message) {
        if (!this.client || !this.client.connected) {
            logWarn('⚠️ Client non connecté');
            return false;
        }

        try {
            this.client.publish({
                destination: destination || '/app/notification',
                body: typeof message === 'string' ? message : JSON.stringify(message)
            });
            return true;
        } catch (error) {
            logError('❌ Erreur envoi message:', error);
            return false;
        }
    }
}


const notificationService = new NotificationService();


export const startNotificationService = () => notificationService.start();

export const stopNotificationService = () => notificationService.stop();

export const getNotificationStatus = () => notificationService.getConnectionStatus();

export const getNotificationConfig = () => notificationService.getConfig();

export const sendNotification = (destination, message) => 
    notificationService.sendMessage(destination, message);


export const getAllNotifications = () => notificationService.getAllNotifications();

export const getUnreadNotifications = () => notificationService.getUnreadNotifications();

export const getUnreadCount = () => notificationService.getUnreadCount();

export const markNotificationAsRead = (id) => notificationService.markAsRead(id);

export const markAllNotificationsAsRead = () => notificationService.markAllAsRead();

export default notificationService;