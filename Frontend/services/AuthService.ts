import { CONFIG } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthService = {
    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            await AsyncStorage.setItem('token', data.token);
            return data.user;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async register(email, password, name, age, role = 'child', parentKey = '') {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, age, role, parentKey })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');

            // Auto-login after successful registration
            return await this.login(email, password);
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async changePassword(email: string, currentPassword: string, newPassword: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, currentPassword, newPassword })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to change password');
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async logout() {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
    },

    async getCurrentUser() {
        const userJson = await AsyncStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    }
};
