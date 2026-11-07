const selectFileBtn = document.getElementById('selectFileBtn');
const fileInput = document.getElementById('fileInput');
const startBtn = document.getElementById('startBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const toggleViewBtn = document.getElementById('toggleViewBtn');
const openOutputsBtn = document.getElementById('openOutputsBtn');
const aiSettingsBtn = document.getElementById('aiSettingsBtn');
const aiSettingsModal = document.getElementById('aiSettingsModal');
const saveAiSettingsBtn = document.getElementById('saveAiSettingsBtn');
const closeAiSettingsBtn = document.getElementById('closeAiSettingsBtn');
const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
const wandToleranceInput = document.getElementById('wandToleranceInput');
const aiTitleBanner = document.getElementById('aiTitleBanner');

const controls = document.getElementById('controls');
const progressWrapper = document.getElementById('progressWrapper');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const percentText = document.getElementById('percentText');

const refreshGalleryBtn = document.getElementById('refreshGalleryBtn');
const galleryGrid = document.getElementById('galleryGrid');
const galleryContainer = document.getElementById('galleryContainer');

const filePreviewBox = document.getElementById('filePreviewBox');
const processingPreviewContainer = document.getElementById('processingPreviewContainer');
const processingImage = document.getElementById('processingImage');
const scannerLine = document.getElementById('scannerLine');
const glassCard = document.querySelector('.glass-card');
const hudClock = document.getElementById('hudClock');

let selectedFiles = [];
let fileIdCounter = 0;
let isViewVisible = false;

// Load saved AI Key & Tolerance from localStorage
if (geminiApiKeyInput) geminiApiKeyInput.value = localStorage.getItem('mydesigns_gemini_key') || '';
if (wandToleranceInput) wandToleranceInput.value = localStorage.getItem('mydesigns_wand_tol') || '10';

if (openOutputsBtn) {
    openOutputsBtn.addEventListener('click', () => {
        window.api.startTask({ action: 'open-output-folder' });
    });
}

if (aiSettingsBtn) {
    aiSettingsBtn.addEventListener('click', () => {
        aiSettingsModal.style.display = 'flex';
    });
}
if (closeAiSettingsBtn) {
    closeAiSettingsBtn.addEventListener('click', () => {
        aiSettingsModal.style.display = 'none';
    });
}
if (saveAiSettingsBtn) {
    saveAiSettingsBtn.addEventListener('click', () => {
        localStorage.setItem('mydesigns_gemini_key', geminiApiKeyInput.value.trim());
        localStorage.setItem('mydesigns_wand_tol', wandToleranceInput.value.trim() || '10');
        aiSettingsModal.style.display = 'none';
        if (aiTitleBanner) {
            aiTitleBanner.innerText = '✅ AI KEY & TOLERANCE SAVED!';
            setTimeout(() => {
                aiTitleBanner.innerText = '🧠 AI TITLE + GHOST ILLUSTRATOR + 5000px TRIM: READY';
            }, 2500);
        }
    });
}

// ==========================================================
// ⏱️ LIVE DIGITAL CLOCK
// ==========================================================
function updateHudClock() {
    if (!hudClock) return;
    const now = new Date();
    hudClock.innerText = `TELEMETRY // ${now.toTimeString().split(' ')[0]}`;
}
setInterval(updateHudClock, 1000);
updateHudClock();

// ==========================================================
// 🌐 WEBSITE VIEW TOGGLE & QUEUE LOGIC
// ==========================================================
function setWebsiteViewMode(visible) {
    isViewVisible = visible;
    document.body.classList.toggle('view-active', isViewVisible);
    toggleViewBtn.innerText = isViewVisible ? "🙈 Hide Website" : "🌐 Website";
    window.api.toggleView(isViewVisible);
}

toggleViewBtn.addEventListener('click', () => {
    setWebsiteViewMode(!isViewVisible);
});

selectFileBtn.addEventListener('click', () => fileInput.click());

clearAllBtn.addEventListener('click', () => {
    selectedFiles = [];
    filePreviewBox.innerHTML = '';
    updateQueueText();
});

function updateQueueText() {
    let textEl = document.getElementById('previewCountText');
    if (!textEl) {
        textEl = document.createElement('span');
        textEl.id = 'previewCountText';
        textEl.style.color = '#38bdf8';
        textEl.style.fontSize = '12px';
        textEl.style.fontWeight = '700';
        textEl.style.letterSpacing = '1px';
        textEl.style.width = '100%';
        textEl.style.marginTop = '4px';
        filePreviewBox.appendChild(textEl);
    }

    textEl.innerText = `⚡ ${selectedFiles.length} TARGETS LOCKED IN QUEUE`;

    if (selectedFiles.length === 0) {
        filePreviewBox.style.display = 'none';
        startBtn.disabled = true;
        clearAllBtn.style.display = 'none';
    } else {
        filePreviewBox.style.display = 'flex';
        startBtn.disabled = false;
        clearAllBtn.style.display = 'inline-block';
    }
}

async function processSelectedFiles(filesArray) {
    if (filesArray.length > 0) {
        const existingText = document.getElementById('previewCountText');
        if (existingText) existingText.remove();

        const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));

        for (let file of imageFiles) {
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.readAsDataURL(file);
            });

            const currentId = 'thumb-' + fileIdCounter++;

            selectedFiles.push({ id: currentId, name: file.name, type: file.type, data: base64 });

            const wrapper = document.createElement('div');
            wrapper.className = 'thumb-wrapper';
            wrapper.id = 'wrapper-' + currentId;

            const img = document.createElement('img');
            img.src = base64;
            img.title = file.name;

            const delBtn = document.createElement('div');
            delBtn.className = 'delete-btn';
            delBtn.innerText = '✖';
            delBtn.title = "Remove from queue";

            const checkmark = document.createElement('div');
            checkmark.className = 'checkmark';
            checkmark.innerText = '✅';

            delBtn.onclick = () => {
                selectedFiles = selectedFiles.filter(f => f.id !== currentId);
                wrapper.remove();
                updateQueueText();
            };

            wrapper.appendChild(img);
            wrapper.appendChild(checkmark);
            wrapper.appendChild(delBtn);
            filePreviewBox.appendChild(wrapper);
        }
        updateQueueText();
    }
}

fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    await processSelectedFiles(files);
    fileInput.value = '';
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    glassCard.addEventListener(eventName, () => {
        glassCard.classList.add('drag-over');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    glassCard.addEventListener(eventName, () => {
        glassCard.classList.remove('drag-over');
    }, false);
});

glassCard.addEventListener('drop', async (e) => {
    const files = Array.from(e.dataTransfer.files);
    await processSelectedFiles(files);
});

// ==========================================================
// 🚀 WORKFLOW LOGIC (CONNECTED TO main.js)
// ==========================================================
refreshGalleryBtn.addEventListener('click', () => {
    galleryGrid.innerHTML = '<p style="font-size: 12px; color: #38bdf8; text-align: center; grid-column: 1 / -1; margin: 22px 0;">✨ Scanning active designs on canvas...</p>';
    window.api.refreshGallery();
});

window.api.onGalleryData((images) => {
    galleryGrid.innerHTML = '';
    if (images.length === 0) {
        galleryGrid.innerHTML = '<p style="font-size: 12px; color: #ef4444; text-align: center; grid-column: 1 / -1; margin: 22px 0;">No active designs detected on canvas.</p>';
        return;
    }
    images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        galleryGrid.appendChild(img);
    });
});

function startProcessMode(title, isVectorize) {
    controls.style.display = 'none';
    galleryContainer.style.display = 'none';

    document.querySelectorAll('.delete-btn').forEach(btn => btn.style.display = 'none');

    progressWrapper.style.display = 'block';
    progressBar.style.width = '0%';
    percentText.innerText = '0%';
    progressText.innerText = title;
    progressText.style.color = '#38bdf8';
    scannerLine.style.background = 'linear-gradient(90deg, transparent, #38bdf8, #ffffff, #38bdf8, transparent)';

    if (isVectorize && selectedFiles.length > 0) {
        processingImage.src = selectedFiles[0].data;
        processingPreviewContainer.style.display = 'flex';
    } else {
        processingPreviewContainer.style.display = 'none';
    }

    setWebsiteViewMode(true);
}

startBtn.addEventListener('click', () => {
    if (selectedFiles.length === 0) return;
    startProcessMode("⚡ INITIALIZING FULL AUTO POD PIPELINE...", true);
    const savedApiKey = localStorage.getItem('mydesigns_gemini_key') || '';
    const savedTol = Number(localStorage.getItem('mydesigns_wand_tol') || '10');
    window.api.startTask({
        files: selectedFiles,
        apiKey: savedApiKey,
        tolerance: savedTol
    });
});

window.api.onProgressUpdate((data) => {
    if (data.aiTitle && aiTitleBanner) {
        aiTitleBanner.innerText = `📌 AI TITLE: ${data.aiTitle}`;
    }
    if (data.percent !== undefined) {
        progressBar.style.width = data.percent + '%';
        percentText.innerText = data.percent + '%';
    }
    if (data.text !== undefined) {
        progressText.innerText = data.text;
    }

    if (data.activeIndex !== undefined && data.activeIndex >= 0) {
        const activeFile = selectedFiles[data.activeIndex];

        if (activeFile) {
            processingImage.src = activeFile.data;

            if (data.isCompleted) {
                const thumbWrapper = document.getElementById('wrapper-' + activeFile.id);
                if (thumbWrapper) {
                    thumbWrapper.classList.add('completed');
                }

                const countText = document.getElementById('previewCountText');
                if (countText) {
                    const remaining = selectedFiles.length - (data.activeIndex + 1);
                    if (remaining > 0) {
                        countText.innerText = `⏳ ${remaining} TARGETS REMAINING...`;
                    } else {
                        countText.innerText = `🎉 ALL TARGETS COMPLETED & SAVED!`;
                    }
                }
            }
        }
    }
});

window.api.onStatusUpdate((message) => {
    if (message.includes("✅") || message.includes("❌")) {
        progressText.innerText = message;
        progressText.style.color = message.includes("✅") ? '#38bdf8' : '#ef4444';

        setTimeout(() => {
            selectedFiles = [];
            filePreviewBox.innerHTML = '';
            filePreviewBox.style.display = 'none';
            startBtn.disabled = true;
            clearAllBtn.style.display = 'none';

            controls.style.display = 'flex';
            toggleViewBtn.style.display = 'inline-block';
            progressWrapper.style.display = 'none';
            processingPreviewContainer.style.display = 'none';
            galleryContainer.style.display = 'flex';
            setWebsiteViewMode(false);
            window.api.refreshGallery();
        }, 3500);
    }
});