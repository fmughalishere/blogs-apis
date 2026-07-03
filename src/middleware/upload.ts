import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image files are allowed"));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;