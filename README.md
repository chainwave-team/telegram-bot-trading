# RSI Notifier bot

> Wanna fork? Feel free and chat with the Telegram bot @BotFather to have your TOKEN.

## How it works
- Fetch Stock/Currency from Yahoo Finance (find symbols there).
- Calculate the RSI (daily, 14).
- Send a daily Telegram notification using CRON.

# Installation

It's a basic nodejs app, so

```sh
git clone [github_url] rsi-bot
cd rsi-bot
npm install
npm run start
```
