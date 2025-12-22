const { firestore } = require('../config/firebase'); // We use admin firestore
const admin = require('firebase-admin');
const axios = require('axios'); // We need axios to call Firebase REST API for login

// We need the Web API Key for the REST API calls (signInWithPassword)
// Ideally this should be in .env, but for now we might ask user or try to find it.
// Since we don't have it, we might need the user to provide it.
// HOWEVER, we can simplify: The "No Database Connection" requirement usually means "No Firestore from Client".
// It is debatable if "No Auth SDK" is required. 
// If we MUST proxy login:
const API_KEY = process.env.FIREBASE_API_KEY;

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Authenticate using Firebase REST API
        // https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[API_KEY]
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

        // Custom Logic based on Role
        if (role === 'child') {
            // Verify Parent Key
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
            // Generate Unique Link Key
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

        // Save User Doc
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

exports.logout = async (req, res) => {
    // Stateless logout usually just means client deletes token.
    res.json({ message: "Logged out" });
};
