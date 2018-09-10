# Imagify
A tool for converting designer files in Dropbox, specifically psd, tiff, png, and jpg files, into compressed and resized jpgs and pngs for websites. Image metadata is stored on firebase and the final compressed images are stored on an S3 bucket.

From S3, the links to each image can be used through CDN.

## Usage

  1. Create a Dropbox app
  2. Get an access token from Tinify
  3. Create a Firebase database
  4. Create an S3 Bucket
  5.
  ```
  yarn start
  ```
  6. Upload files in Dropbox and see the compressed images in S3.


## Setup

  1. Install Tool
    ```git clone https://github.com/jose31canizar/Imagify.git```

  2. Install Dependencies

  ### CentOS
  ```
  yum install GraphicsMagick
  yum install ImageMagick
  yum install perl-Image-ExifTool
  ```

  ### MacOSX
  ```
  brew install graphicsmagick
  brew install imagemagick
  brew install exiftool
  ```

  ```
  yarn install
  ```

  3. Write Credentials

  Create a .env file with appropriate parameters

  ```
  PORT
  DROPBOX_ACCESS_TOKEN
  TINIFY_KEY
  FIREBASE_API_KEY
  FIREBASE_AUTH_DOMAIN
  FIREBASE_DB_URL
  FIREBASE_PROJECT_ID
  FIREBASE_STORAGE_BUCKET
  FIREBASE_SENDER_ID
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_REGION
  AWS_PATH
  ```

## Cost

  ###TinyPNG
  I use TinyPNG to convert and compress the uploaded image into 6 different versions of itself for web shops.
  ```
  First 500 Free,
  Next 9 500 image compressions$0.009 per image,
  After 10 000 image compressions$0.002 per image
  ```

  ### AWS SQS
  The first million requests are free, after that it's
  ```
  $0.40 ($0.00000040 per request)
  ```