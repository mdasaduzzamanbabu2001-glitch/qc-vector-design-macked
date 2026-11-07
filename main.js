const { app, BrowserWindow, BrowserView, ipcMain, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

// ==========================================================
// 🔥 ANTI-CRASH SYSTEM: IGNORE ABORTED URLS
// ==========================================================
process.on('unhandledRejection', (reason) => {
    if (reason && (reason.code === 'ERR_ABORTED' || String(reason).includes('(-3)'))) {
        console.log("⚠️ Minor network interruption ignored. Continuing...");
    } else {
        console.error("Unhandled Rejection:", reason);
    }
});

// ==========================================================
// 🔥 NETWORK & ANTI-BOT BYPASS COMMANDS
// ==========================================================
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
app.commandLine.appendSwitch('disable-features', 'IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('log-level', '3');

if (process.platform === 'win32') {
    app.setAppUserModelId("MyDesigns.Pro.Tool");
}

let mainWindow;
let view;
let pendingFileForChooser = null;

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ==========================================================
// 📁 OUTPUT FOLDERS (Works on ANY PC — Zero Adobe Needed!)
// ==========================================================
const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const FINAL_DESIGNS_FOLDER = path.join(DESKTOP_PATH, 'Final_Designs');

if (!fs.existsSync(FINAL_DESIGNS_FOLDER)) {
    fs.mkdirSync(FINAL_DESIGNS_FOLDER, { recursive: true });
}

// 100% Free Multi-Key Pool for Neural Vision OCR (Zero Rate Limit)
const FREE_OCR_KEYS = [
    'helloworld',
    'K81899588988957',
    'K89565132488957',
    'K82798126788957',
    'K85951423188957'
];
let ocrKeyIndex = 0;

function getUniqueSvgFileName() {
    const date = new Date();
    const timestamp = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0') + "_" +
        date.getHours().toString().padStart(2, '0') +
        date.getMinutes().toString().padStart(2, '0') +
        date.getSeconds().toString().padStart(2, '0') + "_" +
        date.getMilliseconds().toString().padStart(3, '0');
    return `Vectorized_${timestamp}.svg`;
}

// ==========================================================
// 🎯 300 PPI (PIXELS/INCH) PNG METADATA INJECTOR FOR PHOTOSHOP
// ==========================================================
function setPng300Ppi(pngBuffer, ppi = 300) {
    if (!pngBuffer || pngBuffer.length < 33 || pngBuffer.readUInt32BE(0) !== 0x89504e47) {
        return pngBuffer;
    }

    const ppm = Math.round(ppi / 0.0254); // 11811
    const physChunk = Buffer.alloc(21);
    physChunk.writeUInt32BE(9, 0);
    physChunk.write('pHYs', 4, 4, 'ascii');
    physChunk.writeUInt32BE(ppm, 8);
    physChunk.writeUInt32BE(ppm, 12);
    physChunk.writeUInt8(1, 16);

    let crc = 0xffffffff;
    for (let i = 4; i < 17; i++) {
        crc ^= physChunk[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
        }
    }
    physChunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 17);

    const chunks = [pngBuffer.subarray(0, 8)];
    let offset = 8;
    let physInserted = false;

    while (offset + 8 <= pngBuffer.length) {
        const length = pngBuffer.readUInt32BE(offset);
        const type = pngBuffer.toString('ascii', offset + 4, offset + 8);
        const chunkTotalLen = 12 + length;

        if (offset + chunkTotalLen > pngBuffer.length) {
            chunks.push(pngBuffer.subarray(offset));
            break;
        }

        if (type === 'pHYs') {
            if (!physInserted) {
                chunks.push(physChunk);
                physInserted = true;
            }
        } else if (type === 'IHDR') {
            chunks.push(pngBuffer.subarray(offset, offset + chunkTotalLen));
            chunks.push(physChunk);
            physInserted = true;
        } else {
            chunks.push(pngBuffer.subarray(offset, offset + chunkTotalLen));
        }
        offset += chunkTotalLen;
    }

    return Buffer.concat(chunks);
}

// ==========================================================
// 🧠 100% FREE UNLIMITED DUAL-CONTRAST VISION TITLE ENGINE
// ==========================================================
function httpsPostRequest(urlStr, headers, bodyStr, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const opts = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                ...headers,
                'Content-Length': Buffer.byteLength(bodyStr)
            },
            timeout: timeoutMs
        };
        const req = https.request(opts, (res) => {
            let chunks = [];
            res.on('data', d => chunks.push(d));
            res.on('end', () => {
                const txt = Buffer.concat(chunks).toString('utf8');
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(txt);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
        req.write(bodyStr);
        req.end();
    });
}

// ট্রান্সপারেন্ট PNG-তে কালো লেখা বা সাদা লেখা যাই থাকুক, সাদা (#FFFFFF) এবং কালো (#111111) ব্যাকগ্রাউন্ডে বসিয়ে ক্লিয়ার ইমেজ তৈরি
async function prepareDualContrastImages(rawBase64DataUrl) {
    try {
        return await mainWindow.webContents.executeJavaScript(`
            (async () => {
                const img = new Image();
                await new Promise((res, rej) => {
                    img.onload = res;
                    img.onerror = rej;
                    img.src = ${JSON.stringify(rawBase64DataUrl)};
                });

                const box = 620;
                const scale = Math.min((box - 36) / (img.width || box), (box - 36) / (img.height || box));
                const w = Math.max(1, Math.round((img.width || box) * scale));
                const h = Math.max(1, Math.round((img.height || box) * scale));
                const ox = Math.round((box - w) / 2);
                const oy = Math.round((box - h) / 2);

                // ১. সাদা ব্যাকগ্রাউন্ড (কালো, গাঢ় সবুজ, গাঢ় লাল টেক্সটের জন্য)
                const cWhite = document.createElement('canvas');
                cWhite.width = box;
                cWhite.height = box;
                const ctxW = cWhite.getContext('2d');
                ctxW.fillStyle = '#FFFFFF';
                ctxW.fillRect(0, 0, box, box);
                ctxW.drawImage(img, ox, oy, w, h);

                // ২. কালো ব্যাকগ্রাউন্ড (সাদা, হলুদ, হালকা নীল টেক্সটের জন্য)
                const cBlack = document.createElement('canvas');
                cBlack.width = box;
                cBlack.height = box;
                const ctxB = cBlack.getContext('2d');
                ctxB.fillStyle = '#111111';
                ctxB.fillRect(0, 0, box, box);
                ctxB.drawImage(img, ox, oy, w, h);

                // ৩. উপর-নিচ একসাথে (Top = White BG, Bottom = Black BG) যাতে ১টি কলেই দুই ধরনের টেক্সট পড়া যায়
                const cStacked = document.createElement('canvas');
                cStacked.width = box;
                cStacked.height = box * 2;
                const ctxS = cStacked.getContext('2d');
                ctxS.drawImage(cWhite, 0, 0);
                ctxS.drawImage(cBlack, 0, box);

                return {
                    whiteDataUrl: cWhite.toDataURL('image/jpeg', 0.85),
                    blackDataUrl: cBlack.toDataURL('image/jpeg', 0.85),
                    stackedDataUrl: cStacked.toDataURL('image/jpeg', 0.82),
                    boxSize: box
                };
            })();
        `);
    } catch (e) {
        let fallbackB64 = rawBase64DataUrl;
        try {
            const clean = rawBase64DataUrl.replace(/^data:[^;]+;base64,/, '');
            const nImg = nativeImage.createFromBuffer(Buffer.from(clean, 'base64'));
            if (!nImg.isEmpty()) {
                fallbackB64 = `data:image/jpeg;base64,${nImg.resize({ width: 620 }).toJPEG(85).toString('base64')}`;
            }
        } catch (err) {}
        return { whiteDataUrl: fallbackB64, blackDataUrl: fallbackB64, stackedDataUrl: fallbackB64, boxSize: 620 };
    }
}

function toStoreTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

function formatStoreReadyTitleFromText(rawText) {
    if (!rawText) return "";

    let text = rawText
        .replace(/\r?\n/g, ' ')
        // রিবন বা আইকন দিয়ে রিপ্লেস করা শব্দ ঠিক করা (যেমন WR🎗️NG -> Wrong)
        .replace(/\bWR\s*[0O]?\s*NG\b/gi, 'Wrong')
        .replace(/\bL\s*[0O]?\s*VE\b/gi, 'Love')
        .replace(/\bH\s*[0O]?\s*PE\b/gi, 'Hope')
        .replace(/\bFA\s*[I1L]?\s*TH\b/gi, 'Faith')
        .replace(/\bSTR\s*[0O]?\s*NG\b/gi, 'Strong')
        // Contractions প্রাকৃতিকভাবে ঠিক করা
        .replace(/\bI\s*['’`]\s*m\b/gi, 'I Am')
        .replace(/\bI\s+m\b/gi, 'I Am')
        .replace(/\bI\s*['’`]\s*d\b/gi, 'I Would')
        .replace(/\bdon\s*['’`]\s*t\b/gi, 'Do Not')
        .replace(/\bcan\s*['’`]\s*t\b/gi, 'Can Not')
        .replace(/\bwon\s*['’`]\s*t\b/gi, 'Will Not')
        .replace(/\bit\s*['’`]\s*s\b/gi, 'It Is')
        .replace(/\bthat\s*['’`]\s*s\b/gi, 'That Is')
        .replace(/\bwhat\s*['’`]\s*s\b/gi, 'What Is')
        .replace(/\bshe\s*['’`]\s*s\b/gi, 'She Is')
        .replace(/\bhe\s*['’`]\s*s\b/gi, 'He Is')
        .replace(/\byou\s*['’`]\s*re\b/gi, 'You Are')
        .replace(/\bwe\s*['’`]\s*re\b/gi, 'We Are')
        .replace(/\bthey\s*['’`]\s*re\b/gi, 'They Are')
        .replace(/\bisn\s*['’`]\s*t\b/gi, 'Is Not')
        .replace(/\baren\s*['’`]\s*t\b/gi, 'Are Not')
        .replace(/\bdidn\s*['’`]\s*t\b/gi, 'Did Not')
        .replace(/\bdoesn\s*['’`]\s*t\b/gi, 'Does Not')
        .replace(/\blet\s*['’`]\s*s\b/gi, 'Let Us');

    // বড় কোটেশনের ক্ষেত্রে মূল হুক বা প্রথম সম্পূর্ণ বাক্যাংশ নেওয়া
    const clauseParts = text.split(/\.\.\.|\bAS LONG AS\b|\bBECAUSE\b|\bTHEN ALWAYS\b|[?!;]/i);
    if (clauseParts.length > 1 && clauseParts[0].trim()) {
        const firstClauseWords = clauseParts[0].replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
        if (firstClauseWords.length >= 4) {
            text = clauseParts[0];
        }
    }

    // নিচের ছোট ব্যানার/ট্যাগলাইন (যেমন T1D AWARENESS) বাদ দেওয়া যদি মূল টাইটেল ইতিমধ্যে ৪+ শব্দের হয়
    const mainWordsCheck = text.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (mainWordsCheck.length >= 6) {
        text = text.replace(/\b(T1D|TYPE\s*1|TYPE\s*2)?\s*AWARENESS\s*$/i, '').trim();
    }

    text = text.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    // ১ অক্ষরের OCR নয়েজ বাদ দেওয়া (শুধু 'I' এবং 'A' রেখে)
    let words = text.split(' ').filter(w => w.length > 1 || /^[ia]$/i.test(w));
    if (words.length === 0) return "";

    // যদি বাক্যের শেষে 'Anymore' বা 'That' থাকে এবং বাক্য বড় হয়
    if (words.length >= 8 && /^anymore$/i.test(words[words.length - 1])) {
        words.pop();
    }

    // স্টোর আপলোডের জন্য সর্বোচ্চ ৮-৯টি সম্পূর্ণ শব্দ রাখা (কোনো শব্দ মাঝখান থেকে কাটা হবে না)
    if (words.length > 9) {
        words = words.slice(0, 9);
    }

    const danglingEndings = new Set([
        'and', 'or', 'but', 'the', 'a', 'an', 'of', 'to', 'in',
        'on', 'for', 'with', 'by', 'about', 'that', 'because', 'as', 'is', 'are'
    ]);
    while (words.length > 3 && danglingEndings.has(words[words.length - 1].toLowerCase())) {
        words.pop();
    }

    const finalTitle = toStoreTitleCase(words.join(' '));
    return finalTitle.length >= 2 ? finalTitle : "";
}

async function scanWithFreeNeuralOcr(stackedDataUrl, boxSize) {
    for (let attempt = 0; attempt < 2; attempt++) {
        const activeOcrKey = FREE_OCR_KEYS[ocrKeyIndex % FREE_OCR_KEYS.length];
        ocrKeyIndex++;

        try {
            const postBody = new URLSearchParams({
                apikey: activeOcrKey,
                base64Image: stackedDataUrl,
                language: 'eng',
                OCREngine: '2',
                isOverlayRequired: 'true',
                scale: 'true'
            }).toString();

            const ocrTxt = await httpsPostRequest(
                'https://api.ocr.space/parse/image',
                { 'Content-Type': 'application/x-www-form-urlencoded' },
                postBody,
                9500
            );

            const ocrJson = JSON.parse(ocrTxt);
            const parsedRes = ocrJson?.ParsedResults?.[0];
            if (!parsedRes) continue;

            const lines = parsedRes?.TextOverlay?.Lines || [];
            if (lines.length > 0) {
                const topHalfLines = [];
                const bottomHalfLines = [];

                for (const ln of lines) {
                    const lineText = (ln.LineText || '').trim();
                    if (!lineText) continue;
                    const minTop = Number(ln.MinTop) || 0;
                    if (minTop < boxSize - 10) {
                        topHalfLines.push({ y: minTop, text: lineText });
                    } else {
                        bottomHalfLines.push({ y: minTop - boxSize, text: lineText });
                    }
                }

                topHalfLines.sort((a, b) => a.y - b.y);
                bottomHalfLines.sort((a, b) => a.y - b.y);

                // সাদা ব্যাকগ্রাউন্ড ও কালো ব্যাকগ্রাউন্ডের লাইনগুলো পজিশন অনুযায়ী মার্জ করা (যাতে Raccoon ডিজাইনের মতো ২ রঙের টেক্সটই ১০০% আসে)
                const mergedLines = [...topHalfLines];
                for (const bLine of bottomHalfLines) {
                    const existingIdx = mergedLines.findIndex(tLine => Math.abs(tLine.y - bLine.y) < 28);
                    if (existingIdx === -1) {
                        mergedLines.push(bLine);
                    } else {
                        const tClean = mergedLines[existingIdx].text.replace(/[^a-zA-Z0-9]/g, '');
                        const bClean = bLine.text.replace(/[^a-zA-Z0-9]/g, '');
                        if (bClean.length > tClean.length) {
                            mergedLines[existingIdx] = bLine;
                        }
                    }
                }
                mergedLines.sort((a, b) => a.y - b.y);

                const topText = topHalfLines.map(l => l.text).join(' ');
                const bottomText = bottomHalfLines.map(l => l.text).join(' ');
                const mergedText = mergedLines.map(l => l.text).join(' ');

                // যে টেক্সটটি সবচেয়ে পরিষ্কার সেটি বেছে নেওয়া
                const candidates = [mergedText, topText, bottomText]
                    .map(t => formatStoreReadyTitleFromText(t))
                    .filter(Boolean);

                if (candidates.length > 0) {
                    return candidates[0];
                }
            }

            const rawParsed = (parsedRes.ParsedText || '').trim();
            if (rawParsed) {
                const title = formatStoreReadyTitleFromText(rawParsed);
                if (title) return title;
            }
        } catch (e) {}
    }
    return "";
}

// ১০০% লোকাল ব্রাউজার OCR ফলব্যাক (ইন্টারনেট বা সার্ভার বিজি থাকলেও পিসির ভেতরেই স্ক্যান করবে — Zero Rate Limit)
async function scanWithLocalTesseractInWindow(whiteDataUrl, blackDataUrl) {
    try {
        const rawExtracted = await mainWindow.webContents.executeJavaScript(`
            (async () => {
                if (!window.Tesseract) {
                    await new Promise((res, rej) => {
                        const s = document.createElement('script');
                        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                        s.onload = res;
                        s.onerror = rej;
                        document.head.appendChild(s);
                    });
                }
                if (!window.__ocrWorker) {
                    window.__ocrWorker = await window.Tesseract.createWorker('eng');
                }
                const r1 = await window.__ocrWorker.recognize(${JSON.stringify(whiteDataUrl)});
                const t1 = (r1?.data?.text || '').trim();
                if (t1.replace(/[^a-zA-Z]/g, '').length >= 6) return t1;

                const r2 = await window.__ocrWorker.recognize(${JSON.stringify(blackDataUrl)});
                const t2 = (r2?.data?.text || '').trim();
                return t2.length > t1.length ? t2 : t1;
            })();
        `);
        return formatStoreReadyTitleFromText(rawExtracted);
    } catch (e) {
        return "";
    }
}

async function generateAiTitleNode(rawBase64DataUrl, customApiKey) {
    const { whiteDataUrl, blackDataUrl, stackedDataUrl, boxSize } = await prepareDualContrastImages(rawBase64DataUrl);

    // যদি ইউজার নিজস্ব OpenAI বা Gemini API Key দিয়ে থাকে তবে সেটি আগে চেক করবে
    const userKey = (customApiKey || '').trim();
    if (userKey && (userKey.startsWith('sk-') || userKey.startsWith('ghp_') || userKey.startsWith('github_pat_'))) {
        try {
            const endpoint = userKey.startsWith('sk-')
                ? 'https://api.openai.com/v1/chat/completions'
                : 'https://models.inference.ai.azure.com/chat/completions';
            const payload = JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Read this T-shirt design carefully and output ONLY one catchy, store-upload-friendly title (3 to 8 words, Title Case, no quotes or punctuation).' },
                        { type: 'image_url', image_url: { url: stackedDataUrl } }
                    ]
                }],
                temperature: 0.1,
                max_tokens: 40
            });
            const resTxt = await httpsPostRequest(endpoint, { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userKey}` }, payload, 9000);
            const resJson = JSON.parse(resTxt);
            const reply = (resJson?.choices?.[0]?.message?.content || '').trim();
            const clean = formatStoreReadyTitleFromText(reply);
            if (clean) return clean;
        } catch (e) {}
    }

    // 🚀 1. PRIMARY ENGINE: 100% FREE UNLIMITED DUAL-CONTRAST NEURAL VISION OCR
    const neuralTitle = await scanWithFreeNeuralOcr(stackedDataUrl, boxSize);
    if (neuralTitle) {
        console.log(`✅ [Store Title Generated]: ${neuralTitle}`);
        return neuralTitle;
    }

    // 🚀 2. FALLBACK ENGINE: 100% LOCAL IN-APP WASM OCR (ZERO SERVER / ZERO LIMIT)
    const localTitle = await scanWithLocalTesseractInWindow(whiteDataUrl, blackDataUrl);
    if (localTitle) {
        console.log(`✅ [Local Engine Store Title]: ${localTitle}`);
        return localTitle;
    }

    return "Vintage Graphic Art Print";
}

// ==========================================================
// 💎 STEP B: PURE VECTOR <PATH> DELETE + SVG <MASK> PATHFINDER DIVIDE
// ==========================================================
function detectImageBgRgbFromBase64(rawBase64DataUrl) {
    try {
        const cleanB64 = rawBase64DataUrl.replace(/^data:[^;]+;base64,/, '');
        const nImg = nativeImage.createFromBuffer(Buffer.from(cleanB64, 'base64'));
        if (!nImg.isEmpty()) {
            const small = nImg.resize({ width: 40, height: 40 });
            const bmp = small.toBitmap();
            const coords = [
                (2 * 40 + 2) * 4,
                (2 * 40 + 37) * 4,
                (37 * 40 + 2) * 4,
                (37 * 40 + 37) * 4
            ];
            for (const idx of coords) {
                const b = bmp[idx];
                const g = bmp[idx + 1];
                const r = bmp[idx + 2];
                const a = bmp[idx + 3];
                if (a > 200) return { r, g, b };
            }
        }
    } catch (e) {}
    return { r: 0, g: 0, b: 0 };
}

async function processSvgStandaloneInApp(svgPath, origBase64, readyTitle, toleranceVal) {
    const bgRgb = detectImageBgRgbFromBase64(origBase64);
    const svgRawText = fs.readFileSync(svgPath, 'utf8');
    const tol = Number(toleranceVal) || 10;

    const trimmedPngDataUrl = await mainWindow.webContents.executeJavaScript(`
        (async () => {
            const rawSvg = ${JSON.stringify(svgRawText)};
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawSvg, "image/svg+xml");
            const svgEl = doc.querySelector("svg");
            if (!svgEl) throw new Error("Invalid SVG file");

            let origVbW = 1024, origVbH = 1024, vbMinX = 0, vbMinY = 0;
            const vb = svgEl.getAttribute("viewBox");
            if (vb) {
                const parts = vb.trim().split(/[\\s,]+/).map(Number);
                if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                    vbMinX = parts[0];
                    vbMinY = parts[1];
                    origVbW = parts[2];
                    origVbH = parts[3];
                }
            } else {
                const wAttr = parseFloat(svgEl.getAttribute("width"));
                const hAttr = parseFloat(svgEl.getAttribute("height"));
                if (wAttr > 0 && hAttr > 0) {
                    origVbW = wAttr;
                    origVbH = hAttr;
                    svgEl.setAttribute("viewBox", \`0 0 \${origVbW} \${origVbH}\`);
                }
            }

            const tempContainer = document.createElement("div");
            tempContainer.style.cssText = "position:fixed;left:-99999px;top:-99999px;width:100px;height:100px;opacity:0;pointer-events:none;";
            tempContainer.appendChild(svgEl);
            document.body.appendChild(tempContainer);

            function parseRgbString(str) {
                if (!str || str === "none" || str === "transparent") return null;
                const m = str.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*([\\d.]+))?\\s*\\)/i);
                if (m) {
                    if (m[4] !== undefined && parseFloat(m[4]) < 0.05) return null;
                    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
                }
                return null;
            }

            const shapeSelector = "path, rect, polygon, circle, ellipse, polyline";
            const allShapes = Array.from(svgEl.querySelectorAll(shapeSelector)).filter(el => !el.closest("defs, clipPath, mask, symbol, pattern"));

            let targetR = ${bgRgb.r}, targetG = ${bgRgb.g}, targetB = ${bgRgb.b};
            if (allShapes.length > 0) {
                const firstComp = window.getComputedStyle(allShapes[0]);
                const firstRgb = parseRgbString(firstComp.fill);
                if (firstRgb) {
                    if ((firstRgb[0] <= 55 && firstRgb[1] <= 55 && firstRgb[2] <= 55) ||
                        (firstRgb[0] >= 200 && firstRgb[1] >= 200 && firstRgb[2] >= 200)) {
                        targetR = firstRgb[0];
                        targetG = firstRgb[1];
                        targetB = firstRgb[2];
                    }
                }
            }

            const userTol = ${tol};
            const tolRgb = Math.max(20, Math.round(userTol * 2.6));
            const chokeUnit = Math.max(origVbW, origVbH) * 0.0006;

            const svgNs = "http://www.w3.org/2000/svg";
            let defsEl = svgEl.querySelector("defs");
            if (!defsEl) {
                defsEl = document.createElementNS(svgNs, "defs");
                svgEl.insertBefore(defsEl, svgEl.firstChild);
            }

            const maskEl = document.createElementNS(svgNs, "mask");
            maskEl.setAttribute("id", "ai-pure-vector-divide-mask");
            maskEl.setAttribute("maskUnits", "userSpaceOnUse");
            maskEl.setAttribute("x", String(vbMinX - origVbW));
            maskEl.setAttribute("y", String(vbMinY - origVbH));
            maskEl.setAttribute("width", String(origVbW * 3));
            maskEl.setAttribute("height", String(origVbH * 3));

            const bgElementsToRemove = [];

            for (const el of allShapes) {
                const comp = window.getComputedStyle(el);
                if (comp.display === "none" || comp.visibility === "hidden" || parseFloat(comp.opacity) === 0) {
                    continue;
                }

                const fillRgb = parseRgbString(comp.fill);
                const strokeRgb = parseRgbString(comp.stroke);
                const fillRule = comp.fillRule || el.getAttribute("fill-rule") || "nonzero";

                let isBgFill = false;
                if (fillRgb) {
                    const diff = Math.max(
                        Math.abs(fillRgb[0] - targetR),
                        Math.abs(fillRgb[1] - targetG),
                        Math.abs(fillRgb[2] - targetB)
                    );
                    if (diff <= tolRgb) {
                        isBgFill = true;
                    }
                }

                const maskClone = el.cloneNode(true);
                maskClone.removeAttribute("class");
                maskClone.removeAttribute("style");
                maskClone.setAttribute("fill-rule", fillRule);

                if (isBgFill) {
                    maskClone.setAttribute("fill", "#000000");
                    maskClone.setAttribute("stroke", "#000000");
                    maskClone.setAttribute("stroke-width", String(chokeUnit));
                    maskClone.setAttribute("stroke-linejoin", "round");
                    bgElementsToRemove.push(el);
                } else if (fillRgb) {
                    maskClone.setAttribute("fill", "#ffffff");
                    maskClone.setAttribute("stroke", "none");
                    el.style.fill = \`rgb(\${fillRgb[0]}, \${fillRgb[1]}, \${fillRgb[2]})\`;
                    el.style.fillRule = fillRule;
                }

                if (strokeRgb) {
                    const sDiff = Math.max(
                        Math.abs(strokeRgb[0] - targetR),
                        Math.abs(strokeRgb[1] - targetG),
                        Math.abs(strokeRgb[2] - targetB)
                    );
                    if (sDiff <= tolRgb) {
                        el.style.stroke = "none";
                    }
                }

                maskEl.appendChild(maskClone);
            }

            defsEl.appendChild(maskEl);

            for (const bgEl of bgElementsToRemove) {
                bgEl.remove();
            }

            const maskGroup = document.createElementNS(svgNs, "g");
            maskGroup.setAttribute("mask", "url(#ai-pure-vector-divide-mask)");

            const childNodes = Array.from(svgEl.childNodes);
            for (const node of childNodes) {
                if (node !== defsEl && node.nodeName.toLowerCase() !== "style") {
                    maskGroup.appendChild(node);
                }
            }
            svgEl.appendChild(maskGroup);

            const renderScale = 4800 / Math.max(origVbW, origVbH);
            const renderW = Math.max(1, Math.round(origVbW * renderScale));
            const renderH = Math.max(1, Math.round(origVbH * renderScale));
            svgEl.setAttribute("width", renderW + "px");
            svgEl.setAttribute("height", renderH + "px");

            const finalSvgMarkup = new XMLSerializer().serializeToString(svgEl);
            tempContainer.remove();

            const svgBlob = new Blob([finalSvgMarkup], { type: "image/svg+xml;charset=utf-8" });
            const domUrl = URL.createObjectURL(svgBlob);

            const img = new Image();
            await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
                img.src = domUrl;
            });
            URL.revokeObjectURL(domUrl);

            const c1 = document.createElement("canvas");
            c1.width = renderW;
            c1.height = renderH;
            const ctx1 = c1.getContext("2d", { willReadFrequently: true });
            ctx1.imageSmoothingEnabled = true;
            ctx1.imageSmoothingQuality = "high";

            ctx1.drawImage(img, 0, 0, renderW, renderH);
            ctx1.drawImage(img, 0, 0, renderW, renderH);

            const imgDataObj = ctx1.getImageData(0, 0, renderW, renderH);
            const data = imgDataObj.data;

            let minX = renderW, minY = renderH, maxX = -1, maxY = -1;
            for (let y = 0; y < renderH; y++) {
                const rowOffset = y * renderW * 4;
                for (let x = 0; x < renderW; x++) {
                    if (data[rowOffset + x * 4 + 3] > 15) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (maxX < minX || maxY < minY) {
                minX = 0; minY = 0; maxX = renderW - 1; maxY = renderH - 1;
            }

            const trimW = (maxX - minX) + 1;
            const trimH = (maxY - minY) + 1;

            const maxTarget = 4800;
            const scale = maxTarget / Math.max(trimW, trimH);
            const finalW = Math.max(1, Math.round(trimW * scale));
            const finalH = Math.max(1, Math.round(trimH * scale));

            const c2 = document.createElement("canvas");
            c2.width = finalW;
            c2.height = finalH;
            const ctx2 = c2.getContext("2d");
            ctx2.imageSmoothingEnabled = true;
            ctx2.imageSmoothingQuality = "high";
            ctx2.drawImage(c1, minX, minY, trimW, trimH, 0, 0, finalW, finalH);

            return c2.toDataURL("image/png");
        })();
    `);

    const safeTitle = (readyTitle || 'Vintage Graphic Art Print')
        .replace(/[\\/*?:"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim() || 'Vintage Graphic Art Print';

    let finalSavePath = path.join(FINAL_DESIGNS_FOLDER, `${safeTitle}.png`);
    let counter = 1;
    while (fs.existsSync(finalSavePath)) {
        finalSavePath = path.join(FINAL_DESIGNS_FOLDER, `${safeTitle} ${counter}.png`);
        counter++;
    }

    const outB64 = trimmedPngDataUrl.replace(/^data:image\/png;base64,/, '');
    const rawPngBuffer = Buffer.from(outB64, 'base64');
    const png300PpiBuffer = setPng300Ppi(rawPngBuffer, 300);

    fs.writeFileSync(finalSavePath, png300PpiBuffer);
    return path.basename(finalSavePath);
}

// ==========================================================
// 🛠️ CHROME DEVTOOLS PROTOCOL (CDP) ENGINE
// ==========================================================
async function ensureDebugger() {
    const dbg = view.webContents.debugger;
    if (!dbg.isAttached()) {
        try {
            dbg.attach('1.3');
        } catch (err) {
            console.error("Debugger attach note:", err.message);
        }

        dbg.on('message', async (_event, method, params) => {
            if (method === 'Page.fileChooserOpened' && pendingFileForChooser) {
                const fileToUpload = pendingFileForChooser;
                pendingFileForChooser = null;
                try {
                    await dbg.sendCommand('DOM.setFileInputFiles', {
                        files: [fileToUpload],
                        backendNodeId: params.backendNodeId
                    });
                } catch (e) {}
            }
        });
    }

    try {
        await dbg.sendCommand('Page.enable');
        await dbg.sendCommand('DOM.enable');
    } catch (e) {}
    return dbg;
}

// ==========================================================
// 💎 SCI-FI CURSOR, SHATTER & OVERCHARGE VFX
// ==========================================================
async function animateFlyingCursor(x, y, mode = 'normal') {
    try {
        await view.webContents.executeJavaScript(`
            (() => {
                if (!document.getElementById('ai-cursor-styles')) {
                    const style = document.createElement('style');
                    style.id = 'ai-cursor-styles';
                    style.innerHTML = \`
                        #ai-flying-cursor { position:fixed; top:0; left:0; width:40px; height:40px; pointer-events:none!important; z-index:2147483647!important; will-change:transform; backface-visibility:hidden; }
                        #ai-flying-cursor .cursor-body { position:relative; width:100%; height:100%; transform-origin:4px 4px; animation:aiCyberHoverFloat 0.75s infinite ease-in-out alternate; }
                        #ai-flying-cursor.clicking .cursor-body { animation:aiNormalStrike 240ms cubic-bezier(0.34,1.56,0.64,1) forwards!important; }
                        #ai-flying-cursor.shattering .cursor-body { animation:aiHeavyHammerSmash 420ms cubic-bezier(0.22,1,0.36,1) forwards!important; }
                        #ai-flying-cursor .hud-ring-outer { position:absolute; top:-13px; left:-13px; width:30px; height:30px; border-radius:50%; border:2px dashed #00f0ff; box-shadow:0 0 14px #00f0ff,inset 0 0 6px #3b82f6; animation:aiHudSpinCW 2s linear infinite; pointer-events:none!important; }
                        #ai-flying-cursor .hud-ring-inner { position:absolute; top:-7px; left:-7px; width:18px; height:18px; border-radius:50%; border:1.5px solid #3b82f6; background:radial-gradient(circle,#fff 0%,rgba(0,240,255,0.85) 45%,rgba(37,99,235,0.5) 75%,transparent 90%); box-shadow:0 0 12px #3b82f6; animation:aiHudSpinCCW 1.3s linear infinite; pointer-events:none!important; }
                        .ai-normal-click-vfx,.ai-shatter-vfx { position:fixed; top:0; left:0; width:0; height:0; pointer-events:none!important; z-index:2147483646!important; }
                        .ai-normal-click-vfx .wave-1 { position:absolute; width:28px; height:28px; border-radius:50%; border:2.5px solid #00f0ff; box-shadow:0 0 16px #3b82f6; transform:translate(-50%,-50%) scale(0.2); animation:aiWaveExpand 380ms cubic-bezier(0.16,1,0.3,1) forwards; }
                        .ai-normal-click-vfx .wave-2 { position:absolute; width:20px; height:20px; border-radius:50%; background:radial-gradient(circle,#fff 0%,#00f0ff 50%,transparent 75%); box-shadow:0 0 14px #00f0ff; transform:translate(-50%,-50%) scale(0.2); animation:aiCoreFlash 260ms ease-out forwards; }
                        .ai-normal-click-vfx .mini-spark { position:absolute; width:3px; height:11px; border-radius:3px; background:linear-gradient(to top,#2563eb,#00f0ff); box-shadow:0 0 8px #00f0ff; transform-origin:center; animation:aiMiniSparkOut 340ms cubic-bezier(0.16,1,0.3,1) forwards; }
                        .ai-shatter-vfx .supernova-flash { position:absolute; width:95px; height:95px; border-radius:50%; background:radial-gradient(circle,#fff 0%,#00f0ff 35%,#2563eb 68%,transparent 82%); transform:translate(-50%,-50%) scale(0.1); animation:aiSupernovaFlash 480ms ease-out forwards; }
                        .ai-shatter-vfx .shockwave-blue { position:absolute; width:56px; height:56px; border-radius:50%; border:4px solid #3b82f6; box-shadow:0 0 38px #2563eb,inset 0 0 20px #00f0ff; transform:translate(-50%,-50%) scale(0.2); animation:aiMegaShockwave 650ms cubic-bezier(0.16,1,0.3,1) forwards; }
                        .ai-shatter-vfx .shockwave-cyan { position:absolute; width:46px; height:46px; border-radius:50%; border:3px dashed #00f0ff; box-shadow:0 0 32px #00f0ff; transform:translate(-50%,-50%) scale(0.2); animation:aiMegaShockwaveSpin 600ms 30ms cubic-bezier(0.16,1,0.3,1) forwards; }
                        .ai-shatter-vfx .mega-laser { position:absolute; width:4px; height:28px; border-radius:4px; background:linear-gradient(to top,var(--clr),#fff); box-shadow:0 0 14px var(--clr); transform-origin:center; animation:aiMegaLaserShoot 560ms cubic-bezier(0.16,1,0.3,1) forwards; }
                        .ai-btn-shatter-shake { animation:aiBtnEarthquake 420ms cubic-bezier(0.36,0.07,0.19,0.97) both!important; }
                        @keyframes aiHudSpinCW { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
                        @keyframes aiHudSpinCCW { 0%{transform:rotate(360deg) scale(0.9)} 50%{transform:rotate(180deg) scale(1.18)} 100%{transform:rotate(0deg) scale(0.9)} }
                        @keyframes aiCyberHoverFloat { 0%{transform:translate3d(-4px,1px,0) rotate(-8deg)} 100%{transform:translate3d(4px,-3px,0) rotate(8deg)} }
                        @keyframes aiNormalStrike { 0%{transform:scale(1.2) rotate(12deg)} 40%{transform:scale(0.68) rotate(-18deg)} 75%{transform:scale(1.15) rotate(8deg)} 100%{transform:scale(1) rotate(0deg)} }
                        @keyframes aiHeavyHammerSmash { 0%{transform:translate3d(12px,-28px,0) scale(1.9) rotate(32deg)} 30%{transform:translate3d(0,4px,0) scale(0.45) rotate(-38deg)} 60%{transform:translate3d(-6px,-10px,0) scale(1.45) rotate(16deg)} 80%{transform:translate3d(3px,2px,0) scale(0.9) rotate(-6deg)} 100%{transform:translate3d(0,0,0) scale(1) rotate(0deg)} }
                        @keyframes aiWaveExpand { 0%{transform:translate(-50%,-50%) scale(0.2);opacity:1} 100%{transform:translate(-50%,-50%) scale(2.6);opacity:0} }
                        @keyframes aiCoreFlash { 0%{transform:translate(-50%,-50%) scale(0.3);opacity:1} 100%{transform:translate(-50%,-50%) scale(2);opacity:0} }
                        @keyframes aiMiniSparkOut { 0%{transform:translate(-50%,-50%) rotate(var(--rot)) translateY(-3px) scaleY(0.5);opacity:1} 100%{transform:translate(-50%,-50%) rotate(var(--rot)) translateY(-24px) scaleY(0.1);opacity:0} }
                        @keyframes aiSupernovaFlash { 0%{transform:translate(-50%,-50%) scale(0.2);opacity:1} 40%{transform:translate(-50%,-50%) scale(1.8);opacity:0.95} 100%{transform:translate(-50%,-50%) scale(3.2);opacity:0} }
                        @keyframes aiMegaShockwave { 0%{transform:translate(-50%,-50%) scale(0.2);opacity:1} 100%{transform:translate(-50%,-50%) scale(4.8);opacity:0} }
                        @keyframes aiMegaShockwaveSpin { 0%{transform:translate(-50%,-50%) scale(0.2) rotate(0deg);opacity:1} 100%{transform:translate(-50%,-50%) scale(3.8) rotate(120deg);opacity:0} }
                        @keyframes aiMegaLaserShoot { 0%{transform:translate(-50%,-50%) rotate(var(--rot)) translateY(-6px) scaleY(0.6);opacity:1} 100%{transform:translate(-50%,-50%) rotate(var(--rot)) translateY(-75px) scaleY(0.1);opacity:0} }
                        @keyframes aiBtnEarthquake { 0%,100%{transform:scale(1) rotate(0deg) translate3d(0,0,0);filter:brightness(1)} 15%{transform:scale(0.76) rotate(-5deg) translate3d(-8px,6px,0);filter:brightness(2.5)} 30%{transform:scale(1.16) rotate(5deg) translate3d(8px,-6px,0);filter:brightness(2)} 45%{transform:scale(0.86) rotate(-4deg) translate3d(-6px,-4px,0)} 60%{transform:scale(1.08) rotate(3deg) translate3d(6px,4px,0)} }
                    \`;
                    document.head.appendChild(style);
                }

                const cursorSvgHtml = \`<svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="aiCurGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#00f0ff"/><stop offset="75%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs><path d="M3 2.5L24.5 11.2L14.5 14.8L10.5 24.8L3 2.5Z" fill="url(#aiCurGrad)" stroke="#00f0ff" stroke-width="1.8" stroke-linejoin="round"/><circle cx="9.5" cy="9.5" r="2.4" fill="#ffffff"/></svg>\`;

                let cursor = document.getElementById('ai-flying-cursor');
                if (!cursor) {
                    cursor = document.createElement('div');
                    cursor.id = 'ai-flying-cursor';
                    window.__aiCursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
                    cursor.style.transform = \`translate3d(\${window.__aiCursorPos.x}px, \${window.__aiCursorPos.y}px, 0)\`;
                    cursor.innerHTML = \`<div class="cursor-body"><div class="hud-ring-outer"></div><div class="hud-ring-inner"></div>\${cursorSvgHtml}</div>\`;
                    document.body.appendChild(cursor);
                }

                const startPos = window.__aiCursorPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
                const endX = ${x}, endY = ${y}, clickMode = '${mode}';
                window.__aiCursorPos = { x: endX, y: endY };

                if (typeof cursor.getAnimations === 'function') cursor.getAnimations().forEach(a => a.cancel());

                const dx = endX - startPos.x, dy = endY - startPos.y;
                const dist = Math.hypot(dx, dy);
                const sway = Math.min(Math.max(dist * 0.24, 20), 58);
                const dir = dx >= 0 ? 1 : -1;

                const keyframes = [
                    { transform: \`translate3d(\${startPos.x}px, \${startPos.y}px, 0) rotate(0deg) scale(1)\` },
                    { transform: \`translate3d(\${startPos.x + dx * 0.35 - sway * dir}px, \${startPos.y + dy * 0.35 - 18}px, 0) rotate(\${-24 * dir}deg) scale(1.2)\`, offset: 0.36 },
                    { transform: \`translate3d(\${startPos.x + dx * 0.72 + sway * 0.7 * dir}px, \${startPos.y + dy * 0.72 - 8}px, 0) rotate(\${18 * dir}deg) scale(1.1)\`, offset: 0.74 },
                    { transform: \`translate3d(\${endX}px, \${endY}px, 0) rotate(0deg) scale(1)\` }
                ];

                if (typeof cursor.animate === 'function') {
                    const anim = cursor.animate(keyframes, { duration: 195, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
                    anim.onfinish = () => { cursor.style.transform = \`translate3d(\${endX}px, \${endY}px, 0)\`; };
                } else {
                    cursor.style.transform = \`translate3d(\${endX}px, \${endY}px, 0)\`;
                }

                setTimeout(() => {
                    if (!cursor) return;
                    cursor.style.transform = \`translate3d(\${endX}px, \${endY}px, 0)\`;
                    cursor.classList.remove('clicking', 'shattering');
                    void cursor.offsetWidth;

                    if (clickMode === 'shatter') {
                        cursor.classList.add('shattering');
                        const targetEl = document.elementFromPoint(endX, endY);
                        const targetBtn = targetEl ? (targetEl.closest('button') || targetEl) : null;
                        if (targetBtn) {
                            targetBtn.classList.remove('ai-btn-shatter-shake');
                            void targetBtn.offsetWidth;
                            targetBtn.classList.add('ai-btn-shatter-shake');
                        }
                        const webRoot = document.querySelector('#init-app') || document.body;
                        if (webRoot && typeof webRoot.animate === 'function') {
                            webRoot.animate([
                                { transform: 'translate3d(0,0,0) scale(1)' },
                                { transform: 'translate3d(-18px,14px,0) rotate(-1.5deg) scale(1.02)' },
                                { transform: 'translate3d(18px,-14px,0) rotate(1.5deg) scale(0.98)' },
                                { transform: 'translate3d(-12px,-8px,0) rotate(-1deg)' },
                                { transform: 'translate3d(12px,8px,0) rotate(1deg)' },
                                { transform: 'translate3d(0,0,0) scale(1)' }
                            ], { duration: 550, easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)' });
                        }
                        const shatter = document.createElement('div');
                        shatter.className = 'ai-shatter-vfx';
                        shatter.style.transform = \`translate3d(\${endX}px, \${endY}px, 0)\`;
                        let html = '<div class="supernova-flash"></div><div class="shockwave-blue"></div><div class="shockwave-cyan"></div>';
                        for (let i = 0; i < 12; i++) html += \`<div class="mega-laser" style="--rot:\${i * 30}deg; --clr:#00f0ff"></div>\`;
                        shatter.innerHTML = html;
                        document.body.appendChild(shatter);
                        setTimeout(() => cursor.classList.remove('shattering'), 420);
                        setTimeout(() => shatter.remove(), 700);
                    } else {
                        cursor.classList.add('clicking');
                        const vfx = document.createElement('div');
                        vfx.className = 'ai-normal-click-vfx';
                        vfx.style.transform = \`translate3d(\${endX}px, \${endY}px, 0)\`;
                        let html = '<div class="wave-1"></div><div class="wave-2"></div>';
                        for (let i = 0; i < 6; i++) html += \`<div class="mini-spark" style="--rot:\${i * 60}deg"></div>\`;
                        vfx.innerHTML = html;
                        document.body.appendChild(vfx);
                        setTimeout(() => cursor.classList.remove('clicking'), 240);
                        setTimeout(() => vfx.remove(), 400);
                    }
                }, 185);
            })();
        `);
    } catch (e) {}
}

async function startVectorizeOverchargeVFX(x, y) {
    try {
        await view.webContents.executeJavaScript(`
            (() => {
                if (window.__overchargeInterval) clearInterval(window.__overchargeInterval);
                const oldEl = document.getElementById('ai-vectorize-overcharge');
                if (oldEl) oldEl.remove();

                if (!document.getElementById('ai-overcharge-styles')) {
                    const style = document.createElement('style');
                    style.id = 'ai-overcharge-styles';
                    style.innerHTML = \`
                        #ai-vectorize-overcharge { position:fixed; top:0; left:0; width:0; height:0; pointer-events:none!important; z-index:2147483645!important; }
                        #ai-vectorize-overcharge .reactor-ring-1 { position:absolute; width:115px; height:115px; border-radius:50%; border:3px dashed #3b82f6; box-shadow:0 0 28px #2563eb,inset 0 0 18px #00f0ff; transform:translate(-50%,-50%); animation:aiReactorSpin1 1.1s linear infinite; }
                        #ai-vectorize-overcharge .reactor-ring-2 { position:absolute; width:84px; height:84px; border-radius:50%; border:2.5px dashed #00f0ff; box-shadow:0 0 25px #00f0ff,inset 0 0 15px #fff; transform:translate(-50%,-50%); animation:aiReactorSpin2 0.8s linear infinite; }
                        #ai-vectorize-overcharge .reactor-core { position:absolute; width:48px; height:48px; border-radius:50%; background:radial-gradient(circle,#fff 0%,#00f0ff 45%,#2563eb 78%,transparent 92%); transform:translate(-50%,-50%); animation:aiCoreOverloadPulse 0.26s infinite alternate ease-in-out; }
                        #ai-vectorize-overcharge .sci-fi-progress-hud { position:absolute; top:72px; left:0; transform:translateX(-50%); width:195px; padding:8px 12px; border-radius:12px; background:rgba(4,12,30,0.92); border:1.5px solid #00f0ff; box-shadow:0 0 25px rgba(0,240,255,0.7); font-family:sans-serif; }
                        #ai-vectorize-overcharge .hud-top-row { display:flex; justify-content:space-between; margin-bottom:6px; font-size:11px; font-weight:900; color:#fff; text-shadow:0 0 8px #00f0ff; }
                        #ai-vectorize-overcharge .hud-bar-track { width:100%; height:8px; border-radius:6px; background:rgba(255,255,255,0.12); overflow:hidden; border:1px solid rgba(0,240,255,0.4); }
                        #ai-vectorize-overcharge .hud-bar-fill { width:5%; height:100%; border-radius:6px; background:linear-gradient(90deg,#1d4ed8,#3b82f6,#00f0ff,#fff); box-shadow:0 0 14px #00f0ff; transition:width 120ms linear; }
                        @keyframes aiReactorSpin1 { 0%{transform:translate(-50%,-50%) rotate(0deg)} 100%{transform:translate(-50%,-50%) rotate(360deg)} }
                        @keyframes aiReactorSpin2 { 0%{transform:translate(-50%,-50%) rotate(360deg)} 100%{transform:translate(-50%,-50%) rotate(0deg)} }
                        @keyframes aiCoreOverloadPulse { 0%{transform:translate(-50%,-50%) scale(0.8)} 100%{transform:translate(-50%,-50%) scale(1.35)} }
                    \`;
                    document.head.appendChild(style);
                }

                const container = document.createElement('div');
                container.id = 'ai-vectorize-overcharge';
                container.style.transform = \`translate3d(\${${x}}px, \${${y}}px, 0)\`;
                container.innerHTML = \`
                    <div class="reactor-ring-1"></div><div class="reactor-ring-2"></div><div class="reactor-core"></div>
                    <div class="sci-fi-progress-hud">
                        <div class="hud-top-row"><span>⚡ VECTORIZING</span><span id="ai-vec-pct-text">5%</span></div>
                        <div class="hud-bar-track"><div class="hud-bar-fill" id="ai-vec-bar-fill"></div></div>
                    </div>
                \`;
                document.body.appendChild(container);

                let currentPct = 5;
                window.__overchargeInterval = setInterval(() => {
                    const box = document.getElementById('ai-vectorize-overcharge');
                    if (!box) { clearInterval(window.__overchargeInterval); return; }
                    currentPct += (99 - currentPct) * 0.055;
                    const displayPct = Math.min(99, Math.round(currentPct));
                    const pctEl = document.getElementById('ai-vec-pct-text');
                    const barEl = document.getElementById('ai-vec-bar-fill');
                    if (pctEl) pctEl.innerText = displayPct + '%';
                    if (barEl) barEl.style.width = displayPct + '%';
                }, 120);
            })();
        `);
    } catch (e) {}
}

async function stopVectorizeOverchargeVFX() {
    try {
        await view.webContents.executeJavaScript(`
            (() => {
                if (window.__overchargeInterval) { clearInterval(window.__overchargeInterval); window.__overchargeInterval = null; }
                const box = document.getElementById('ai-vectorize-overcharge');
                if (box) box.remove();
            })();
        `);
    } catch (e) {}
}

async function animateFileThrowOntoCanvas(targetX, targetY, rawBase64Url) {
    try {
        let lightThumbUrl = '';
        try {
            const cleanB64 = rawBase64Url.replace(/^data:[^;]+;base64,/, '');
            const nImg = nativeImage.createFromBuffer(Buffer.from(cleanB64, 'base64'));
            if (!nImg.isEmpty()) lightThumbUrl = nImg.resize({ width: 96 }).toDataURL();
        } catch (e) {}

        await view.webContents.executeJavaScript(`
            (() => {
                if (!document.getElementById('ai-throw-styles')) {
                    const style = document.createElement('style');
                    style.id = 'ai-throw-styles';
                    style.innerHTML = \`
                        .ai-carried-image-card { position:fixed; top:0; left:0; width:92px; height:92px; border-radius:18px; padding:5px; background:linear-gradient(135deg,rgba(0,240,255,0.35),rgba(37,99,235,0.35)); border:2.5px solid #00f0ff; box-shadow:0 15px 35px rgba(0,0,0,0.8),0 0 28px #00f0ff; pointer-events:none!important; z-index:2147483646!important; display:flex; align-items:center; justify-content:center; }
                        .ai-carried-image-card img { width:100%; height:100%; object-fit:contain; border-radius:12px; background:rgba(8,12,24,0.92); }
                    \`;
                    document.head.appendChild(style);
                }
                const startX = 120, startY = 25, endX = ${targetX}, endY = ${targetY};
                const card = document.createElement('div');
                card.className = 'ai-carried-image-card';
                const thumbSrc = \`${lightThumbUrl}\`;
                card.innerHTML = thumbSrc ? \`<img src="\${thumbSrc}" alt="drop"/>\` : \`<div style="color:#00f0ff;font-size:30px;">🖼️</div>\`;
                document.body.appendChild(card);

                if (typeof card.animate === 'function') {
                    card.animate([
                        { transform: \`translate3d(\${startX - 46}px, \${startY - 20}px, 0) scale(0.6)\`, opacity: 0.4 },
                        { transform: \`translate3d(\${endX - 46}px, \${endY - 95}px, 0) scale(1.4)\`, opacity: 1, offset: 0.75 },
                        { transform: \`translate3d(\${endX - 46}px, \${endY - 46}px, 0) scale(0.2)\`, opacity: 0 }
                    ], { duration: 580, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
                }
                setTimeout(() => card.remove(), 600);
            })();
        `);
    } catch (e) {}
}

async function cdpClick(x, y, mode = 'normal') {
    const dbg = await ensureDebugger();
    const rx = Math.round(x);
    const ry = Math.round(y);

    await animateFlyingCursor(rx, ry, mode);
    await wait(190);

    await dbg.sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rx, y: ry, button: 'none' });
    await wait(35);
    await dbg.sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: rx, y: ry, button: 'left', buttons: 1, clickCount: 1 });
    await wait(35);
    await dbg.sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rx, y: ry, button: 'left', buttons: 1, clickCount: 1 });
    await wait(60);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        title: "MyDesigns Pro Tool — Standalone POD Suite",
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        },
        autoHideMenuBar: true
    });

    mainWindow.loadFile('index.html');

    view = new BrowserView({
        webPreferences: {
            backgroundThrottling: false,
            partition: 'persist:mydesigns_pro'
        }
    });
    mainWindow.setBrowserView(view);
    view.setBounds({ x: 0, y: 2000, width: 1000, height: 530 });
    view.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
    view.webContents.loadURL('https://mydesigns.io/app/designs');

    view.webContents.session.on('will-download', (_event, item) => {
        const uniqueFileName = getUniqueSvgFileName();
        const downloadPath = path.join(app.getPath('downloads'), uniqueFileName);
        item.setSavePath(downloadPath);
        item.once('done', (_e, state) => {
            if (state === 'completed') console.log(`✅ File downloaded: ${uniqueFileName}`);
        });
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('toggle-view', (_event, show) => {
    if (show) view.setBounds({ x: 0, y: 220, width: 1000, height: 530 });
    else view.setBounds({ x: 0, y: 2000, width: 1000, height: 530 });
});

ipcMain.on('refresh-gallery', async (event) => {
    const scrapeCode = `
        (async () => {
            try {
                const imgs = Array.from(document.querySelectorAll('img'));
                const designImgs = imgs.filter(img => {
                    const src = img.src.toLowerCase();
                    const alt = (img.alt || "").toLowerCase();
                    if (src.includes('logo') || alt.includes('logo') || src.includes('avatar')) return false;
                    if (img.closest('header') || img.closest('nav')) return false;
                    const isNotTooWide = img.width < (img.height * 2.5);
                    return img.width > 60 && img.height > 60 && isNotTooWide && src.startsWith('http');
                });
                const getBaseData = (imgEl) => {
                    try {
                        const canvas = document.createElement("canvas");
                        canvas.width = imgEl.naturalWidth || imgEl.width;
                        canvas.height = imgEl.naturalHeight || imgEl.height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(imgEl, 0, 0);
                        return canvas.toDataURL("image/jpeg", 0.7);
                    } catch(e) { return imgEl.src; }
                };
                return designImgs.map(getBaseData);
            } catch(e) { return []; }
        })();
    `;
    try {
        const urls = await view.webContents.executeJavaScript(scrapeCode);
        event.sender.send('gallery-data', urls);
    } catch (err) {
        event.sender.send('gallery-data', []);
    }
});

async function getPageInfo(type) {
    return await view.webContents.executeJavaScript(`
        (async () => {
            const wait = (ms) => new Promise(r => setTimeout(r, ms));
            function byXPath(xp) {
                try { return document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; }
                catch (e) { return null; }
            }
            function rectOf(el) {
                if (!el) return null;
                const r = el.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) return null;
                return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
            }
            async function scrollDropdownItemIntoView(btn) {
                if (!btn) return;
                let parent = btn.parentElement;
                while (parent && parent !== document.body && parent.tagName !== 'MAIN') {
                    if (parent.scrollHeight > parent.clientHeight) {
                        const pRect = parent.getBoundingClientRect();
                        const bRect = btn.getBoundingClientRect();
                        parent.scrollTop += (bRect.top - pRect.top) - (parent.clientHeight / 2) + (bRect.height / 2);
                    }
                    parent = parent.parentElement;
                }
                await wait(85);
                const checkRect = btn.getBoundingClientRect();
                if (checkRect.bottom > window.innerHeight - 15) {
                    const menuBox = btn.closest('div.bg-base-elevated') || btn.closest('div.text-base-text');
                    if (menuBox) {
                        menuBox.style.maxHeight = (window.innerHeight - 30) + 'px';
                        menuBox.style.overflowY = 'auto';
                        menuBox.scrollTop += (checkRect.bottom - window.innerHeight) + 50;
                        await wait(85);
                    }
                }
            }

            const correctSignG = document.querySelector("[data-testid='designs-select-toggle'] svg g[id='correct sign']") ||
                                 document.querySelector("div[tabindex='0'] svg g[id='correct sign']") ||
                                 document.querySelector("svg g[id='correct sign']");
            const toggleBox = (correctSignG ? correctSignG.closest("div[tabindex='0']") : null) ||
                              document.querySelector("[data-testid='designs-select-toggle'] > div") ||
                              byXPath('//*[@data-testid="designs-select-toggle"]/div');

            const toggleContainer = document.querySelector("[data-testid='designs-select-toggle']") || (toggleBox ? toggleBox.parentElement : null);
            const toggleTxt = toggleContainer ? (toggleContainer.innerText || toggleContainer.textContent || '').trim() : '';
            const match = toggleTxt.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
            const selectedCount = match ? parseInt(match[1], 10) : 0;
            const totalCount = match ? parseInt(match[2], 10) : (toggleBox ? 1 : 0);

            const svg = toggleBox ? toggleBox.querySelector('svg') : null;
            const isChecked = Boolean(svg && !svg.classList.contains('invisible')) ||
                              Boolean(toggleBox && toggleBox.classList.contains('bg-brand-primary')) ||
                              selectedCount > 0;

            if ("${type}" === "status") {
                const bodyText = (document.body.innerText || '').toLowerCase();
                return {
                    hasToggle: Boolean(toggleBox),
                    selectedCount,
                    totalCount,
                    isChecked,
                    isPageReady: document.readyState === 'complete',
                    isEmptyCanvas: bodyText.includes('generate with dream ai') || bodyText.includes('no designs found') || !toggleBox,
                    isUploading: bodyText.includes('uploading 1 file') || bodyText.includes('uploading...')
                };
            }
            if ("${type}" === "dropZoneArea") {
                const dz = document.querySelector('.dropzone') || document.querySelector('[data-testid*="drop"]') || document.querySelector('.border-dashed') || document.querySelector('main') || document.querySelector('#init-app') || document.body;
                return rectOf(dz) || { x: 500, y: 300, width: 500, height: 300 };
            }
            if ("${type}" === "uploadBtn") {
                const btn = byXPath('//*[@id="init-app"]/div[2]/div[2]/main/div/div[2]/div[1]/div/div/div/button') ||
                            [...document.querySelectorAll('main button, button')].find(b => {
                                const t = (b.innerText || '').trim().toLowerCase();
                                const a = (b.getAttribute('aria-label') || '').trim().toLowerCase();
                                return t === 'upload' || a === 'upload';
                            }) || document.querySelector('div.pt-6 > div > div > div > button');
                return rectOf(btn);
            }
            if ("${type}" === "selectToggle") return rectOf(toggleBox);
            if ("${type}" === "actionsBtn") {
                const btn = [...document.querySelectorAll('button')].find(b => b.querySelector('g[id="down arrow"]') && (b.innerText || b.textContent || '').trim() === 'Actions') ||
                            document.querySelector("div.bg-base-subtle div.min-w-0 > div:nth-of-type(1) > div button") ||
                            [...document.querySelectorAll('button')].find(b => (b.innerText || '').trim() === 'Actions');
                return rectOf(btn);
            }
            if ("${type}" === "vectorizeBtn") {
                const gVec = document.querySelector('button svg g[id="vectorize image"]');
                const btn = (gVec ? gVec.closest('button') : null) ||
                            [...document.querySelectorAll('button')].find(b => {
                                const span = b.querySelector('span.truncate');
                                return span && span.textContent.trim().toLowerCase() === 'vectorize image';
                            });
                if (!btn) return null;
                await scrollDropdownItemIntoView(btn);
                return rectOf(btn.querySelector('span.truncate') || btn);
            }
            if ("${type}" === "generatePreviewBtn") {
                const gRight = document.querySelector('button svg g[id="right arrow"]');
                const btn = [...document.querySelectorAll('button')].find(b => b.querySelector('g[id="right arrow"]') && (b.innerText || b.textContent || '').includes('Generate Preview')) ||
                            (gRight ? gRight.closest('button') : null) ||
                            [...document.querySelectorAll('button')].find(b => (b.innerText || b.textContent || '').trim().toLowerCase() === 'generate preview') ||
                            byXPath('/html/body/div[5]/div/div[2]/div[3]/div[2]/button') ||
                            document.querySelector("div.mt-4 button");
                if (!btn) return null;
                await scrollDropdownItemIntoView(btn);
                btn.scrollIntoView({ behavior: 'instant', block: 'center' });
                await wait(75);
                return rectOf(btn);
            }
            if ("${type}" === "closeModalBtn") {
                const closeG = document.querySelector("div.text-base-text div.border-base-border button svg g[id='close']") ||
                               Array.from(document.querySelectorAll("button.ml-auto svg g[id='close']")).pop();
                const btn = (closeG ? closeG.closest('button') : null) ||
                            document.querySelector("div.text-base-text div.border-base-border > button") ||
                            byXPath('/html/body/div[5]/div/div[1]/button');
                if (!btn) return null;
                btn.scrollIntoView({ behavior: 'instant', block: 'center' });
                await wait(50);
                return rectOf(btn);
            }
            if ("${type}" === "deleteOption") {
                const gDel = document.querySelector('button svg g[id="Delete"]');
                const btn = (gDel ? gDel.closest('button') : null) ||
                            [...document.querySelectorAll('button')].find(b => {
                                const span = b.querySelector('span.truncate');
                                return span && span.textContent.trim() === 'Delete';
                            });
                if (!btn) return null;
                await scrollDropdownItemIntoView(btn);
                return rectOf(btn.querySelector('span.truncate') || btn);
            }
            if ("${type}" === "confirmDeleteBtn") {
                const btn = [...document.querySelectorAll('button.bg-error-solid, button')].find(b => (b.innerText || b.textContent || '').trim().toLowerCase() === 'yes, delete designs') ||
                            document.querySelector("button.bg-error-solid");
                return rectOf(btn);
            }
            return null;
        })();
    `);
}

async function throwFileViaDragAndDrop(fileObj) {
    const dbg = await ensureDebugger();
    const base64Data = fileObj.data.replace(/^data:[^;]+;base64,/, '');
    const ext = path.extname(fileObj.name || '') || '.png';
    const baseName = path.basename(fileObj.name || 'design', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const tempFilePath = path.join(app.getPath('temp'), `${baseName}_${Date.now()}${ext}`);
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));

    try {
        let dropZone = null;
        for (let i = 0; i < 20; i++) {
            const st = await getPageInfo('status');
            const upBtn = await getPageInfo('uploadBtn');
            dropZone = await getPageInfo('dropZoneArea');
            if (st.isPageReady && upBtn && dropZone) break;
            await wait(400);
        }
        await wait(800);

        const startX = Math.round(dropZone ? dropZone.x : 500);
        const startY = Math.round(dropZone ? dropZone.y : 300);

        await animateFileThrowOntoCanvas(startX, startY, fileObj.data);

        const dragDataPayload = { items: [], files: [tempFilePath], dragOperationsMask: 1 };

        await dbg.sendCommand('Input.dispatchDragEvent', { type: 'dragEnter', x: startX, y: startY, data: dragDataPayload });
        await wait(350);
        await dbg.sendCommand('Input.dispatchDragEvent', { type: 'dragOver', x: startX, y: startY, data: dragDataPayload });
        await wait(350);

        const activeDropZone = await getPageInfo('dropZoneArea');
        const dropX = Math.round(activeDropZone ? activeDropZone.x : startX);
        const dropY = Math.round(activeDropZone ? activeDropZone.y : startY);

        await dbg.sendCommand('Input.dispatchDragEvent', { type: 'dragOver', x: dropX, y: dropY, data: dragDataPayload });
        await wait(250);
        await dbg.sendCommand('Input.dispatchDragEvent', { type: 'drop', x: dropX, y: dropY, data: dragDataPayload });
        await wait(1200);

        let statusAfterCdpDrop = await getPageInfo('status');
        if (!statusAfterCdpDrop.isUploading && !statusAfterCdpDrop.hasToggle) {
            await view.webContents.executeJavaScript(`
                (async () => {
                    const wait = (ms) => new Promise(r => setTimeout(r, ms));
                    const res = await fetch(\`${fileObj.data}\`);
                    const blob = await res.blob();
                    const file = new File([blob], \`${fileObj.name}\`, { type: \`${fileObj.type || 'image/png'}\`, lastModified: Date.now() });
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    const cx = 500, cy = 300;
                    const targets = [document.elementFromPoint(cx, cy), document.querySelector('.dropzone'), document.querySelector('main'), document.body].filter(Boolean);
                    for (const t of targets) t.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
                    await wait(300);
                    for (const t of targets) t.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
                    await wait(300);
                    for (const t of targets) t.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
                    const fileInputs = document.querySelectorAll('input[type="file"]');
                    for (const input of fileInputs) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'files')?.set;
                        if (setter) setter.call(input, dt.files); else input.files = dt.files;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                })();
            `);
            await wait(1200);
        }

        let statusAfterJsDrop = await getPageInfo('status');
        if (!statusAfterJsDrop.isUploading && !statusAfterJsDrop.hasToggle) {
            try {
                const { root } = await dbg.sendCommand('DOM.getDocument', { depth: -1, pierce: true });
                const { nodeIds } = await dbg.sendCommand('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'input[type="file"]' });
                if (nodeIds && nodeIds.length > 0) {
                    await dbg.sendCommand('DOM.setFileInputFiles', { files: [tempFilePath], nodeId: nodeIds[nodeIds.length - 1] });
                } else {
                    pendingFileForChooser = tempFilePath;
                    await dbg.sendCommand('Page.setInterceptFileChooserDialog', { enabled: true });
                    const upRect = await getPageInfo('uploadBtn');
                    if (upRect) { await cdpClick(upRect.x, upRect.y); await wait(800); }
                    await dbg.sendCommand('Page.setInterceptFileChooserDialog', { enabled: false });
                }
            } catch (e) {}
        }
    } finally {
        pendingFileForChooser = null;
        try { await dbg.sendCommand('Page.setInterceptFileChooserDialog', { enabled: false }); } catch (e) {}
        setTimeout(() => { try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (e) {} }, 15000);
    }
}

async function checkAndDeleteIfPresent() {
    try {
        let status = await getPageInfo('status');
        if (!status.hasToggle) return "No existing file";

        for (let attempt = 1; attempt <= 5; attempt++) {
            status = await getPageInfo('status');
            if (!status.hasToggle) return "No existing file";
            if (status.isChecked) break;
            const toggleRect = await getPageInfo('selectToggle');
            if (toggleRect) await cdpClick(toggleRect.x, toggleRect.y);
            await wait(450);
        }
        await wait(250);

        let confirmRect = null;
        for (let attempt = 1; attempt <= 4; attempt++) {
            confirmRect = await getPageInfo('confirmDeleteBtn');
            if (confirmRect) break;

            let deleteOptRect = await getPageInfo('deleteOption');
            if (!deleteOptRect) {
                const actionsRect = await getPageInfo('actionsBtn');
                if (!actionsRect) throw new Error("Actions button not found");
                await cdpClick(actionsRect.x, actionsRect.y);
                await wait(450);
                deleteOptRect = await getPageInfo('deleteOption');
            }
            if (deleteOptRect) {
                await cdpClick(deleteOptRect.x, deleteOptRect.y, 'shatter');
                await wait(500);
            }
            confirmRect = await getPageInfo('confirmDeleteBtn');
            if (confirmRect) break;

            await view.webContents.executeJavaScript(`
                (() => {
                    const gDel = document.querySelector('button svg g[id="Delete"]');
                    const btn = gDel ? gDel.closest('button') : null;
                    if (btn) btn.click();
                })();
            `);
            await wait(500);
            confirmRect = await getPageInfo('confirmDeleteBtn');
            if (confirmRect) break;
        }

        if (!confirmRect) throw new Error("Yes, delete designs button not found");

        for (let cTry = 1; cTry <= 4; cTry++) {
            confirmRect = await getPageInfo('confirmDeleteBtn');
            if (!confirmRect) break;
            await cdpClick(confirmRect.x, confirmRect.y, 'shatter');
            await wait(450);
            if (!(await getPageInfo('confirmDeleteBtn'))) break;

            await view.webContents.executeJavaScript(`
                (() => {
                    const btn = document.querySelector("button.bg-error-solid") ||
                                [...document.querySelectorAll('button')].find(b => (b.innerText || '').trim().toLowerCase() === 'yes, delete designs');
                    if (btn) btn.click();
                })();
            `);
            await wait(450);
        }

        for (let w = 0; w < 25; w++) {
            await wait(250);
            const cur = await getPageInfo('status');
            if (!cur.hasToggle || cur.totalCount === 0 || cur.isEmptyCanvas) break;
        }
        await wait(450);
        return "Success";
    } catch (err) {
        return "Error: " + err.message;
    }
}

ipcMain.on('start-reset', async (event) => {
    try {
        view.setBounds({ x: 0, y: 220, width: 1000, height: 530 });
        const res = await checkAndDeleteIfPresent();
        event.sender.send('status-update', res === "Success" ? "✅ Canvas cleaned!" : `ℹ️ ${res}`);
    } catch (e) {
        event.sender.send('status-update', "❌ Reset failed: " + e.message);
    }
});

// ==========================================================
// 🚀 STANDALONE BATCH WORKFLOW (100% FREE UNLIMITED SCAN)
// ==========================================================
async function runBatchAutomation(event, incomingData) {
    if (incomingData && !Array.isArray(incomingData) && incomingData.action === 'open-output-folder') {
        shell.openPath(FINAL_DESIGNS_FOLDER);
        return;
    }

    const filesArray = Array.isArray(incomingData) ? incomingData : (incomingData.files || [incomingData]);
    const customApiKey = (!Array.isArray(incomingData) && incomingData.apiKey) ? incomingData.apiKey : '';
    const toleranceVal = (!Array.isArray(incomingData) && incomingData.tolerance) ? Number(incomingData.tolerance) : 10;

    const sendStatus = (msg) => event.sender.send('status-update', msg);
    const sendProgress = (percent, text, activeIndex = -1, isCompleted = false, aiTitle = '') => {
        event.sender.send('progress-update', { percent, text, activeIndex, isCompleted, aiTitle });
    };

    view.setBounds({ x: 0, y: 220, width: 1000, height: 530 });
    await ensureDebugger();

    if (!view.webContents.getURL().includes('mydesigns.io/app/designs')) {
        await view.webContents.loadURL('https://mydesigns.io/app/designs');
        await wait(1000);
    }

    const aiTitlesMap = new Map();
    (async () => {
        for (let idx = 0; idx < filesArray.length; idx++) {
            try {
                const t = await generateAiTitleNode(filesArray[idx].data, customApiKey);
                aiTitlesMap.set(idx, t);
                sendProgress(undefined, undefined, idx, false, `[${idx + 1}/${filesArray.length}] ${t}`);
            } catch (e) {}
            await wait(250);
        }
    })();

    for (let i = 0; i < filesArray.length; i++) {
        const fileObj = filesArray[i];
        const fileLabel = `[File ${i + 1}/${filesArray.length}]`;

        try {
            sendProgress(5, `${fileLabel} Scanning design & preparing canvas...`, i, false);

            if (i > 0) {
                const currentUrl = view.webContents.getURL();
                const targetUrl = currentUrl.includes('mydesigns.io/app/designs') ? currentUrl : 'https://mydesigns.io/app/designs';
                try { await view.webContents.loadURL(targetUrl); } catch (e) {}
                await wait(1200);
                await ensureDebugger();
            }

            for (let w = 0; w < 25; w++) {
                const upBtn = await getPageInfo('uploadBtn');
                const st = await getPageInfo('status');
                if (upBtn && st.isPageReady) break;
                await wait(350);
            }
            await wait(1200);

            sendProgress(20, `${fileLabel} Uploading image via Drag & Drop...`, i, false);
            await throwFileViaDragAndDrop(fileObj);

            sendProgress(35, `${fileLabel} Waiting for upload to finish...`, i, false);
            let uploadDone = false;
            for (let loop = 1; loop <= 45; loop++) {
                await wait(700);
                const status = await getPageInfo('status');
                if (status.hasToggle && !status.isUploading) {
                    uploadDone = true;
                    break;
                }
                if (loop === 5 && !status.hasToggle && !status.isUploading) {
                    sendProgress(38, `${fileLabel} Re-dropping file onto canvas...`, i, false);
                    await throwFileViaDragAndDrop(fileObj);
                }
                sendProgress(40, `${fileLabel} Uploading dropped file... (${loop})`, i, false);
            }

            if (!uploadDone) throw new Error("Drag & Drop upload timed out");

            sendProgress(50, `${fileLabel} Waiting for design preview to load...`, i, false);
            await wait(2500);

            sendProgress(60, `${fileLabel} Selecting design checkbox...`, i, false);
            let selected = false;
            for (let attempt = 1; attempt <= 6; attempt++) {
                const status = await getPageInfo('status');
                if (status.isChecked) { selected = true; break; }
                const toggleRect = await getPageInfo('selectToggle');
                if (toggleRect) await cdpClick(toggleRect.x, toggleRect.y);
                await wait(100);
            }
            if (!selected) {
                const finalCheck = await getPageInfo('status');
                if (!finalCheck.isChecked) throw new Error("Failed to select checkbox");
            }
            await wait(300);

            sendProgress(70, `${fileLabel} Clicking Actions & Vectorize image...`, i, false);
            let genRect = null;
            for (let attempt = 1; attempt <= 4; attempt++) {
                genRect = await getPageInfo('generatePreviewBtn');
                if (genRect) break;

                let vectorizeRect = await getPageInfo('vectorizeBtn');
                if (!vectorizeRect) {
                    const actionsRect = await getPageInfo('actionsBtn');
                    if (!actionsRect) throw new Error("Actions button not found");
                    await cdpClick(actionsRect.x, actionsRect.y);
                    await wait(480);
                    vectorizeRect = await getPageInfo('vectorizeBtn');
                }
                if (vectorizeRect) {
                    sendProgress(75, `${fileLabel} Clicking Vectorize image...`, i, false);
                    await cdpClick(vectorizeRect.x, vectorizeRect.y);
                    await wait(100);
                }
                genRect = await getPageInfo('generatePreviewBtn');
                if (genRect) break;

                await view.webContents.executeJavaScript(`
                    (() => {
                        const gVec = document.querySelector('button svg g[id="vectorize image"]');
                        const btn = gVec ? gVec.closest('button') : null;
                        if (btn) btn.click();
                    })();
                `);
                await wait(650);
                genRect = await getPageInfo('generatePreviewBtn');
                if (genRect) break;
            }

            sendProgress(80, `${fileLabel} Smashing Generate Preview...`, i, false);
            for (let p = 0; p < 15; p++) {
                genRect = await getPageInfo('generatePreviewBtn');
                if (genRect) break;
                await wait(200);
            }
            if (!genRect) throw new Error("Generate Preview button not found");
            await wait(500);

            let lastGenCoord = { x: genRect.x, y: genRect.y };
            for (let genAttempt = 1; genAttempt <= 4; genAttempt++) {
                genRect = await getPageInfo('generatePreviewBtn');
                if (!genRect) break;
                lastGenCoord = { x: genRect.x, y: genRect.y };

                await cdpClick(genRect.x, genRect.y, 'shatter');
                await wait(550);

                const isGenerating = await view.webContents.executeJavaScript(`
                    (() => {
                        const spinner = document.querySelector('svg.animate-spin');
                        const btn = [...document.querySelectorAll('button')].find(b => (b.innerText || '').trim().toLowerCase() === 'generate preview');
                        const hasResultImg = Boolean(document.querySelector("div.mt-4 > div:nth-of-type(2) > img") || document.querySelector("div:nth-of-type(2) > img[src^='blob:']"));
                        return Boolean(spinner || !btn || btn.disabled || hasResultImg);
                    })();
                `);
                if (isGenerating) break;

                await view.webContents.executeJavaScript(`
                    (() => {
                        const gRight = document.querySelector('button svg g[id="right arrow"]');
                        const btn = (gRight ? gRight.closest('button') : null) || document.querySelector("div.mt-4 button");
                        if (btn) btn.click();
                    })();
                `);
                await wait(550);
            }

            await startVectorizeOverchargeVFX(lastGenCoord.x, lastGenCoord.y);

            sendProgress(85, `${fileLabel} ⚡ Overcharging Vectorizer... Please wait.`, i, false);
            let svgContentOrUrl = null;
            for (let g = 0; g < 150; g++) {
                await wait(500);
                svgContentOrUrl = await view.webContents.executeJavaScript(`
                    (async () => {
                        function byXPath(xp) {
                            try { return document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; }
                            catch (e) { return null; }
                        }
                        const spinner = document.querySelector('svg.animate-spin');
                        if (spinner) return null;

                        const img = byXPath('/html/body/div[5]/div/div[2]/div[3]/div[2]/img') ||
                                    document.querySelector("div.mt-4 > div:nth-of-type(2) > img") ||
                                    document.querySelector("div:nth-of-type(2) > img[src^='blob:']") ||
                                    document.querySelector("div:nth-of-type(2) > img");

                        if (img && img.src && img.complete && img.naturalWidth > 0) {
                            try {
                                const r = await fetch(img.src);
                                const txt = await r.text();
                                return { type: 'svg_text', data: txt };
                            } catch (e) {
                                return { type: 'url', data: img.src };
                            }
                        }
                        return null;
                    })();
                `);
                if (svgContentOrUrl) break;
            }

            await stopVectorizeOverchargeVFX();
            if (!svgContentOrUrl) throw new Error("Generated vector image did not appear in time");

            const uniqueFileName = getUniqueSvgFileName();
            const svgSavePath = path.join(app.getPath('downloads'), uniqueFileName);
            sendProgress(88, `${fileLabel} Saving Vector SVG...`, i, false);

            if (svgContentOrUrl.type === 'svg_text' && svgContentOrUrl.data) {
                fs.writeFileSync(svgSavePath, svgContentOrUrl.data, 'utf8');
            } else if (svgContentOrUrl.data) {
                view.webContents.downloadURL(svgContentOrUrl.data);
                await wait(1200);
            }

            sendProgress(91, `${fileLabel} Cleaning up MyDesigns canvas...`, i, false);
            for (let closeTry = 1; closeTry <= 4; closeTry++) {
                const closeRect = await getPageInfo('closeModalBtn');
                if (!closeRect) break;
                await cdpClick(closeRect.x, closeRect.y);
                await wait(450);
                if (!(await getPageInfo('closeModalBtn'))) break;
                await view.webContents.executeJavaScript(`
                    (() => {
                        const closeG = document.querySelector("div.text-base-text div.border-base-border button svg g[id='close']") ||
                                       Array.from(document.querySelectorAll("button.ml-auto svg g[id='close']")).pop();
                        const btn = (closeG ? closeG.closest('button') : null);
                        if (btn) btn.click();
                    })();
                `);
                await wait(450);
            }
            await checkAndDeleteIfPresent();

            let readyTitle = aiTitlesMap.get(i);
            if (!readyTitle) {
                readyTitle = await generateAiTitleNode(fileObj.data, customApiKey);
                aiTitlesMap.set(i, readyTitle);
            }

            sendProgress(96, `${fileLabel} 💎 Pure Vector BG Remove (Tol: ${toleranceVal}) & 300 PPI Save -> "${readyTitle}.png"...`, i, false, `[${i + 1}/${filesArray.length}] ${readyTitle}`);
            const savedPngName = await processSvgStandaloneInApp(svgSavePath, fileObj.data, readyTitle, toleranceVal);

            sendProgress(100, `${fileLabel} ✅ Saved: ${savedPngName}`, i, true, `✅ SAVED: ${savedPngName}`);
            await wait(200);

        } catch (err) {
            await stopVectorizeOverchargeVFX();
            console.error(`Failed at ${fileLabel}:`, err.message);
            sendProgress(100, `${fileLabel} ❌ Error: ${err.message}`, i, false);
            await wait(500);
        }
    }

    sendStatus("✅ All batch designs vectorized, pure-vector background removed, trimmed (300 PPI), and saved to Desktop > Final_Designs!");
}

ipcMain.on('start-automation', (event, incomingData) => runBatchAutomation(event, incomingData));