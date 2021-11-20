# RSI BOT

Fetch Stock/Currency from Yahoo Finance
Calculate the RSI (daily, 14).
Send a Telegram notification when it is out of the range 30-70.

Repeat this process daily using CRON.

# Installation

It's a basic nodejs app, so

```sh
git clone [github_url] rsi-bot
cd rsi-bot
npm install
npm run start
```