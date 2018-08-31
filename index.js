const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config();
const request = require("request");
require("isomorphic-fetch"); // or another library of choice.
var Dropbox = require("dropbox").Dropbox;
const fs = require("fs");
const dropboxV2Api = require("dropbox-v2-api");
const PSD = require("psd");
const tinify = require("tinify");
const pngToJpeg = require("png-to-jpeg");
const sharp = require("sharp");
const util = require("util");
const bodyParser = require("body-parser");
const debounce = require("lodash/debounce");
const {
  createFilename,
  generateImages,
  generateImagesFromName
} = require("./tinify");

const { DROPBOX_ACCESS_TOKEN, TINIFY_KEY, PORT } = process.env;

const DEBOUNCE = 1000;

//set credentials
// const dropbox = dropboxV2Api.authenticate({
//   client_id: process.env.APP_KEY,
//   client_secret: process.env.APP_SECRET,
//   redirect_uri: process.env.REDIRECT_URI
// });
// //generate and visit authorization sevice
// const authUrl = dropbox.generateAuthUrl();
// //after redirection, you should receive code
// dropbox.getToken(code, (err, result, response) => {
//   //you are authorized now!
//   console.log("you are authorized.");
// });

const dropbox = dropboxV2Api.authenticate({
  token: DROPBOX_ACCESS_TOKEN
});

tinify.key = TINIFY_KEY;

let currentCursor = null;

let downloadImg = (filePath, name) => {
  let PNGName = createFilename(name, "0", "png");
  let JPGName = createFilename(name, "0", "jpg");

  dropbox(
    {
      resource: "files/download",
      parameters: {
        path: filePath
      }
    },
    (err, result, response) => {
      console.log("\033[1;32m", `downloaded ${name}.`, "\033[0m");
    }
  )
    .pipe(fs.createWriteStream(name))
    .on("finish", () => {
      console.log("converting to png...");
      var start = new Date();
      PSD.open(name)
        .then(function(psd) {
          return psd.image.saveAsPng(PNGName);
        })
        .then(() => {
          console.log(
            "\033[1;34m",
            "Finished png in " + (new Date() - start) + "ms",
            "\033[0m"
          );
          console.log("\033[1;32m", "generating pngs...", "\033[0m");
          generateImagesFromName(PNGName, name, "png");

          let buffer = fs.readFileSync(PNGName);
          return pngToJpeg({ quality: 90 })(buffer);
        })
        .then(output => {
          console.log("\033[1;32m", "generating jpegs...", "\033[0m");
          generateImages(output, name, "jpg");
        });
    });
};

let getMetadata = path =>
  dropbox(
    {
      resource: "files/get_metadata",
      parameters: {
        path,
        include_media_info: true
      }
    },
    (err, result, response) => {
      if (err) {
        return console.log("err:", err);
      }
      console.log("metadata:");
      console.log(result);
    }
  );

let next = debounce(
  cursor =>
    dropbox(
      {
        resource: "files/list_folder/continue",
        parameters: {
          cursor
        }
      },
      (err, result) => {
        currentCursor = result.cursor;

        result.entries.map(entry => {
          let { path_lower, name } = entry;
          let tag = entry[".tag"];
          if (tag === "file") {
            downloadImg(path_lower, name);
          } else if (tag === "deleted") {
            console.log(`${path_lower} was deleted on Dropbox.`);
          } else {
            console.log(`Could not handle change to ${path_lower}.`);
          }
        });
      }
    ),
  DEBOUNCE
);

let listFilesAndPollForChanges = () =>
  dropbox(
    {
      resource: "files/list_folder",
      parameters: {
        path: "/images",
        recursive: true,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        include_mounted_folders: true
      }
    },
    (err, result) => {
      console.log("\033[0;31m", "===FILES CURRENTLY IN DROPBOX===", "\033[0m");
      result.entries.map(file => console.log(file.name));
      poll(result.cursor);
    }
  );

let poll = debounce(
  cursor =>
    dropbox(
      {
        resource: "files/list_folder/longpoll",
        parameters: {
          cursor: cursor,
          timeout: 30
        }
      },
      (err, result) => {
        if (err) {
          return console.log(err);
        }
        if (result.changes) {
          next(cursor);
        }
      }
    ),
  DEBOUNCE
);

let getInfo = account_id =>
  dropbox(
    {
      resource: "users/get_account",
      parameters: {
        account_id
      }
    },
    (err, result) => {
      console.log(result);
    }
  );

app.use(bodyParser.json());

app.get("/webhook", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "X-Content-Type-Options": "nosniff"
  });
  console.log("received challenge");
  res.end(req.query.challenge);
});

app.post("/webhook", (req, res) => {
  console.log("received post request from dropbox");
  const { accounts } = req.body.list_folder;

  var compressionsThisMonth = tinify.compressionCount;
  console.log(`compressions this month ${compressionsThisMonth}`);

  if (currentCursor) {
    poll(currentCursor);
  } else {
    listFilesAndPollForChanges();
  }
});

app.listen(PORT, err => {
  if (err) {
    return console.log("something bad happened");
  }
  console.log(`listening on port ${PORT}`);
});
