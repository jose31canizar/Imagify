const express = require("express");
const path = require("path");
let easy = require("easy-sqs");
const socketIO = require("socket.io");
require("dotenv").config();
const app = express();
const io = require("socket.io")();

const { AWS_KEY, AWS_SECRET, AWS_REGION, PORT } = process.env;

const awsConfig = {
  accessKeyId: AWS_KEY,
  secretAccessKey: AWS_SECRET,
  region: AWS_REGION
};
const client = easy.createClient(awsConfig);

const url = "https://sqs.us-east-1.amazonaws.com/073510967830/Imagify";

let queueReader = client.createQueueReader(url);

queueReader.start();

io.on("connection", client => {
  console.log("client connected!");
  queueReader.on("message", function(message) {
    let body = JSON.parse(message.Body);
    if (body && body.Records && body.Records[0]) {
      let record = body.Records[0];
      let name = record.s3.object.key;
      console.log(name);
      io.emit("message", name);
    }
  });

  queueReader.on("error", function(err) {
    console.log("error", err);
  });
});

io.listen(9004);

// `https://s3.amazonaws.com/picapoint-imagify/${message.Records[0].s3.object.key}`

app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", function(req, res) {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, err => {
  if (err) {
    return console.log("something bad happened");
  }
  console.log(`listening on port ${PORT}`);
});
