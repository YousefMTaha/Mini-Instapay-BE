export enum EAccountType {
  SENDER = 'Sender',
  RECEIVER = 'Receiver',
  OWNER = 'Owner',
}

export const accountErrMsg = (type: string) => {
  const msg = {
    [EAccountType.SENDER]: 'No account found for the sender',
    [EAccountType.RECEIVER]: 'No account found for the receiver',
    [EAccountType.OWNER]: 'No account found',
  };

  return msg[type];
};
