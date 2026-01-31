const { firestore } = require('../config/firebase');

// Generate unique friend code in TIGER-XX format
const generateFriendCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let isUnique = false;

    while (!isUnique) {
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        code = `TIGER-${random}`;

        // Check if code already exists
        const snapshot = await firestore.collection('users')
            .where('friendCode', '==', code)
            .limit(1)
            .get();

        isUnique = snapshot.empty;
    }

    return code;
};

// Get or generate parent's friend code
exports.getFriendCode = async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await firestore.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();

        // Generate code if doesn't exist
        if (!userData.friendCode) {
            const newCode = await generateFriendCode();
            await firestore.collection('users').doc(uid).update({
                friendCode: newCode,
                friends: userData.friends || []
            });
            return res.json({ friendCode: newCode });
        }

        res.json({ friendCode: userData.friendCode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add friend by code (creates pending request)
exports.addFriend = async (req, res) => {
    try {
        const { uid } = req.params;
        const { friendCode } = req.body;

        if (!friendCode) {
            return res.status(400).json({ error: 'Friend code is required' });
        }

        // Find friend by code
        const friendSnapshot = await firestore.collection('users')
            .where('friendCode', '==', friendCode)
            .where('role', '==', 'parent')
            .limit(1)
            .get();

        if (friendSnapshot.empty) {
            return res.status(404).json({ error: 'Invalid friend code' });
        }

        const friendDoc = friendSnapshot.docs[0];
        const friendId = friendDoc.id;

        // Can't add yourself
        if (friendId === uid) {
            return res.status(400).json({ error: 'Cannot add yourself as a friend' });
        }

        // Check if already friends
        const userDoc = await firestore.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const currentFriends = userData.friends || [];

        if (currentFriends.includes(friendId)) {
            return res.status(400).json({ error: 'Already friends with this user' });
        }

        // Check if request already exists
        const existingRequest = await firestore.collection('friend_requests')
            .where('fromUserId', '==', uid)
            .where('toUserId', '==', friendId)
            .where('status', '==', 'pending')
            .get();

        if (!existingRequest.empty) {
            return res.status(400).json({ error: 'Friend request already sent' });
        }

        // Check if there's already a pending request from the other user
        const reverseRequest = await firestore.collection('friend_requests')
            .where('fromUserId', '==', friendId)
            .where('toUserId', '==', uid)
            .where('status', '==', 'pending')
            .get();

        if (!reverseRequest.empty) {
            return res.status(400).json({ error: 'This user has already sent you a request. Check your pending requests!' });
        }

        // Create friend request
        const friendData = friendDoc.data();
        await firestore.collection('friend_requests').add({
            fromUserId: uid,
            fromUserName: userData.name,
            toUserId: friendId,
            toUserName: friendData.name,
            status: 'pending',
            createdAt: new Date()
        });

        res.json({
            success: true,
            message: 'Friend request sent! Waiting for approval.',
            recipient: friendData.name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { uid, requestId } = req.params;

        // Get the request
        const requestDoc = await firestore.collection('friend_requests').doc(requestId).get();

        if (!requestDoc.exists) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        const requestData = requestDoc.data();

        // Verify the request is for this user
        if (requestData.toUserId !== uid) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Verify request is still pending
        if (requestData.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        // Add to friends list for both users
        const fromUserId = requestData.fromUserId;
        const toUserId = requestData.toUserId;

        // Update sender's friends
        const senderDoc = await firestore.collection('users').doc(fromUserId).get();
        const senderFriends = senderDoc.data().friends || [];
        await firestore.collection('users').doc(fromUserId).update({
            friends: [...senderFriends, toUserId]
        });

        // Update receiver's friends
        const receiverDoc = await firestore.collection('users').doc(toUserId).get();
        const receiverFriends = receiverDoc.data().friends || [];
        await firestore.collection('users').doc(toUserId).update({
            friends: [...receiverFriends, fromUserId]
        });

        // Update request status
        await firestore.collection('friend_requests').doc(requestId).update({
            status: 'accepted',
            respondedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Friend request accepted!',
            friend: {
                id: fromUserId,
                name: requestData.fromUserName
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
    try {
        const { uid, requestId } = req.params;

        // Get the request
        const requestDoc = await firestore.collection('friend_requests').doc(requestId).get();

        if (!requestDoc.exists) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        const requestData = requestDoc.data();

        // Verify the request is for this user
        if (requestData.toUserId !== uid) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Verify request is still pending
        if (requestData.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        // Update request status
        await firestore.collection('friend_requests').doc(requestId).update({
            status: 'rejected',
            respondedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Friend request rejected'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get friends list
exports.getFriends = async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await firestore.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const friendIds = userData.friends || [];

        if (friendIds.length === 0) {
            return res.json([]);
        }

        // Fetch friend details
        const friendsData = await Promise.all(
            friendIds.map(async (friendId) => {
                const friendDoc = await firestore.collection('users').doc(friendId).get();
                if (!friendDoc.exists) return null;

                const friend = friendDoc.data();

                // Get number of children
                const childrenSnapshot = await firestore.collection('users')
                    .where('parentUid', '==', friendId)
                    .get();

                return {
                    id: friendId,
                    name: friend.name,
                    email: friend.email,
                    childrenCount: childrenSnapshot.size
                };
            })
        );

        // Filter out null entries (deleted users)
        const validFriends = friendsData.filter(f => f !== null);
        res.json(validFriends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove friend
exports.removeFriend = async (req, res) => {
    try {
        const { uid, friendId } = req.params;

        // Remove from current user's friends
        const userDoc = await firestore.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const currentFriends = userData.friends || [];

        await firestore.collection('users').doc(uid).update({
            friends: currentFriends.filter(id => id !== friendId)
        });

        // Remove from friend's friends
        const friendDoc = await firestore.collection('users').doc(friendId).get();
        if (friendDoc.exists) {
            const friendData = friendDoc.data();
            const friendCurrentFriends = friendData.friends || [];

            await firestore.collection('users').doc(friendId).update({
                friends: friendCurrentFriends.filter(id => id !== uid)
            });
        }

        res.json({ success: true, message: 'Friend removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get friend's children stats (gamification only)
exports.getFriendChildren = async (req, res) => {
    try {
        const { uid, friendId } = req.params;

        // Verify they are friends
        const userDoc = await firestore.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const friends = userData.friends || [];

        if (!friends.includes(friendId)) {
            return res.status(403).json({ error: 'Not authorized to view this data' });
        }

        // Get friend's children
        const childrenSnapshot = await firestore.collection('users')
            .where('parentUid', '==', friendId)
            .get();

        const children = await Promise.all(
            childrenSnapshot.docs.map(async (doc) => {
                const childData = doc.data();

                // Get progress data for streaks and badges
                const progressDoc = await firestore.collection('child_progress').doc(doc.id).get();
                const progressData = progressDoc.exists ? progressDoc.data() : {};

                // Return ONLY gamification stats (no screen time)
                return {
                    id: doc.id,
                    name: childData.name,
                    totalPoints: childData.totalPoints || 0,
                    streak: progressData.streak || 0,
                    badges: progressData.badges || []
                };
            })
        );

        res.json(children);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get friends-only leaderboard
exports.getFriendsLeaderboard = async (req, res) => {
    try {
        const { uid } = req.params;

        // Get user and their friends
        const userDoc = await firestore.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const friendIds = userData.friends || [];

        // Get parent ID (if child) or use own ID (if parent)
        let parentId = uid;
        if (userData.role === 'child') {
            parentId = userData.parentUid;

            // Get parent's friends
            const parentDoc = await firestore.collection('users').doc(parentId).get();
            if (parentDoc.exists) {
                const parentData = parentDoc.data();
                friendIds.push(...(parentData.friends || []));
            }
        }

        // Get all children from own family + friend families
        const familyIds = [parentId, ...friendIds];

        const childrenPromises = familyIds.map(async (familyId) => {
            const snapshot = await firestore.collection('users')
                .where('parentUid', '==', familyId)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        });

        const childrenArrays = await Promise.all(childrenPromises);
        const allChildren = childrenArrays.flat();

        // Sort by totalPoints
        const sorted = allChildren.sort((a, b) =>
            (b.totalPoints || 0) - (a.totalPoints || 0)
        );

        // Add rank and get progress data
        const leaderboard = await Promise.all(
            sorted.map(async (child, index) => {
                const progressDoc = await firestore.collection('child_progress').doc(child.id).get();
                const progressData = progressDoc.exists ? progressDoc.data() : {};

                return {
                    id: child.id,
                    name: child.name,
                    totalPoints: child.totalPoints || 0,
                    rank: index + 1,
                    streak: progressData.streak || 0,
                    badges: progressData.badges || []
                };
            })
        );

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get pending friend requests
exports.getPendingRequests = async (req, res) => {
    try {
        const { uid } = req.params;

        // Get all pending requests where user is the recipient
        const snapshot = await firestore.collection('friend_requests')
            .where('toUserId', '==', uid)
            .where('status', '==', 'pending')
            .get();

        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        }));

        // Sort in memory instead of using orderBy (avoids index requirement)
        requests.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // Descending order
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

