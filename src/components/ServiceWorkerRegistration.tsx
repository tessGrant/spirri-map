'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
    useEffect(() => {
        const registerServiceWorker = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    // Unregister any existing service workers
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }

                    // Register new service worker
                    const registration = await navigator.serviceWorker.register('/service-worker.js', {
                        scope: '/',
                    });

                    // Log registration success
                    console.log('ServiceWorker registration successful:', registration);

                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.addEventListener('statechange', () => {
                                if (installingWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        console.log('New content is available; please refresh.');
                                    } else {
                                        console.log('Content is cached for offline use.');
                                    }
                                }
                            });
                        }
                    });
                } catch (error) {
                    console.error('ServiceWorker registration failed:', error);
                }
            }
        };

        // Register service worker when page loads
        window.addEventListener('load', registerServiceWorker);

        // Cleanup
        return () => {
            window.removeEventListener('load', registerServiceWorker);
        };
    }, []);

    return null;
}