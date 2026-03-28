/* PATATA — Public Site API Client
   Standalone version for decoupled deployment.
*/

const PatataAPI = (() => {
    // --- Configuration ---
    // You can override this by setting window.PATATA_SITE_API_CONFIG before loading this script.
    const config = window.PATATA_SITE_API_CONFIG || {};

    // 1. Manual Override logic (if needed in future)
    let baseUrl = config.apiUrl;

    // 2. Auto-detect environment if no manual override
    if (!baseUrl) {
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:';

        // Default to local backend on port 5500 if on localhost/file
        // If hosted on same domain as api, use relative '/api'
        baseUrl = isLocalhost ? 'http://localhost:5500/api' : '/api';
    }

    const API_URL = baseUrl;
    console.log('Patata Public API connected to:', API_URL);

    // --- Helpers ---
    function getHeaders() {
        return { 'Content-Type': 'application/json' };
    }

    // --- Public Methods (Only what the site needs) ---

    // 1. Create Order
    async function addOrder(items, customer = {}) {
        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    items,
                    customer,
                    total: items.reduce((s, i) => s + i.price * (i.qty || 1), 0)
                })
            });
            return await res.json();
        } catch (e) {
            console.error('Add Order Error:', e);
            return null;
        }
    }

    // 2. Create Reservation
    async function addReservation(data) {
        try {
            const res = await fetch(`${API_URL}/reservations`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (e) {
            console.error('Add Reservation Error:', e);
            return null;
        }
    }

    return {
        addOrder,
        addReservation
    };
})();
