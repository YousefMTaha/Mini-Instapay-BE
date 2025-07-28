export enum ENotificationType {
  SEND = 'Send',
  RECEIVE = 'Receive',
  REQUEST_SEND = 'Request_Send',
  WRONG_PIN = 'Wrong_PIN',
  REQUEST_REFUND = 'Request_Refund',
  REJECT_REFUND = 'Reject_Refund',
  REFUNDED = 'Refunded',
  EXCEED_LIMIT = 'Exceed_Limit',
  LOW_BALANCE = 'Low_Balance',
}

export const notificationMsg = ({
  amount,
  destination,
}: {
  amount?: number;
  destination?: string;
} = {}) => {
  return {
    Received: `You have received ${amount} pound from ${destination}.`,
    Send: `You send ${amount} pound to ${destination}.`,
    requestSend: `${destination} Wants From you to send ${amount} pound.`,
    ConfirmSend: `You have received a collect request from ${destination}.`,
    rejectSend: `Your request to collect money from ${destination} rejected.`,
    wrongPin: `You entered wrong your pin too times `,
  };
};
