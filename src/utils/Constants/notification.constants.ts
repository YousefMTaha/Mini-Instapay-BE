export enum EnotificationType {
  SEND = 'Send',
  RECIEVE = 'Recieve',
  REQUEST_SEND = 'Request_Send',
  WRONG_PIN = 'Wrong_PIN',
}

export const notificationMsg = ({
  amount,
  destination,
}: {
  amount?: number;
  destination: string;
}) => {
  return {
    Recieved: `You have received ${amount} pound from ${destination}.`,
    Send: `You send ${amount} pound to ${destination}.`,
    requestSend: `${destination} Wants From you to send ${amount} pound.`,
    ConfirmSend: `You have received a collect request from ${destination}.`,
    rejectSend: `Your request to collect money from ${destination} rejected.`,
  };
};
