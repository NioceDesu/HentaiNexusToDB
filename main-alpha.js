const request = require('request-promise');
const sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('HentaiNexusDataBaseTEST.db');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const download = require('download');
const ProgressBar = require('progress');
const path = require('path');
//
var http = require('http');
var https = require('https');
http.globalAgent.maxSockets = 1;
https.globalAgent.maxSockets = 1;
//

var bar = new ProgressBar('Downloading [:bar] :current/:total-:percent -- Estimated Time: :eta/s', {
    total: 0,
    width: 40,
    complete: '=',
    incomplete: ' '
});
//
var inquirer = require('inquirer');
console.log('REEEEEEEEEE');

// 
/*inquirer.prompt(hentaiWebsites).then(answers => {
    const res = JSON.parse(JSON.stringify(answers));
    switch (res.mode) {
        case "HentaiNexus":
            inquirer.prompt(hentaiNexusOperations).then(answers2 => {
                const res2 = JSON.parse(JSON.stringify(answers2));
                switch (res2.option) {
                    case hentaiNexusOperations[0].choices[0]:
                        inquirer.prompt(databaseOperatioons).then(answers3 => {
                            const res3 = JSON.parse(JSON.stringify(answers3));
                            getData(parseInt(res3.pageStartingNumber));
                        });
                        break;
                    case hentaiNexusOperations[0].choices[2]:
                        inquirer.prompt(downloadOptions).then(answers3 => {
                            const res3 = JSON.parse(JSON.stringify(answers3));
                            let query = 'SELECT * FROM Hentai WHERE ';
                            inquirer.prompt(downloadingValue).then(answers4 => {
                                const res4 = JSON.parse(JSON.stringify(answers4));
                                const inputValue = res4.inputValue;
                                //
                                switch (res3.downloadMode) {
                                    case downloadOptions[0].choices[0]:
                                        query += "Title LIKE '%" + inputValue + "%'";
                                        break;
                                    case downloadOptions[0].choices[1]:
                                        query += "id = " + inputValue;
                                        break;
                                    case downloadOptions[0].choices[2]:
                                        query += "Tags LIKE '%" + inputValue + "%'";
                                        break;
                                    case downloadOptions[0].choices[3]:
                                        query += "Artist LIKE '" + inputValue + "'";
                                        break;
                                    case downloadOptions[0].choices[4]:
                                        query += "Magazine LIKE '%" + inputValue + "%'";
                                        break;
                                }
                                //
                                let downloadPos = 1;
                                inquirer.prompt(downloadStartingPoint).then(answers5 => {
                                    downloadPos = parseInt((JSON.parse(JSON.stringify(answers5))).downloadStartingNumber);
                                    getHentaiUrl(query, downloadPos);
                                    // console.log(downloadPos);
                                });
                                // console.log(query);
                            });
                        });
                        break;
                    case hentaiNexusOperations[0].choices[1]:
                        saveThumb();
                        break;
                }
            });
            break;
        case "HentaiCafe":
            inquirer.prompt(hentaiCafeURLdownload).then(value => {
                let urlInput = JSON.parse(JSON.stringify(value));
                urlInput = urlInput.HCdownloadURL;
                //
                let downloadPos = 1;
                inquirer.prompt(downloadStartingPoint).then(posValue => {
                    downloadPos = parseInt((JSON.parse(JSON.stringify(posValue))).downloadStartingNumber);
                    // 
                    hentaiCafe(urlInput, downloadPos);
                });
            });
            break;
        case 'Nhentai':
            inquirer.prompt(nhentaiDownloadMod).then(value => {
                let downlMode = JSON.parse(JSON.stringify(value));
                downlMode = downlMode.nhentaiMode;
                // 
                let nhentaiRequestUrl = '';
                // 
                inquirer.prompt(downloadingValue).then(inputVal => {
                    let downlValue = JSON.parse(JSON.stringify(inputVal));
                    downlValue = downlValue.inputValue;
                    //     
                    switch (downlMode) {
                        case 'Url':
                            nhentaiRequestUrl = downlValue;
                            break;
                        case 'Code':
                            nhentaiRequestUrl = 'https://nhentai.net/g/' + downlValue + '/';
                            break;
                    }
                    // 
                    inquirer.prompt(downloadStartingPoint).then(async posValue => {
                        downloadPos = parseInt((JSON.parse(JSON.stringify(posValue))).downloadStartingNumber);
                        // 
                        const hentaiData = await nhentaiScrapData(nhentaiRequestUrl, downloadPos);
                        nhentaiDownloader(hentaiData);
                    });

                });
            });
    }
});*/
//Save in database

