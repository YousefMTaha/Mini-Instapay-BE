export enum notificationType {
  SEND = 'Send',
  RECIEVE = 'Recieve',
  REQUEST_SEND = 'Request_Send',
  FRAUD_DETECTION = 'Fraud_Detection',
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
