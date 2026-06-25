const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

exports.sendNotification = async (req, userId, title, body, data = {}) => {
  // 1. Send via Socket.io for immediate in-app delivery
  const io = req.app.get('io');
  if (io) {
    io.to(userId.toString()).emit('new_notification', { title, body, data, date: new Date() });
  }

  // 2. Send via Expo Push Notifications for background delivery
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      console.log('User has no push token');
      return;
    }

    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(`Push token ${user.pushToken} is not a valid Expo push token`);
      return;
    }

    const messages = [{
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('Push ticket:', ticketChunk);
      } catch (error) {
        console.error('Error sending push chunk:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendNotification:', error);
  }
};
