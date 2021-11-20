const to = require('await-to-js').default
const yf = require('yahoo-finance')
const indicators = require('technicalindicators');
const dateFns = require('date-fns')

function formatDate(date) {
    return dateFns.format(date, 'yyyy-MM-dd')
}

const symbols = [
    ["BTC-USD", "Bitcoin"],
    ["ETH-USD", "Ethereum"],
    ["AAPL", "Apple"],
    ["TSLA", "Tesla"],
]

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

async function main() {
    for (const [symbol, name] of symbols) {
        const rsi = await getRsi(symbol)

        console.log(`${getEmoji(rsi)} ${name} (${symbol}): RSI is ${rsi}`);
    }
}

main()
