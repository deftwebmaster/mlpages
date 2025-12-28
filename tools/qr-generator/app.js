// QR Code Generator - Privacy First
// All processing happens client-side

class QRGenerator {
    constructor() {
        this.canvas = document.getElementById('qr-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.centerImage = null;
        this.selectedEmoji = null;
        
        // Theme definitions
        this.themes = {
            christmas: {
                qrColor: '#c41e3a',
                bgColor: '#ffffff',
                emojis: ['🎄', '🎅', '⛄', '🎁', '🔔', '⭐', '❄️', '🤶', '🦌', '🕯️', '🧦', '🎀']
            },
            winter: {
                qrColor: '#0ea5e9',
                bgColor: '#f0f9ff',
                emojis: ['❄️', '⛄', '🌨️', '☃️', '🧊', '🎿', '⛷️', '🏔️', '🧣', '🧤', '☕', '🍫']
            },
            newyear: {
                qrColor: '#fbbf24',
                bgColor: '#1e1b4b',
                emojis: ['🎉', '🎊', '🥂', '🍾', '🎆', '🎇', '✨', '🌟', '🎈', '🎀', '🪩', '💫']
            },
            valentine: {
                qrColor: '#ec4899',
                bgColor: '#fef2f2',
                emojis: ['💝', '💖', '💕', '💗', '💓', '💞', '💘', '❤️', '🌹', '💐', '🍫', '💌']
            },
            halloween: {
                qrColor: '#f97316',
                bgColor: '#1c1917',
                emojis: ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀', '🧙', '🧛', '🧟', '🍬', '🍭', '🌙']
            },
            minimal: {
                qrColor: '#000000',
                bgColor: '#ffffff',
                emojis: ['⚫', '⚪', '🔲', '🔳', '◾', '◽', '▪️', '▫️', '⬛', '⬜', '🖤', '🤍']
            },
            custom: {
                qrColor: '#000000',
                bgColor: '#ffffff',
                emojis: ['😀', '🎨', '🌈', '⭐', '💎', '🔥', '💡', '🎯', '🚀', '🌟', '✨', '💫']
            }
        };
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadEmojiPicker('custom');
    }

    initializeElements() {
        this.elements = {
            textInput: document.getElementById('qr-text'),
            errorLevel: document.getElementById('error-level'),
            qrSize: document.getElementById('qr-size'),
            qrColor: document.getElementById('qr-color'),
            bgColor: document.getElementById('bg-color'),
            themeSelect: document.getElementById('theme-select'),
            emojiTab: document.getElementById('emoji-tab'),
            uploadTab: document.getElementById('upload-tab'),
            emojiPickerSection: document.getElementById('emoji-picker-section'),
            uploadSection: document.getElementById('upload-section'),
            emojiGrid: document.getElementById('emoji-grid'),
            centerImageInput: document.getElementById('center-image'),
            imageSizeSlider: document.getElementById('image-size'),
            imageSizeValue: document.getElementById('image-size-value'),
            clearImageBtn: document.getElementById('clear-image'),
            generateBtn: document.getElementById('generate-btn'),
            downloadBtn: document.getElementById('download-btn'),
            placeholder: document.getElementById('placeholder')
        };
    }

    attachEventListeners() {
        this.elements.generateBtn.addEventListener('click', () => this.generate());
        this.elements.downloadBtn.addEventListener('click', () => this.download());
        this.elements.centerImageInput.addEventListener('change', (e) => this.loadImage(e));
        this.elements.clearImageBtn.addEventListener('click', () => this.clearImage());
        this.elements.imageSizeSlider.addEventListener('input', (e) => {
            this.elements.imageSizeValue.textContent = `${e.target.value}%`;
        });

        // Theme selector
        this.elements.themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            this.applyTheme(theme);
        });

        // Tab switching
        this.elements.emojiTab.addEventListener('click', () => {
            this.switchTab('emoji');
        });
        this.elements.uploadTab.addEventListener('click', () => {
            this.switchTab('upload');
        });

