import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export interface SendNotificationParams {
  to: string;
  title?: string;
  body?: string;
  data?: object;
}

export const sendPushNotification = async ({
  to,
  title,
  body,
  data,
}: SendNotificationParams) => {
  if (!Expo.isExpoPushToken(to)) {
    console.error(`Push token ${to} is not a valid Expo push token`);
    return;
  }

  const messages: ExpoPushMessage[] = [
    {
      to,
      sound: "default",
      title,
      body,
      data,
    },
  ];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error("Error sending notification chunk:", error);
    }
  }

  return tickets;
};
