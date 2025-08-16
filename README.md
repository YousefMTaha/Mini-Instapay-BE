<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Mini-Instapay

Backend for a secure and efficient digital payment application inspired by InstaPay. The platform facilitates money transfers, multi-bank account management, real-time notifications and seamless transaction histories..

## Features

- **User Management:** Implemented secure registration, login, and profile update functionalities with OTP-based authentication and data encryption.
- **Banking Integration:** Enabled users to link, manage, and update multiple bank accounts efficiently.
- **Transaction Handling:** Developed features for sending and receiving money, detailed transaction histories, and dispute resolution with transaction limits and notifications.
- **Security Protocols:** Integrated two-factor authentication, end-to-end encryption, and fraud detection mechanisms.
- **Admin Dashboard:** Built modules for user and transaction management, dispute handling, and suspicious activity monitoring.
- **Notifications System:** Real-time push notifications and transaction alerts for a seamless user experience.

## API Documentation

[Postman-Doc](https://documenter.getpostman.com/view/25674968/2sAYBVgWWv)

## Running the app

Clone the project

```bash
  git clone https://github.com/YousefMTaha/Mini-Instapay-BE
```

Go to the project directory

```bash
  cd Mini-instapay-BE
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

## Environment Variables

To run this project, you will need to add the following environment variables to your config/.env file

```env
MAIL_USER_NAME=tyousef262@gmail.com
MAIL_PASSWORD=pngu mkjw kafq ylxf
TOKEN_SIGNUP=THIS TOKEN FOR SIGNUP
TOKEN_LOGIN=THIS TOKEN FOR LOGIN
TOKEN_PRE_LOGIN=THIS TOKEN FOR PRE LOGIN
TOKEN_FORGET_PASSWORD=THIS TOKEN FOR PRE FORGET PASSWORD
TOKEN_CHANGE_EMAIL=THIS TOKEN FOR PRE CHANGE_EMAIL
TOKEN_FORGET_PIN=THIS TOKEN FOR PRE FORGET PIN
TOKEN_CONFIRM_OTP_FORGET=THIS TOKEN FOR PRE CONFIRM_OTP_FORGET
EXCEED_TRIES=EXCEED
DB_Cloud_URl=mongodb+srv://tyousef262:pFRnRyJt4BhXXsRA@cluster0.cwz5mhe.mongodb.net/instapay
```