//download selected hentai to local machine
function getHentaiUrl(query, startPos) {
    console.log([query, startPos]);
    db.all(query, [], (err, row) => {
        console.log('Slm');
        const integerStartPos = startPos;
        row.forEach(async element => {
            // if (element.id == val) {
            let ReadingUrl = urlString + '/read/' + element.id + '/';
            //
            startPos = startPos.toString();
            if (startPos.length == 1)
                startPos = '00' + startPos;
            else if (startPos.length == 2)
                startPos = '0' + startPos;
            console.log([query, startPos]);
            // 
            let resultObject = {
                PageUrl: (ReadingUrl + startPos),
                NextPageNumber: startPos
            };
            console.log(resultObject);
            // console.log("Your download should start any time soon !");
            var bar = new ProgressBar('Downloading [:bar] :current/:total-:percent -- Estimated Time: :eta/s', {
                total: element.Pages,
                width: 40,
                complete: '=',
                incomplete: ' ',
                clear: true,
                curr: integerStartPos - 1
            });
            // console.log(resultObject);
            while (!isNaN(resultObject.NextPageNumber)) {
                let nextNumber = await getSelectedPageImage(resultObject, element.Title, element.id);
                // console.log(nextNumber);
                nextNumber = nextNumber.split("/read/" + element.id + "/").pop();
                resultObject.PageUrl = ReadingUrl + nextNumber;
                resultObject.NextPageNumber = nextNumber;
                //
                bar.tick();
            }
            // }
        });
    });
}
async function getSelectedPageImage(oldObject, hentaiName, id) {
    try {
        let body = await request(oldObject.PageUrl);

        let $ = cheerio.load(body);
        //
        const thisImageUrl = $('#currImage').attr('src');
        const nextPageUrl = $('#nextLink').attr('href');
        //
        hentaiName = hentaiName.replace(/:/g, ' ').replace('?', ' ').replace('?', ' ');
        const path = __dirname + "/hen/" + hentaiName + '/Chapter';
        //
        await fs.ensureDir(path, {
            options: 0o2775
        });
        const fileName = thisImageUrl.split(id + '/').pop();
        //
        await download(thisImageUrl).then(data => {
            fs.writeFileSync(path + '/' + fileName, data);
        });
        //
        return nextPageUrl;
    } catch (err) {
        // console.log('A network problem for sure! Retry later');
        console.log(err);
    }
}
//DOWNLOAD FROM HENTAI.CAFE
async function hentaiCafe(url, pos) {
    let currentIndex = pos;
    let endingEndex = pos;
    // 
    let body = await request(url);
    var $ = cheerio.load(body);
    let hentaiName = "";
    $('.x-column.x-sm.x-1-2.last').each((y, element) => {
        for (let i = 0; i < element.children.length; i++) {
            const currentChild = element.children[i];
            if (currentChild.type == 'tag') {
                // console.log(i);
                if (currentChild.name == 'h3') {
                    hentaiName = currentChild.children[0].data;
                }
            }
        }
    });
    var initialReadingPage = $('.x-btn.x-btn-flat.x-btn-rounded.x-btn-large')[0].attribs.href + "page/";
    var readingPage = initialReadingPage + currentIndex;
    // 
    if (currentIndex == endingEndex) {
        let body = await request(readingPage);
        var $ = cheerio.load(body);
        // 
        endingEndex = $('.dropdown')[0].children.length;
        // 
        var bar = new ProgressBar('Downloading [:bar] :current/:total-:percent -- Estimated Time: :eta/s', {
            total: endingEndex,
            width: 40,
            complete: '=',
            incomplete: ' ',
            clear: true,
            curr: currentIndex - 1
        });
        // 
        let directImageLink = $('.open')[0].attribs["data-cfsrc"];
        getFullPage(directImageLink, hentaiName, bar);
        currentIndex++;
        // 
        directImageLink = directImageLink.substr(0, directImageLink.lastIndexOf('/') + 1);
        // console.log(directImageLink);
        // 
        let zeros = "";
        switch (endingEndex.toString().length) {
            case 1:
            case 2:
                zeros = "0";
                break;
            case 3:
                zeros = "00";
                break;
        }
        while (currentIndex <= endingEndex) {
            // console.log(directImageLink + zeros + ".jpg");
            if (currentIndex.toString().length == endingEndex.toString().length)
                zeros = '';
            else if (endingEndex.toString().length == 3)
                if (currentIndex.toString().length == 2)
                    zeros = '0';
            getFullPage(directImageLink + zeros + currentIndex + ".jpg", hentaiName, bar);
            currentIndex++;
        }
    }
}
// 
async function getFullPage(url, hentaiName, bar) {
    // console.table([url, hentaiName]);
    try {
        // let body = await request(url);
        // var $ = cheerio.load(body);
        // 
        hentaiName = hentaiName.replace(/:/g, ' ').replace('?', ' ').replace('?', ' ');
        const path = __dirname + "/hen/" + hentaiName + '/Chapter';
        await fs.ensureDir(path, {
            options: 0o2775
        });
        const fileName = url.substr(url.lastIndexOf('/') + 1, url.length);
        //
        // console.log(fileName + " | " + hentaiName);
        // console.log(path + '/' + fileName);
        await download(url).then(data => {
            fs.writeFileSync(path + '/' + fileName, data);
        });
        bar.tick();

    } catch (err) {
        console.error(err);
    }

}
// Download from Nhentai
async function nhentaiScrapData(url, pos) {
    let body = await request(url);
    var $ = cheerio.load(body);
    // 
    let hentaiData = {
        Name: null,
        Pages: null,
        Index: pos,
        HentaiCode: null,
        GalleryCode: null
    };
    hentaiData.HentaiCode = url.split('/')[4];
    hentaiData.Pages = $('.gallerythumb').length;
    hentaiData.Name = $('title')[0].firstChild.data.split('»')[0];
    hentaiData.GalleryCode = $('.gallerythumb')[0].firstChild.next.attribs['data-src'].split('/')[4];
    // 
    return hentaiData;
}
async function nhentaiDownloader(data) {
    var bar = new ProgressBar('Downloading [:bar] :current/:total-:percent -- Estimated Time: :eta/s', {
        total: data.Pages,
        width: 40,
        complete: '=',
        incomplete: ' ',
        clear: true,
        curr: data.Index - 1
    });
    data.Name = data.Name.replace(/:/g, ' ').replace('?', ' ').replace('?', ' ').replace('|', ' ');
    console.log(data.Name);
    const path = __dirname + "/hen/" + data.Name + '/Chapter';
    await fs.ensureDir(path, {
        options: 0o2775
    });
    while (data.Index <= data.Pages) {
        try {
            const fileName = data.Index + ".jpg";
            //

            let url = 'https://i.nhentai.net/galleries/' + data.GalleryCode + '/' + data.Index + '.jpg';
            await download(url).then(dataStream => {
                fs.writeFileSync(path + '/' + fileName, dataStream);
            });
            bar.tick();

        } catch (err) {
            console.error(err);
        }
        data.Index++;
    }
}
// Get thumbnails
async function saveThumb() {
    const query = 'SELECT id,Cover FROM Hentai ORDER BY id ASC';
    const outputPath = path.join(__dirname, 'thumbs');
    const outputFolder = await fs.readdir(outputPath);

    db.all(query, [], (err, row) => {
        row.forEach(async element => {
            let exist = false;
            outputFolder.forEach(file => {
                if (element.id == file.split('.')[0]) {
                    exist = true;
                }
            });
            if (!exist) {
                try {
                    await download(element.Cover).then(dataStream => {
                        fs.writeFileSync(path.join(outputPath, element.id + ".jpg"), dataStream);
                    });
                } catch (err) {
                    console.error(err);
                } finally {
                    console.log(element.id + ' | operation finished!');
                }
            }
        });
    });
}

