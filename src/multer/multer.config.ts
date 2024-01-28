/* eslint-disable prettier/prettier */
import * as multer from 'multer';

export const multerConfig = {
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'uploads/');
    },
    filename: (req, file, callback) => {
      //   const [name, extension] = file.originalname.split('.');
      // const uniqueSuffix = Date.now() + '-';
      // callback(null, `${name}-${uniqueSuffix}.${extension}`);
      callback(null,file.originalname)
    },
  }),
};
