export enum userRoles {
  User = 'User',
  Admin = 'Admin',
}

export const userStatus = {
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
  INVALID_PIN = 'INVALID_PIN',
  FORGET_PIN = 'Forget_PIN',
}

export enum authTypes {
  TOKEN = 'TOKEN',
  CODE = 'CODE',
}

export const PASSWORD_REGEX = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>/?]).{8,}$',
);
export const PASSWORD_REGEX_MSG =
  'Password must consist of 8 characters (at least one small letter, one capital letter, one number and one special character)';

export const MOBILE_REGEX = new RegExp('^01[0125]\\d{8}$');
export const MOBILE_REGEX_MSG = 'invalid mobile format';

export const TOKEN_REGEX = new RegExp(
  '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
);
export const TOKEN_REGEX_MSG = 'Invalid token formate';
