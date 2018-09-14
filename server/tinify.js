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
  console.log("\033[1;34m", `generating ${ext}s...`, "\033[0m");
  [150, 650, 1200].map((size, i) =>
    tinify
      .fromFile(fname)
      .resize({
        method: "fit",
        width: size,
        height: size
      })
      .store({
        service: "s3",
        aws_access_key_id: AWS_ACCESS_KEY_ID,
        aws_secret_access_key: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION,
        path: `${AWS_PATH}/${createFilename(name, `${i + 1}`, ext)}`
      })
      .meta()
      .then(uploads => {
        console.log(
          "\033[1;36m",
          `${uploads.location} is available on S3.`,
          "\033[0m"
        );
      })
  );
};

const generateImages = (output, name, ext) => {
  console.log("\033[1;34m", `generating ${ext}s...`, "\033[0m");
  [150, 650, 1200].map(
    (size, i) =>
      tinify
        .fromBuffer(output)
        .resize({
          method: "fit",
          width: size,
          height: size
        })
        .store({
          service: "s3",
          aws_access_key_id: AWS_ACCESS_KEY_ID,
          aws_secret_access_key: AWS_SECRET_ACCESS_KEY,
          region: AWS_REGION,
          path: `${AWS_PATH}/${createFilename(name, `${i + 1}`, ext)}`
        })
        .meta()
        .then(uploads => {
          console.log(
            "\033[1;36m",
            `${uploads.location} is available on S3.`,
            "\033[0m"
          );
        })

    // .toBuffer(function(err, resultData) {
    //   if (err) throw err;
    //   let n = createFilename(name, `${i + 1}`, ext);
    //   fs.writeFile(n, resultData, err => {
    //     if (!err) console.log("\033[1;32m", `finished ${n}`, "\033[0m");
    //   });
    // })
  );
};

module.exports = {
  createFilename,
  generateImages,
  generateImagesFromName
};
