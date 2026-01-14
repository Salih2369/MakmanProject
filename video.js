const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const auth = require("../middleware/auth");

const router = express.Router();

// Ensure directories exist
const uploadDir = path.join(__dirname, "../uploads");
const processedDir = path.join(__dirname, "../uploads/processed");
const aiDir = path.join(__dirname, "../ai");

[uploadDir, processedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Job tracking (in-memory - use Redis for production)
const jobs = new Map();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `video-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for videos
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|mov|avi|mkv|webm/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);
        cb(new Error("فقط ملفات الفيديو (mp4, mov, avi, mkv, webm) مسموح بها!"));
    },
});

/**
 * Run Python video analyzer
 */
function runAnalyzer(inputPath, jobId) {
    const outputVideo = path.join(processedDir, `processed-${jobId}.mp4`);
    const outputJson = path.join(processedDir, `results-${jobId}.json`);
    const pythonScript = path.join(aiDir, "video_analyzer.py");

    const job = jobs.get(jobId);
    if (!job) return;

    job.status = "processing";
    job.message = "جاري تحميل نموذج الذكاء الاصطناعي...";

    // Spawn Python process (use 'py' on Windows, 'python3' on Linux/Mac)
    const pythonCmd = process.platform === "win32" ? "py" : "python3";
    console.log(`[AI] Starting Python analyzer: ${pythonCmd} ${pythonScript}`);
    console.log(`[AI] Input: ${inputPath}`);

    const pythonProcess = spawn(pythonCmd, [
        pythonScript,
        "--input", inputPath,
        "--output-video", outputVideo,
        "--output-json", outputJson,
        "--max-duration", "30"  // Limit to 30 seconds for faster processing
    ]);

    let lastProgress = 0;

    pythonProcess.stdout.on("data", (data) => {
        const lines = data.toString().split("\n").filter(l => l.trim());
        for (const line of lines) {
            try {
                const update = JSON.parse(line);
                if (update.progress) {
                    lastProgress = update.progress;
                    job.progress = update.progress;
                    job.message = `جاري تحليل الفيديو... ${update.progress}%`;
                }
                if (update.status === "starting") {
                    job.message = update.message || "جاري التحضير...";
                }
                if (update.status === "complete") {
                    job.status = "complete";
                    job.progress = 100;
                    job.message = "اكتمل التحليل بنجاح!";
                    job.results = update.results;
                    job.outputVideo = `/uploads/processed/processed-${jobId}.mp4`;
                }
            } catch (e) {
                // Non-JSON output, ignore
            }
        }
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on("close", (code) => {
        if (code !== 0 && job.status !== "complete") {
            job.status = "error";
            job.message = "حدث خطأ أثناء تحليل الفيديو";
            job.error = `Process exited with code ${code}`;
        } else if (job.status === "processing") {
            // Check if JSON results exist
            if (fs.existsSync(outputJson)) {
                try {
                    const results = JSON.parse(fs.readFileSync(outputJson, "utf-8"));
                    job.status = "complete";
                    job.progress = 100;
                    job.message = "اكتمل التحليل بنجاح!";
                    job.results = results;
                    job.outputVideo = `/uploads/processed/processed-${jobId}.mp4`;
                } catch (e) {
                    job.status = "error";
                    job.message = "فشل قراءة نتائج التحليل";
                }
            }
        }
    });

    pythonProcess.on("error", (err) => {
        job.status = "error";
        job.message = "فشل تشغيل محلل الفيديو";
        job.error = err.message;
    });
}

/**
 * POST /api/video/upload
 * Upload video and start analysis
 */
router.post("/upload", auth, upload.single("video"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "الرجاء رفع ملف فيديو" });
        }

        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create job entry
        jobs.set(jobId, {
            id: jobId,
            status: "queued",
            progress: 0,
            message: "تم استلام الفيديو، جاري التحضير...",
            inputFile: req.file.filename,
            inputPath: req.file.path,
            createdAt: new Date().toISOString()
        });

        // Start analysis in background
        setImmediate(() => {
            runAnalyzer(req.file.path, jobId);
        });

        res.json({
            message: "تم رفع الفيديو بنجاح",
            jobId: jobId,
            file: {
                filename: req.file.filename,
                path: `/uploads/${req.file.filename}`,
            }
        });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: "فشل رفع الفيديو" });
    }
});

/**
 * GET /api/video/status/:jobId
 * Get job processing status
 */
router.get("/status/:jobId", auth, (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: "Job not found" });
    }

    res.json({
        id: job.id,
        status: job.status,
        progress: job.progress,
        message: job.message
    });
});

/**
 * GET /api/video/result/:jobId
 * Get job results (when complete)
 */
router.get("/result/:jobId", auth, (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "complete") {
        return res.status(400).json({
            error: "Job not complete",
            status: job.status,
            message: job.message
        });
    }

    res.json({
        id: job.id,
        status: job.status,
        outputVideo: job.outputVideo,
        results: job.results
    });
});

/**
 * DELETE /api/video/job/:jobId
 * Clean up job and files
 */
router.delete("/job/:jobId", auth, (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: "Job not found" });
    }

    // Clean up files
    try {
        if (job.inputPath && fs.existsSync(job.inputPath)) {
            fs.unlinkSync(job.inputPath);
        }
        const processedVideo = path.join(processedDir, `processed-${jobId}.mp4`);
        const resultsJson = path.join(processedDir, `results-${jobId}.json`);
        if (fs.existsSync(processedVideo)) fs.unlinkSync(processedVideo);
        if (fs.existsSync(resultsJson)) fs.unlinkSync(resultsJson);
    } catch (e) {
        console.error("Cleanup error:", e);
    }

    jobs.delete(jobId);
    res.json({ message: "Job deleted successfully" });
});

/**
 * GET /api/video/demo
 * Stream the specific demo video file
 */
router.get("/demo", (req, res) => {
    const videoPath = "C:\\Users\\assad\\Desktop\\CapstoneProject\\output_sos9 (16).mp4";

    if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: "فيديو العرض غير موجود" });
    }

    // Creating a read stream effectively handles range requests for video players
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
});

module.exports = router;
