const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');
const { writeFileSync } = require('fs');

async function getHtmlFrom(day, month, year) {
    return axios.get(
        `https://www.informatik.uni-leipzig.de/~duc/amlich/PHP/index.php?dd=${day}&mm=${month}&yy=${year}`
    );
}

async function getYearName(day, month, year) {
    const response = await getHtmlFrom(day, month, year)
    const html = response.data;
    const $ = cheerio.load(html);
    return $('div#namam').text().replace('Năm ', '')
}

async function extractCalendarData(month, year) {
    return new Promise(async resolve => {
        try {
            const response = await getHtmlFrom(1, month, year)
            const html = response.data;
            const $ = cheerio.load(html);
            const calendar = {};
            let lunarMonth = 0;
            let lunarYear = '';
            let leapM = '';
            for (const week of $('table.thang > tbody > tr.normal').get()) {
                for (const item of $(week).children('td').get()) {
                    const sonar = $(item).find('div').not('.am').not('.am2').text().trim();
                    const lunar = $(item).find('div.am').text()
                        || $(item).find('div.am2').text();

                    if (!!sonar) {
                        const date = extractNum(lunar);
                        if (date.length >= 2) {
                            lunarMonth = date[1];
                            lunarYear = await getYearName(clearNum(sonar), month, year)
                            leapM = lunar.includes('(N)') ? ' (Nhuận)' : '';
                        }
                        calendar[`${clearNum(sonar)}/${month}`] = !!lunarMonth
                            ? `${date[0]}/${lunarMonth}/${lunarYear}${leapM}`
                            : '';
                    }
                }
            }
            resolve({
                [`${month}`]: calendar
            })
        } catch (e) {
            console.log(e)
            throw e;
        }
    })
}

function clearNum(raw) {
    return (extractNum(raw))[0];
}

function extractNum(raw) {
    return raw.match(/\d+/g);
}

async function writeFile(path, data) {
    try {
        writeFileSync(path, JSON.stringify(data, null, 4), 'utf8');
    } catch (e) {
        console.log(e)
        throw e;
    }
}


async function getData(start, end) {
    console.log(start);
    if (start >= end) {
        return;
    }
    const data = await Promise.all([
        extractCalendarData(1, start),
        extractCalendarData(2, start),
        extractCalendarData(3, start),
        extractCalendarData(4, start),
        extractCalendarData(5, start),
        extractCalendarData(6, start),
        extractCalendarData(7, start),
        extractCalendarData(8, start),
        extractCalendarData(9, start),
        extractCalendarData(10, start),
        extractCalendarData(11, start),
        extractCalendarData(12, start),
    ])

    await writeFile(`tmp/${start}.json`, _.merge({}, ...data))
    await getData(start + 1, end)
}

getData(1300, 2500);
