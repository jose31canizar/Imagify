const path = require("path");
const tinify = require("tinify");
const fs = require("fs");

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_PATH
} = process.env;

const createFilename = (name, suffix, ext) =>
  `${path.parse(name).name}-${suffix}.${ext}`;

const generateImagesFromName = (fname, name, ext) => {
  [150, 650, 1200].map((size, i) =>
    tinify
      .fromFile(fname)
      .resize({
        method: "fit",
        width: size,
        height: size
      })
      .toBuffer(function(err, resultData) {
        if (err) throw err;
        let n = createFilename(name, `${i + 1}`, ext);
        fs.writeFile(n, resultData, err => {
          if (!err) console.log(`finished ${n}`);
        });
      })
  );
};

const generateImages = (output, name, ext) => {
  [150, 650, 1200].map(
    (size, i) =>
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
            if (!err) console.log(`finished ${n}`);
          });
        })
    // .store({
    //   service: "s3",
    //   aws_access_key_id: AWS_ACCESS_KEY_ID,
    //   aws_secret_access_key: AWS_SECRET_ACCESS_KEY,
    //   region: AWS_REGION,
    //   path: AWS_PATH
    // })
  );
};

module.exports = {
  createFilename,
  generateImages,
  generateImagesFromName
};
