// src/app/services/NotificationService.js (version améliorée)
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

class NotificationService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.initialized = false;
        this.subscriptions = [];
    }

    initialize() {
        if (this.initialized) return;

        this.client = new Client({
            webSocketFactory: () => {
                console.log('🔄 Création de la connexion WebSocket...');
                return new SockJS("http://localhost:8082/ws");
            },

            reconnectDelay: 5000,

            debug: (str) => {
                // Logs de debug (désactiver en production)
                // console.debug('STOMP:', str);
            },

            onConnect: () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                console.log('✅ WebSocket connecté');

                // S'abonner aux topics
                this.subscribeToTopics();

                // Afficher une notification de connexion
                toast.success('🔔 Connecté au service de notifications');
            },

            onDisconnect: () => {
                this.isConnected = false;
                console.log('❌ WebSocket déconnecté');
                toast.warning('📡 Connexion perdue, tentative de reconnexion...');
            },

            onStompError: (frame) => {
                console.error('❌ Erreur STOMP:', frame);
                this.handleError(frame);
            },

            onWebSocketError: (error) => {
                console.error('❌ Erreur WebSocket:', error);
                this.handleError(error);
            }
        });

        this.initialized = true;
    }

    subscribeToTopics() {
        if (!this.client || !this.client.connected) return;

        // Topic principal des notifications
        const subscription = this.client.subscribe(
            "/topic/notifications",
            (message) => {
                try {
                    const notification = JSON.parse(message.body);
                    this.handleNotification(notification);
                } catch (error) {
                    console.error('Erreur parsing notification:', error);
                }
            }
        );
        this.subscriptions.push(subscription);

        // Topic privé pour les notifications utilisateur
        // const privateSubscription = this.client.subscribe(
        //     "/user/queue/notifications",
        //     (message) => {
        //         try {
        //             const notification = JSON.parse(message.body);
        //             this.handleNotification(notification);
        //         } catch (error) {
        //             console.error('Erreur parsing notification:', error);
        //         }
        //     }
        // );
        // this.subscriptions.push(privateSubscription);

        console.log('📡 Abonné aux topics de notification');
    }

    handleNotification(notification) {
        console.log('📨 Nouvelle notification:', notification);

        const { type, title, message, data, link, priority, timestamp } = notification;

        // Notifications avec priorité haute
        if (priority === 'HIGH' || type === 'CRITICAL' || type === 'ERROR' && priority === 'HIGH') {
            this.showCriticalNotification(title, message, type);
            return;
        }

        // Notifications standards
        this.showStandardNotification(type, title, message, link);
    }

    showCriticalNotification(title, message, type) {
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
                // Action pour les notifications critiques
                // window.location.href = '/notifications';
                toast.info('📋 Redirection vers les notifications');
            }
        });
    }

    showStandardNotification(type, title, message, link) {
        const duration = 5000;
        const options = {
            description: message,
            duration: duration,
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
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
            toast.error('❌ Impossible de se connecter au service de notifications', {
                description: 'Vérifiez votre connexion réseau',
                duration: 10000
            });
        }
    }

    start() {
        try {
            console.log('🔔 Démarrage du service de notification...');
            if (!this.initialized) {
                this.initialize();
            }
            
            if (this.client) {
                this.client.activate();
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erreur démarrage service:', error);
            toast.error('Erreur de démarrage du service de notifications');
            return false;
        }
    }

    stop() {
        try {
            console.log('🔕 Arrêt du service de notification...');
            
            // Désabonner tous les topics
            this.subscriptions.forEach(sub => {
                try {
                    sub.unsubscribe();
                } catch (e) {
                    console.warn('Erreur désabonnement:', e);
                }
            });
            this.subscriptions = [];

            // Déconnecter le client
            if (this.client && this.client.connected) {
                this.client.deactivate();
            }
            
            this.isConnected = false;
            return true;
        } catch (error) {
            console.error('❌ Erreur arrêt service:', error);
            return false;
        }
    }

    getConnectionStatus() {
        return this.isConnected;
    }

    sendMessage(destination, message) {
        if (!this.client || !this.client.connected) {
            console.warn('⚠️ Client non connecté, impossible d\'envoyer le message');
            return false;
        }

        try {
            this.client.publish({
                destination: destination || '/app/notification',
                body: typeof message === 'string' ? message : JSON.stringify(message)
            });
            return true;
        } catch (error) {
            console.error('❌ Erreur envoi message:', error);
            return false;
        }
    }
}

// Instance unique (Singleton)
const notificationService = new NotificationService();

// Exports nommés
export const startNotificationService = () => notificationService.start();
export const stopNotificationService = () => notificationService.stop();
export const getNotificationStatus = () => notificationService.getConnectionStatus();
export const sendNotification = (destination, message) => notificationService.sendMessage(destination, message);

// Export par défaut
export default notificationService;