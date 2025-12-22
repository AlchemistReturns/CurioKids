const { firestore } = require('../config/firebase');
const admin = require('firebase-admin');
const axios = require('axios');


const API_KEY = process.env.FIREBASE_API_KEY;

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {

        if (!API_KEY) {
            return res.status(500).json({ error: "Backend missing FIREBASE_API_KEY" });
        }

        const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
            email,
            password,
            returnSecureToken: true
        });

        // Get user details to return role/name
        const uid = response.data.localId;
        const userDoc = await firestore.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        res.json({
            user: {
                uid: uid,
                email: response.data.email,
                ...userData
            },
            token: response.data.idToken,
            refreshToken: response.data.refreshToken,
            expiresIn: response.data.expiresIn
        });

    } catch (error) {
        console.error("Login Error:", error.response?.data || error.message);
        res.status(401).json({ error: "Invalid credentials" });
    }
};

exports.register = async (req, res) => {
    const { email, password, name, age, role, parentKey } = req.body;
    try {
        let parentUid = null;
        let linkKey = null;

        if (role === 'child') {

            if (!parentKey) return res.status(400).json({ error: "Parent key is required for child account" });

            const parentQuery = await firestore.collection('users')
                .where('linkKey', '==', parentKey.trim().toUpperCase())
                .where('role', '==', 'parent')
                .limit(1)
                .get();

            if (parentQuery.empty) {
                return res.status(400).json({ error: "Invalid parent key" });
            }
            parentUid = parentQuery.docs[0].id;

        } else if (role === 'parent') {

            let isUnique = false;
            while (!isUnique) {
                linkKey = Math.random().toString(36).substring(2, 8).toUpperCase();
                const keyCheck = await firestore.collection('users').where('linkKey', '==', linkKey).get();
                if (keyCheck.empty) isUnique = true;
            }
        }

        // Create Auth User
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name
        });

        // Prepare User Doc
        const userDoc = {
            email,
            name,
            role: role || 'child',
            createdAt: new Date()
        };

        if (role === 'child') {
            userDoc.age = age || null;
            userDoc.parentUid = parentUid;
        } else if (role === 'parent') {
            userDoc.linkKey = linkKey;
        }


        await firestore.collection('users').doc(userRecord.uid).set(userDoc);

        // Initialize progress only for child
        if (role === 'child') {
            await firestore.collection('child_progress').doc(userRecord.uid).set({
                totalPoints: 0,
                stars: 0,
                completedLessons: [],
                streak: 0
            });
        }

        res.status(201).json({
            message: "User created",
            uid: userRecord.uid,
            role: role || 'child'
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
        if (!API_KEY) {
            return res.status(500).json({ error: "Backend missing FIREBASE_API_KEY" });
        }

        // 1. Verify current password credentials (re-auth equivalent)
        const signInResponse = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
            email,
            password: currentPassword,
            returnSecureToken: true
        });

        const uid = signInResponse.data.localId;

        // 2. Update password using Admin SDK
        await admin.auth().updateUser(uid, {
            password: newPassword
        });

        res.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Change Password Error:", error.response?.data || error.message);
        const errorCode = error.response?.data?.error?.message || "Failed to change password";

        if (errorCode === "INVALID_PASSWORD" || errorCode === "INVALID_LOGIN_CREDENTIALS") {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        res.status(400).json({ error: errorCode });
    }
};

exports.logout = async (req, res) => {
    res.json({ message: "Logged out" });
};
