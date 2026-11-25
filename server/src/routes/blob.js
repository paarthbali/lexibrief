import { Router } from "express";
import { handleUpload } from "@vercel/blob/client";

const router = Router();

// Browser uploads the PDF straight to Vercel Blob; this route only hands out the upload token.
router.post("/upload", async (req, res) => {
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!req.user) throw new Error("Sign in to upload.");
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    res.json(jsonResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
