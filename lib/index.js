#!/usr/bin/env node

const fs = require("fs");
const cli_parse = require(".\\cli-parse.js");
const MusicDownloader = require("music-dwnldr");

// credentials
if (!fs.existsSync(`${__dirname}\\..\\_credentials_.json`)) {
    fs.writeFileSync(`${__dirname}\\..\\_credentials_.json`, JSON.stringify({"clientId":".","clientSecret":"."}));
}
var credentials = require(`${__dirname}\\..\\_credentials_.json`);
var downloader;

// set app credentials
var set = (argv) => {
    if (argv.clientId) {
        credentials.clientId = argv.clientId;
        console.log("Successfully set clientId");
    }
    if (argv.clientSecret) {
        credentials.clientSecret = argv.clientSecret;
        console.log("Successfully set clientSecret");
    }
    fs.writeFileSync(`${__dirname}\\..\\_credentials_.json`, JSON.stringify(credentials));
}

// queue
var downloaded = 0;
var length = 0;
var queue = [];
var downloadQueue = () => {
    if (!queue[0]) return;
    downloader.downloadFromUrl(queue[0])
    .then((data) => {
        downloaded++;
        console.log(`${data} [${downloaded}/${length}]`);
        downloadQueue();
    }, (err) => {
        console.error(err);
    });
    queue.shift();
}

// download types
var types = {
    "track": (url) => {
        downloader.downloadFromUrl(url)
        .then((data) => {
            console.log(data);
        }, (err) => {
            console.error(err);
        });
    },
    "playlist": (url) => {
        let split = url.split("/");
        downloader.spotify.getPlaylist(split[4]).then((data) => {
            data.body.tracks.items.forEach(item => {
                queue.push(item.track.external_urls.spotify);
            });
            length = queue.length;
            console.log(queue, length);
            downloadQueue();
        });
    },
    "album": (url) => {
        let split = url.split("/");
        downloader.spotify.getAlbum(split[4]).then((data) => {
            data.body.tracks.items.forEach(track => {
                queue.push(track.external_urls.spotify);
            });
            length = queue.length;
            console.log(queue, length);
            downloadQueue();
        });
    }
}

// cli parser
var parser = cli_parse();
parser.then((data) => {
    if (data.cmd === "download") {
        let query = data.argv.query
        let split = query.split("/");
        downloader = new MusicDownloader(credentials, process.cwd())
        .then((object) => {
            downloader = object;
            if (split[0] === "https:") {
                if (types[split[3]]) {
                    types[split[3]](query);
                }
            } else {
                downloader.downloadFromSearch(query)
                .then((data) => {
                    console.log(data);
                }, (err) => {
                    console.error(err);
                });
            }
        });
    }
    if (data.cmd === "set") {
        set(data.argv);
    }
});