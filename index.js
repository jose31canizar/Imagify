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
const port = 9001;

const { DROPBOX_ACCESS_TOKEN, TINIFY_KEY } = process.env;

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

// use session ref to call API, i.e.:
// dropbox(
//   {
//     resource: "users/get_account",
//     parameters: {
//       account_id: "dbid:AAH4f99T0taONIb-OurWxbNQ6ywGRopQngc"
//     }
//   },
//   (err, result, response) => {
//     if (err) {
//       return console.log(err);
//     }
//     console.log(result);
//   }
// );

const createFilename = (name, suffix, ext) =>
  `${path.parse(name).name}-${suffix}.${ext}`;

let downloadImg = (filePath, name, cursor) => {
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
      console.log(`downloaded ${name}.`);
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
        .then(function(s) {
          console.log("s");
          console.log(s);
          // generateImages(output, name, "png");
          console.log("Finished png in " + (new Date() - start) + "ms");
          let buffer = fs.readFileSync(PNGName);
          return pngToJpeg({ quality: 90 })(buffer);
        })
        .then(output => {
          console.log("generating images...");
          generateImages(output, name, "jpg");
          poll(cursor);
        });
    });
};

const generateImages = (output, name, ext) => {
  [150, 650, 1200].map((size, i) =>
    tinify
      .fromBuffer(output)
      .resize({
        method: "fit",
        width: size,
        height: size
      })
      .toBuffer(function(err, resultData) {
        if (err) throw err;
        let n = createFilename(name, `${i + 1}`, ext);
        fs.writeFile(n, resultData, err => {
          if (!err) console.log(`finished ${i + 1} ${ext}`);
        });
      })
  );
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

let next = cursor =>
  dropbox(
    {
      resource: "files/list_folder/continue",
      parameters: {
        cursor
      }
    },
    (err, result) => {
      console.log("the change is:");
      console.log(result);
      let { path_lower, name } = result.entries[0];
      downloadImg(path_lower, name, cursor);
      getMetadata(path_lower);
    }
  );

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
    console.log("===FILES CURRENTLY IN DROPBOX===");
    result.entries.map(file => console.log(file.name));
    poll(result.cursor);
  }
);

let poll = cursor =>
  dropbox(
    {
      resource: "files/list_folder/longpoll",
      parameters: {
        cursor: cursor,
        timeout: 120
      }
    },
    (err, result) => {
      //see docs for `result` parameters
      console.log("poll");
      console.log(result);
      if (err) {
        return console.log(err);
      }
      if (result.changes) {
        next(cursor);
      }
    }
  );

// var dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });

// dbx
//   .usersGetCurrentAccount()
//   .then(function(response) {
//     console.log(response);
//   })
//   .catch(function(error) {
//     console.error(error);
//   });

// dbx
//   .filesListFolder({ path: "" })
//   .then(function(response) {
//     console.log(response);
//   })
//   .catch(function(error) {
//     console.log(error);
//   });

// app.get("/webhook", (req, res) => {
//   res.writeHead(200, {
//     "Content-Type": "text/plain",
//     "X-Content-Type-Options": "nosniff"
//   });
//   res.send(req.query.challenge);
// });

// app.post("/webhook", (req, res) => {
//   console.log("received post from dropbox");
// });

// dbx
//   .sharingGetSharedLinkFile({ url: result.sharedLink })
//   .then(function(data) {
//     fs.writeFile(data.name, data.fileBinary, "binary", function(err) {
//       if (err) {
//         throw err;
//       }
//       console.log("File: " + data.name + " saved.");
//     });
//   })
//   .catch(function(err) {
//     throw err;
//   });
// // Set the headers
// var headers = {
//   "User-Agent": "Super Agent/0.0.1",
//   "Content-Type": "application/x-www-form-urlencoded",
//   Authorization: `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
//   "Dropbox-API-Arg": { path: "jose_1_1200px.jpg" }
// };

// // Configure the request
// var options = {
//   url: "https://content.dropboxapi.com/2/files/download",
//   method: "POST",
//   headers: headers
// };

// // Start the request
// request(options, function(error, response, body) {
//   if (!error && response.statusCode == 200) {
//     // Print out the response body
//     console.log(body);
//   }
// });

app.listen(port, err => {
  if (err) {
    return console.log("something bad happened");
  }
  console.log(`listening on port ${port}`);
});
