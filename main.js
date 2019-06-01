const request = require('request-promise');
const sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('HentaiNexusDataBase.db');
const fs = require('fs-extra');
const cheerio = require('cheerio');
var util = require('util');
//
var http = require('http');
var https = require('https');
http.globalAgent.maxSockets = 2;
https.globalAgent.maxSockets = 2;
//
const urlString = "https://hentainexus.com";
//
var str = "/view/5700";
str.search()
// console.log(str.split("/view/").pop());
//
getData(1);
//
async function getData(currentPage) {
    db.serialize(function () {
        db.run("CREATE TABLE IF NOT EXISTS Hentai (id INTEGER PRIMARY KEY,Title Text,Artist Text,Language Text,Magazin Text,Circle Text,Event Text,Parody Text,Publisher Text,Pages Integer,Tags Text,Description Text,FirstPage Text,Cover Text)");
    });
    //
    const URL = urlString + "/page/" + currentPage;
    var options = {
        method: 'GET',
        url: URL,
        json: true,
        headers: {
            'Connection': 'keep-alive'
        }
    };
    const body = await request(options);
    var $ = cheerio.load(body);
    let articlesNumber = $('.column.is-one-fifth-fullhd.is-one-quarter-widescreen.is-one-quarter-desktop.is-one-third-tablet.is-half-mobile').length;
    const pagesNumber = $('.pagination-list')[0].lastChild.prev.next.firstChild.firstChild.data;
    console.log(currentPage + "|" + pagesNumber);
    recoverInfos($, currentPage, pagesNumber);
}

function recoverInfos($, currentPage, pagesNumber) {
    // if(currentPage==1)
    fs.appendFile("logs.txt", "---------------------" + "\r\n" + "---------------------" + "\r\n");
    $('.column.is-one-fifth-fullhd.is-one-quarter-widescreen.is-one-quarter-desktop.is-one-third-tablet.is-half-mobile').each(async (i, Element) => {
        // if (i==1 && currentPage == 1) {
            //
            let hentaiFullData = {
                Id: null,
                Title: null,
                Artist: null,
                Language: null,
                Magazin: null,
                Circle: null,
                Event: null,
                Parody: null,
                Publisher: null,
                Pages: null,
                Tags: null,
                Description: null,
                FirstPage : null,
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
            const body = await request(options);
            const jquery = cheerio.load(body);
            //
            jquery('.viewcolumn').each((i, elem) => {
                const row = elem.next.nextSibling;
                switch (elem.firstChild.data) {
                    case 'Magazin':
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
            jquery('.column.is-2-fullhd.is-one-fifth-widescreen.is-one-fifth-desktop.is-one-quarter-tablet').each((i,elem) => {
                hentaiFullData.FirstPage = elem.firstChild.next.attribs.href;
            });
            hentaiFullData = Object.values(hentaiFullData);
            //
            fs.appendFile("logs.txt", i + "-" + currentPage + "-" + pagesNumber + "|" + "LOG : " + hentaiFullData + "\r\n");
            //
            db.serialize(() => {
                const dbProcces = db.prepare("INSERT INTO Hentai VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
                dbProcces.run(hentaiFullData);
                dbProcces.finalize();
            });
        // }
    });
    //
    if (pagesNumber >= currentPage)
        getData(currentPage + 1);
    else
        db.close();
}