// 
//REWORKING 
// 
// 
const MenuItems = {
    'SelectWebSite': [{
        type: 'list',
        name: 'website',
        message: 'What website would you like to operate on ?',
        choices: ['HentaiNexus', 'HentaiCafe', 'Nhentai']
    }],
    'MenuSubItems': [{
        type: 'list',
        name: 'option',
        message: 'What would you like to do?',
        choices: ['Scrap data as an SQLite DB', 'Get thumbnails', 'Download hentai']
    }],
    'DownloadOptions': [{
        type: 'list',
        name: 'downloadMode',
        message: "Please choose a downloading option :",
        choices: ['By Id', 'By artist', 'By magazin', 'By Url']
    }],
    'RequestValue': [{
        type: 'input',
        name: 'inputValue',
        message: 'Please insert the required value :'
    }],
    'StaringPage': [{
        type: 'input',
        name: 'inputPos',
        message: 'What page would you like to start from ?',
        default: '1'
    }]
}
const SupportedWebsites = ['https://hentainexus.com', 'https://nhentai.net'];
// 
// MAIN MENU
inquirer.prompt(MenuItems.SelectWebSite).then(result => {
    const websites = MenuItems.SelectWebSite[0].choices;
    const website = result.website;
    //If WBSITE IS NOT HENTAI.CAFE
    if (website != websites[1]) {
        inquirer.prompt(MenuItems.MenuSubItems).then(result2 => {
            const options = MenuItems.MenuSubItems[0].choices;
            const option = result2.option;
            switch (option) {
                case options[0]:
                    createDbTable(website);
                    switch (website) {
                        case websites[0]:
                            console.log('HN');
                            getWebsiteData(1, website, websites);
                            break;
                        case websites[2]:
                            console.log('NH');
                            getWebsiteData(1, website, websites);
                            break;
                    }
                    break;
                case options[1]:
                    console.log('THUMB');
                    break;
                case options[2]:
                    console.log('DOWN');
                    break;
            }
        });
    } else {
        console.log('in');
    }
});
// 
async function getWebsiteData(currentPage, website, websites) {
    let requestUrl = "";
    switch (website) {
        case websites[0]:
            requestUrl = SupportedWebsites[0] + "/page/" + currentPage;
            break;
        case websites[2]:
            requestUrl = SupportedWebsites[1] + "?page=" + currentPage;
            break;
    }
    const options = {
        method: 'GET',
        url: requestUrl,
        json: true,
        headers: {
            'Connection': 'keep-alive'
        }
    };
    // 
    recoverInfos(options, currentPage, website);
}

