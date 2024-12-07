export enum accountType {
  SENDER = 'Sender',
  RECEIVER = 'Receiver',
  OWNER = 'Owner',
}

export const accountErrMsg = (type: string) => {
  const msg = {
    [accountType.SENDER]: 'No account found for the sender',
    [accountType.RECEIVER]: 'No account found for the receiver',
    [accountType.OWNER]: "You don't have any account yet",
  };

  return msg[type];
};
