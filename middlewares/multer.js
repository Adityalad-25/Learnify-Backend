// Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files. It is written on top of busboy for maximum efficiency.

import multer from 'multer';

const storage = multer.memoryStorage();

const singleUpload = multer({ storage }).single('file');

export default singleUpload;