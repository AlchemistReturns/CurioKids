import { CONFIG } from '../config/firebase';

export const FriendsService = {
    async getFriendCode(uid: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/code/${uid}`);
            if (!response.ok) throw new Error('Failed to fetch friend code');
            return await response.json();
        } catch (error) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },

    async addFriend(uid: string, friendCode: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/add/${uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ friendCode }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add friend');
            }

            return await response.json();
        } catch (error: any) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },

    async getFriends(uid: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/${uid}`);
            if (!response.ok) throw new Error('Failed to fetch friends');
            return await response.json();
        } catch (error) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },

    async removeFriend(uid: string, friendId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/${uid}/${friendId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to remove friend');
            return await response.json();
        } catch (error) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },

    async getFriendChildren(uid: string, friendId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/children/${uid}/${friendId}`);
            if (!response.ok) throw new Error('Failed to fetch friend children');
            return await response.json();
        } catch (error) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },

    async getFriendsLeaderboard(uid: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/leaderboard/${uid}`);
            if (!response.ok) throw new Error('Failed to fetch friends leaderboard');
            return await response.json();
        } catch (error) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },

    async getPendingRequests(uid: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/requests/${uid}`);
            if (!response.ok) throw new Error('Failed to fetch pending requests');
            return await response.json();
        } catch (error) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },

    async acceptFriendRequest(uid: string, requestId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/accept/${uid}/${requestId}`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to accept friend request');
            return await response.json();
        } catch (error) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },

    async rejectFriendRequest(uid: string, requestId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/friends/reject/${uid}/${requestId}`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to reject friend request');
            return await response.json();
        } catch (error) {
            console.error('FriendsService Error:', error);
            throw error;
        }
    },
};
