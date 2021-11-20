require('dotenv').config()

const to = require('await-to-js').default
const yf = require('yahoo-finance')
const indicators = require('technicalindicators');
const dateFns = require('date-fns')
const { Telegraf } = require('telegraf')

const symbols = [
    ["BTC-USD", "Bitcoin"],
    ["ETH-USD", "Ethereum"],
    ["AAPL", "Apple"],
    ["TSLA", "Tesla"],
]

function formatDate(date) {
    return dateFns.format(date, 'yyyy-MM-dd')
}

// Fetch prices on Yahoo and calculate the RSI
async function getRsi(symbol) {
    // Fetch prices using Yahoo Finance
    const [err, quotes] = await to(yf.historical({
        symbol,
        from: formatDate(dateFns.subDays(new Date(), 100)),
        to: formatDate(new Date()),
        period: 'd'  // (daily)
    }))

    if (err) {
        throw new Error("Error while fetching prices")
    }

    // Calc the Relative Strength Index (RSI)
    const rsi = indicators.rsi({
        values: quotes.reverse().map(quote => quote.close),
        period: 14
    })

    // Return the last value (nearest from today)
    return rsi[rsi.length - 1]
}

function getEmoji(value) {
    let emoji
    if (value > 70) {
        emoji = "🔴"
    } else if (value > 50) {
        emoji = "🟠"
    } else if (value > 30) {
        emoji = "🟡"
    } else {
        emoji = "🟢"
    }
    return emoji
}

async function buildAllRsiMessage() {
    let msg = ''
    let errors = []
    for (const [symbol, name] of symbols) {
        const rsi = await getRsi(symbol)
        if (!!rsi) {
            msg += `${getEmoji(rsi)} ${name} (${symbol}): RSI is ${rsi}\n`
        } else {
            errors.push(symbol)
        }
    }

    // Push errors in the footer of the message.
    if (errors.length) {
        msg += "\n---\nErrors:\n"
        for (const error of errors) {
            msg += `${error}\n`
        }
    }

    return msg
}

// Ask token to the BotFather.
const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

bot.on('text', async (ctx) => {
    const message = await buildAllRsiMessage()
    ctx.reply(message)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
