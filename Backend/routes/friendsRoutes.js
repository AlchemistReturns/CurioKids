const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');

// Get or generate friend code
router.get('/code/:uid', friendsController.getFriendCode);

// Add friend by code (sends request)
router.post('/add/:uid', friendsController.addFriend);

// Get pending friend requests
router.get('/requests/:uid', friendsController.getPendingRequests);

// Accept friend request
router.post('/accept/:uid/:requestId', friendsController.acceptFriendRequest);

// Reject friend request
router.post('/reject/:uid/:requestId', friendsController.rejectFriendRequest);

// Get friends list
router.get('/:uid', friendsController.getFriends);

// Remove friend
router.delete('/:uid/:friendId', friendsController.removeFriend);

// Get friend's children stats
router.get('/children/:uid/:friendId', friendsController.getFriendChildren);

// Get friends-only leaderboard
router.get('/leaderboard/:uid', friendsController.getFriendsLeaderboard);

module.exports = router;

