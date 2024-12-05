export enum notificationType {
  SEND = 'Send',
  RECIEVE = 'recieve',
  CONFIRM_SEND = 'confirm_send',
}

export const notificationMsg = ({
  amount,
  destination,
}: {
  amount: number;
  destination: string;
}) => {
  return {
    Recieved: `You have received ${amount} from ${destination}`,
    Send: `You send ${amount} to ${destination}`,
    ConfirmSend: `You have received a collect request from ${destination}`,
  };
};