        // Generate on Enter key in textarea
        this.elements.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generate();
            }
        });
    }

    loadImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.centerImage = img;
                this.elements.clearImageBtn.style.display = 'inline-block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    clearImage() {
        this.centerImage = null;
        this.elements.centerImageInput.value = '';
        this.elements.clearImageBtn.style.display = 'none';
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        // Update color inputs
        this.elements.qrColor.value = theme.qrColor;
        this.elements.bgColor.value = theme.bgColor;

        // Reload emoji picker with theme emojis
        this.loadEmojiPicker(themeName);
    }

    loadEmojiPicker(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        this.elements.emojiGrid.innerHTML = '';
        
        theme.emojis.forEach(emoji => {
            const emojiBtn = document.createElement('div');
            emojiBtn.className = 'emoji-option';
            emojiBtn.textContent = emoji;
            emojiBtn.addEventListener('click', () => this.selectEmoji(emoji, emojiBtn));
            this.elements.emojiGrid.appendChild(emojiBtn);
        });
    }

    selectEmoji(emoji, element) {
        // Clear previous selection
        this.elements.emojiGrid.querySelectorAll('.emoji-option').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new emoji
        element.classList.add('selected');
        this.selectedEmoji = emoji;
        
        // Clear uploaded image when emoji is selected
        this.centerImage = null;
        this.elements.centerImageInput.value = '';
        this.elements.clearImageBtn.style.display = 'none';
    }

    switchTab(tab) {
        if (tab === 'emoji') {
            this.elements.emojiTab.classList.add('active');
            this.elements.uploadTab.classList.remove('active');
            this.elements.emojiPickerSection.style.display = 'block';
            this.elements.uploadSection.style.display = 'none';
        } else {
            this.elements.emojiTab.classList.remove('active');
            this.elements.uploadTab.classList.add('active');
            this.elements.emojiPickerSection.style.display = 'none';
            this.elements.uploadSection.style.display = 'block';
            
            // Clear emoji selection when switching to upload
            this.selectedEmoji = null;
            this.elements.emojiGrid.querySelectorAll('.emoji-option').forEach(el => {
                el.classList.remove('selected');
            });
        }
    }

    generate() {
        const text = this.elements.textInput.value.trim();
        if (!text) {
            alert('Please enter some content to encode');
            return;
        }

        try {
            // Get settings
            const size = parseInt(this.elements.qrSize.value);
            const qrColor = this.elements.qrColor.value;
            const bgColor = this.elements.bgColor.value;
            const errorLevel = this.elements.errorLevel.value;

            // Create temporary container for QR generation
            const tempDiv = document.createElement('div');
            const qr = new QRCode(tempDiv, {
                text: text,
                width: size,
                height: size,
                colorDark: qrColor,
                colorLight: bgColor,
                correctLevel: QRCode.CorrectLevel[errorLevel]
            });

            // Wait for QR to render, then copy to canvas
            setTimeout(() => {
                const qrImg = tempDiv.querySelector('img');
                if (qrImg && qrImg.complete) {
                    this.renderToCanvas(qrImg, size);
                } else if (qrImg) {
                    qrImg.onload = () => this.renderToCanvas(qrImg, size);
                }
            }, 100);

        } catch (error) {
            console.error('QR generation failed:', error);
            alert('Failed to generate QR code. Please check your input.');
        }
    }

    renderToCanvas(qrImg, size) {
        // Set canvas dimensions
        this.canvas.width = size;
        this.canvas.height = size;

        // Draw QR code
        this.ctx.drawImage(qrImg, 0, 0, size, size);

        // Draw center image or emoji
        if (this.centerImage) {
            this.drawCenterImage(size);
        } else if (this.selectedEmoji) {
            this.drawCenterEmoji(size);
        }

        // Show canvas and download button
        this.canvas.classList.add('visible');
        this.elements.placeholder.style.display = 'none';
        this.elements.downloadBtn.style.display = 'block';
    }

    getErrorCorrectionLevel() {
        const level = this.elements.errorLevel.value;
        const levels = {
            'L': qrcodegen.QrCode.Ecc.LOW,
            'M': qrcodegen.QrCode.Ecc.MEDIUM,
            'Q': qrcodegen.QrCode.Ecc.QUARTILE,
            'H': qrcodegen.QrCode.Ecc.HIGH
        };
        return levels[level];
    }

    renderQRCode(qr, canvasSize) {
        const qrSize = qr.size;
        const scale = canvasSize / qrSize;
        
        // Set canvas dimensions
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;

        // Get colors
        const qrColor = this.elements.qrColor.value;
        const bgColor = this.elements.bgColor.value;

        // Fill background
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw QR modules
        this.ctx.fillStyle = qrColor;
        for (let y = 0; y < qrSize; y++) {
            for (let x = 0; x < qrSize; x++) {
                if (qr.getModule(x, y)) {
                    this.ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }

        // Draw center image if available
        if (this.centerImage) {
            this.drawCenterImage(canvasSize);
        }
    }

    drawCenterImage(canvasSize) {
        const imagePercent = parseInt(this.elements.imageSizeSlider.value);
        const imageSize = (canvasSize * imagePercent) / 100;
        const x = (canvasSize - imageSize) / 2;
        const y = (canvasSize - imageSize) / 2;

        // Create circular clipping path
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(canvasSize / 2, canvasSize / 2, imageSize / 2, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.clip();

        // Draw white background circle
        this.ctx.fillStyle = 'white';
        this.ctx.fill();

        // Draw image
        this.ctx.drawImage(this.centerImage, x, y, imageSize, imageSize);
        this.ctx.restore();

        // Draw border around image
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.arc(canvasSize / 2, canvasSize / 2, imageSize / 2, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawCenterEmoji(canvasSize) {
        const imagePercent = parseInt(this.elements.imageSizeSlider.value);
        const circleSize = (canvasSize * imagePercent) / 100;
        const radius = circleSize / 2;
        
        // Draw white background circle (smaller border)
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(canvasSize / 2, canvasSize / 2, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw emoji larger - fills 85% of the circle instead of 70%
        const fontSize = circleSize * 0.85;
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.selectedEmoji, canvasSize / 2, canvasSize / 2);

        // Draw thinner border around circle (3px instead of 6px)
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(canvasSize / 2, canvasSize / 2, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    download() {
        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new QRGenerator();
});