function createDbTable(Name) {
    db.serialize(function () {
        db.run("CREATE TABLE IF NOT EXISTS " + Name + " (id INTEGER PRIMARY KEY,Title Text,Artist Text,Language Text,Magazine Text,Circle Text,Event Text,Parody Text,Publisher Text,Pages Integer,Tags Text,Description Text,FirstPage Text,Cover Text)");
    });
}

async function recoverInfos(options, currentPage, website) {
    try {
        const body = await request(options);
        var $ = cheerio.load(body);
        let pagesNumber = 1
        if (website == 'HentaiNexus')
            pagesNumber = $('.pagination-list')[0].lastChild.prev.next.firstChild.firstChild.data;
        else if (website == 'Nhentai')
            pagesNumber = $('.last')[0].attribs.href.split('=').pop();


        bar.total = pagesNumber;
        bar.curr = currentPage - 1;
        // 
        if (currentPage <= pagesNumber) {
            fs.appendFile("logs.txt", "---------------------" + "\r\n" + "---------------------" + "\r\n");
            $('.column.is-one-fifth-fullhd.is-one-quarter-widescreen.is-one-quarter-desktop.is-one-third-tablet.is-half-mobile').each(async (i, Element) => {
                let hentaiFullData = {
                    Id: null,
                    Title: null,
                    Artist: null,
                    Language: null,
                    Magazine: null,
                    Circle: null,
                    Event: null,
                    Parody: null,
                    Publisher: null,
                    Pages: null,
                    Tags: null,
                    Description: null,
                    FirstPage: null,
                    Cover: null
                };
                //
                const hentaiUrl = Element.firstChild.next.attribs.href;
                hentaiFullData.Id = hentaiUrl.split("/view/").pop();
                hentaiFullData.Title = Element.firstChild.next.firstChild.firstChild.next.attribs.title;
                hentaiFullData.Cover = Element.firstChild.next.firstChild.lastChild.prev.firstChild.next.firstChild.next.attribs.src;
                //
                //
                var options = {
                    method: 'GET',
                    url: urlString + hentaiUrl,
                    json: true,
                    headers: {
                        'Connection': 'keep-alive'
                    }
                };
                //
                try {
                    const body = await request(options);

                    const jquery = cheerio.load(body);
                    //
                    jquery('.viewcolumn').each((i, elem) => {
                        const row = elem.next.nextSibling;
                        switch (elem.firstChild.data) {
                            case 'Magazine':
                            case 'Circle':
                            case 'Event':
                            case 'Language':
                            case 'Parody':
                            case 'Publisher':
                            case 'Artist':
                                hentaiFullData[elem.firstChild.data] = row.firstChild.next.firstChild.data;
                                break;
                            case 'Description':
                            case 'Pages':
                                hentaiFullData[elem.firstChild.data] = row.firstChild.data.trim();
                                break;
                            case 'Tags':
                                let tags = "";
                                row.children.forEach(tag => {
                                    if (tag.type == "tag")
                                        tags += tag.children[1].firstChild.data.trim() + ",";
                                });
                                tags = tags.slice(0, -1);
                                hentaiFullData[elem.firstChild.data] = tags;
                                break;
                        }
                    });
                    jquery('.column.is-2-fullhd.is-one-fifth-widescreen.is-one-fifth-desktop.is-one-quarter-tablet').each((i, elem) => {
                        hentaiFullData.FirstPage = elem.firstChild.next.attribs.href;
                    });
                    // 
                    fs.appendFile("logs.txt", "[Index : " + i + " - Page : " + currentPage + "] == " + "LOG : " + hentaiFullData.Id + " ~~ " + hentaiFullData.Title + "\r\n");
                    // 
                    hentaiFullData = Object.values(hentaiFullData);
                    //
                    if (currentPage == 127) {
                        if (i > 5) {
                            db.serialize(() => {
                                const dbProcces = db.prepare("INSERT INTO Hentai VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
                                dbProcces.run(hentaiFullData);
                                dbProcces.finalize();
                            });
                        }
                    } else {
                        db.serialize(() => {
                            const dbProcces = db.prepare("INSERT INTO Hentai VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
                            dbProcces.run(hentaiFullData);
                            dbProcces.finalize();
                        });

                    }
                } catch (err) {
                    // console.log('A network problem for sure! Retry later');
                    console.log(err);
                }
            });
            bar.tick();
            getData(currentPage + 1);
        } else
            db.close();

    } catch (err) {
        console.log('A network problem for sure! Retry later');
    }
}