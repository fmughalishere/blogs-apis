import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import cloudinary from "../config/cloudinary";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const uploadFromBuffer = (): Promise<any> =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "blog_covers" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(req.file!.buffer);
    });

  try {
    const result = await uploadFromBuffer();
    res.json({ url: result.secure_url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Image upload failed" });
  }
});