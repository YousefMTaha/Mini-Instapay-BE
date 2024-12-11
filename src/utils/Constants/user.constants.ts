export enum userRoles {
  User = 'User',
  Admin = 'Admin',
}

export const userstatus = {
  Online: 'Online',
  Offline: 'Offline',
  Suspended: 'Suspended',
};

export enum authForOptions {
  TRANSACTION = 'TRANSACTION',
  PRE_LOGIN = 'PRE_LOGIN',
  SIGNUP = 'SIGNUP',
  FORGET_PASSWORD = 'FORGET_PASSWORD',
  CHANGE_EMAIL = 'CHANGE_EMAIL',
}

export enum authTypes {
  TOKEN = 'TOKEN',
  CODE = 'CODE',
}
