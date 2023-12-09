const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');
const { writeFileSync } = require('fs');

async function getHtmlFrom(day, month, year) {
    return axios.get(
        `https://www.informatik.uni-leipzig.de/~duc/amlich/PHP/index.php?dd=${day}&mm=${month}&yy=${year}`
    );
}

async function extractCalendarData(month, year) {
    return new Promise(async resolve => {
        try {
            const response = await getHtmlFrom(1, month, year)
            const html = response.data;
            const $ = cheerio.load(html);
            const calendar = {};
            $('table.thang > tbody > tr.normal').get().forEach(week => {
                $(week).children('td').get().forEach(item => {
                    const sonar = $(item).find('div').not('.am').not('.am2').text().trim();
                    const lunar = $(item).find('div.am').text()
                        || $(item).find('div.am2').text();

                    if (!!sonar) {
                        calendar[`${clearNum(sonar)}/${month}`] = lunar;
                    }
                })
            })
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
    return (raw.match(/\d+/g))[0];
}

async function writeFile(path, data) {
    try {
        writeFileSync(path, JSON.stringify(data, null, 4), 'utf8');
    } catch (e) {
        console.log(e)
        throw e;
    }
}


async function getData(year) {
    if (year >= 2500) {
        return;
    }
    const data = await Promise.all([
        extractCalendarData(1, year),
        extractCalendarData(2, year),
        extractCalendarData(3, year),
        extractCalendarData(4, year),
        extractCalendarData(5, year),
        extractCalendarData(6, year),
        extractCalendarData(7, year),
        extractCalendarData(8, year),
        extractCalendarData(9, year),
        extractCalendarData(10, year),
        extractCalendarData(11, year),
        extractCalendarData(12, year),
    ])

    await writeFile(`data/${year}.json`, _.merge({}, ...data))
    getData(year + 1)
}

getData(1300);
