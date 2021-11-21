require('dotenv').config()

const to = require('await-to-js').default
const yf = require('yahoo-finance')
const indicators = require('technicalindicators');
const dateFns = require('date-fns')
const { Telegraf } = require('telegraf')
const cron = require('node-cron')

const symbols = [
    ["BTC-USD", "Bitcoin"],
    ["ETH-USD", "Ethereum"],
    ["BNB-USD", "BinanceCoin"],
    ["SOL1-USD", "Solana"],
    ["ADA-USD", "Cardanno"],
    ["DOT1-USD", "Polkadot"],
    ["AVAX-USD", "Avalanche"],
    ["AAPL", "Apple"],
    ["TSLA", "Tesla"],
    // ["AMEW.SG", "Msci World"], // my ETF seems not work,
    ["EUNL.DE", "Msci World"], // use this one instead...
    ["PAEEM.PA", "Msci Emerging Markets"],
    ["C50.PA", "Msci Euro Stoxx 50"],
]

// Fetch prices on Yahoo and calculate the RSI
async function getRsi(symbol) {
    // Fetch prices using Yahoo Finance
    const [err, quotes] = await to(yf.historical({
        symbol,
        from: dateFns.format(dateFns.subDays(new Date(), 100), 'yyyy-MM-dd'),
        to: dateFns.format(new Date(), 'yyyy-MM-dd'),
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
        emoji = "❤️"
    } else if (value > 50) {
        emoji = "🧡"
    } else if (value > 30) {
        emoji = "💛"
    } else {
        emoji = "💚"
    }
    return emoji
}

async function buildAllRsiMessage() {
    const result = []

    // Get RSIs
    for (const [symbol, name] of symbols) {
        const rsi = await getRsi(symbol)
        result.push({ rsi, symbol, name })
    }

    // Sort
    const sorted = result.sort((a, b) => b.rsi - a.rsi)

    // Concat (write)
    let msg = 'RSI per coins:\n---\n'
    let errors = []
    for (const { rsi, name, symbol } of sorted) {
        // const prettySymbol = symbol.replace(".", " . ").replace("-USD", "")
        if (!!rsi) {
            msg += `${getEmoji(rsi)} ${name}: ${Number(rsi).toFixed()}\n`
        } else {
            errors.push(symbol)
        }
    }

    // Push errors in the footer of the message.
    if (errors.length) {
        msg += "\nErrors:\n---\n"
        for (const error of errors) {
            msg += `${error}\n`
        }
    }

    return msg
}

// Ask token to the @BotFather.
const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

// On bot starts, launch the CRON job.
bot.start(ctx => {
    // “At 08:00 on every day-of-month from 1 through 31.”
    cron.schedule("0 8 1-31 * *", async () => {
        const message = await buildAllRsiMessage()
        ctx.reply(message)
    });
})

// Just to check if it works ¯\(ツ)/¯
bot.on('text', async ctx => {
    ctx.reply("Hey 👋\nThe bot in running, you will receive update each morning at 8am, Europe timezone.")
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
