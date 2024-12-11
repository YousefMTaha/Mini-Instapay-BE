export enum EaccountType {
  SENDER = 'Sender',
  RECEIVER = 'Receiver',
  OWNER = 'Owner',
}

export const accountErrMsg = (type: string) => {
  const msg = {
    [EaccountType.SENDER]: 'No account found for the sender',
    [EaccountType.RECEIVER]: 'No account found for the receiver',
    [EaccountType.OWNER]: 'No account found',
  };

  return msg[type];
};
