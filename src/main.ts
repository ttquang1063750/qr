import { renderQRCanvas, generateQRSvg, QRConfig } from './qr-renderer';
import './styles/main.scss';

// DOM Elements query
const qrTextInput = document.getElementById('qrText') as HTMLTextAreaElement;
const dotStyleCards = document.querySelectorAll('#dotStyleGrid .option-card');
const eyeFrameCards = document.querySelectorAll('#eyeFrameGrid .option-card');
const eyeBallCards = document.querySelectorAll('#eyeBallGrid .option-card');
const colorTypeCards = document.querySelectorAll('#colorTypeGrid .option-card');

const frameStyleCards = document.querySelectorAll('#frameStyleGrid .option-card');
const frameSettingsPanel = document.getElementById('frameSettings') as HTMLDivElement;
const frameColorInput = document.getElementById('frameColor') as HTMLInputElement;
const frameWidthInput = document.getElementById('frameWidth') as HTMLInputElement;
const frameWidthVal = document.getElementById('frameWidthVal') as HTMLSpanElement;

const solidColorControl = document.getElementById('solidColorControl') as HTMLDivElement;
const gradientControls = document.getElementById('gradientControls') as HTMLDivElement;
const qrSolidColorInput = document.getElementById('qrSolidColor') as HTMLInputElement;
const qrColor1Input = document.getElementById('qrColor1') as HTMLInputElement;
const qrColor2Input = document.getElementById('qrColor2') as HTMLInputElement;
const gradAngleInput = document.getElementById('gradAngle') as HTMLInputElement;
const gradAngleVal = document.getElementById('gradAngleVal') as HTMLSpanElement;

const customEyeColorToggle = document.getElementById('customEyeColor') as HTMLInputElement;
const eyeColorControls = document.getElementById('eyeColorControls') as HTMLDivElement;
const eyeFrameColorInput = document.getElementById('eyeFrameColor') as HTMLInputElement;
const eyeBallColorInput = document.getElementById('eyeBallColor') as HTMLInputElement;

const transparentBgToggle = document.getElementById('transparentBg') as HTMLInputElement;
const bgColorControl = document.getElementById('bgColorControl') as HTMLDivElement;
const bgColorInput = document.getElementById('bgColor') as HTMLInputElement;

const logoDropZone = document.getElementById('logoDropZone') as HTMLDivElement;
const logoUploadInput = document.getElementById('logoUpload') as HTMLInputElement;
const logoPreviewContainer = document.getElementById('logoPreviewContainer') as HTMLDivElement;
const logoPreviewThumb = document.getElementById('logoPreviewThumb') as HTMLImageElement;
const logoFileName = document.getElementById('logoFileName') as HTMLDivElement;
const logoFileSize = document.getElementById('logoFileSize') as HTMLDivElement;
const removeLogoBtn = document.getElementById('removeLogo') as HTMLButtonElement;
const logoTweakSettings = document.getElementById('logoTweakSettings') as HTMLDivElement;
const logoSizeInput = document.getElementById('logoSize') as HTMLInputElement;
const logoSizeVal = document.getElementById('logoSizeVal') as HTMLSpanElement;
const clearBehindLogoToggle = document.getElementById('clearBehindLogo') as HTMLInputElement;

const labelTopTextInput = document.getElementById('labelTopText') as HTMLTextAreaElement;
const labelTopSettingsPanel = document.getElementById('labelTopSettings') as HTMLDivElement;
const labelTopColorInput = document.getElementById('labelTopColor') as HTMLInputElement;
const fontWeightTopSelect = document.getElementById('fontWeightTop') as HTMLSelectElement;
const labelTopSizeInput = document.getElementById('labelTopSize') as HTMLInputElement;
const labelTopSizeVal = document.getElementById('labelTopSizeVal') as HTMLSpanElement;

const labelTextInput = document.getElementById('labelText') as HTMLTextAreaElement;
const labelSettingsPanel = document.getElementById('labelBottomSettings') as HTMLDivElement;
const labelColorInput = document.getElementById('labelColor') as HTMLInputElement;
const fontWeightSelect = document.getElementById('fontWeight') as HTMLSelectElement;
const labelSizeInput = document.getElementById('labelSize') as HTMLInputElement;
const labelSizeVal = document.getElementById('labelSizeVal') as HTMLSpanElement;

const qrCanvas = document.getElementById('qrCanvas') as HTMLCanvasElement;
const downloadPngBtn = document.getElementById('downloadPng') as HTMLButtonElement;
const downloadJpgBtn = document.getElementById('downloadJpg') as HTMLButtonElement;
const downloadSvgBtn = document.getElementById('downloadSvg') as HTMLButtonElement;

// UI State variables
let selectedDotStyle: 'square' | 'dots' | 'rounded' = 'square';
let selectedEyeFrame: 'square' | 'rounded' | 'circle' = 'square';
let selectedEyeBall: 'square' | 'rounded' | 'circle' = 'square';
let selectedColorType: 'solid' | 'gradient' = 'solid';
let selectedFrameStyle: 'none' | 'square' | 'rounded' | 'circle' = 'none';
let logoImage: HTMLImageElement | null = null;
let logoBase64: string | null = null;

// Tab panel triggers
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    if (tabId) {
      document.getElementById(`tab-${tabId}`)?.classList.add('active');
    }
  });
});

// Setup custom selector clicks
function setupCardSelectors(cards: NodeListOf<Element>, callback: (val: string) => void) {
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const val = card.getAttribute('data-value');
      if (val) callback(val);
    });
  });
}

setupCardSelectors(dotStyleCards, (val) => {
  selectedDotStyle = val as 'square' | 'dots' | 'rounded';
  updateQR();
});

setupCardSelectors(eyeFrameCards, (val) => {
  selectedEyeFrame = val as 'square' | 'rounded' | 'circle';
  updateQR();
});

setupCardSelectors(eyeBallCards, (val) => {
  selectedEyeBall = val as 'square' | 'rounded' | 'circle';
  updateQR();
});

setupCardSelectors(colorTypeCards, (val) => {
  selectedColorType = val as 'solid' | 'gradient';
  if (selectedColorType === 'solid') {
    solidColorControl.style.display = 'block';
    gradientControls.style.display = 'none';
  } else {
    solidColorControl.style.display = 'none';
    gradientControls.style.display = 'block';
  }
  updateQR();
});

setupCardSelectors(frameStyleCards, (val) => {
  selectedFrameStyle = val as 'none' | 'square' | 'rounded' | 'circle';
  frameSettingsPanel.style.display = selectedFrameStyle === 'none' ? 'none' : 'block';
  updateQR();
});

// Sync Hex strings labels
const hexUpdateList = [
  { input: qrSolidColorInput, hex: 'qrSolidColorHex' },
  { input: qrColor1Input, hex: 'qrColor1Hex' },
  { input: qrColor2Input, hex: 'qrColor2Hex' },
  { input: bgColorInput, hex: 'bgColorHex' }
];

hexUpdateList.forEach(item => {
  const inp = item.input;
  const hexLabel = document.getElementById(item.hex);
  if (inp && hexLabel) {
    inp.addEventListener('input', () => {
      hexLabel.textContent = inp.value.toUpperCase();
      updateQR();
    });
  }
});

// Sliders and Toggle events
gradAngleInput.addEventListener('input', () => {
  gradAngleVal.textContent = `${gradAngleInput.value}°`;
  updateQR();
});

logoSizeInput.addEventListener('input', () => {
  logoSizeVal.textContent = `${logoSizeInput.value}%`;
  updateQR();
});

labelSizeInput.addEventListener('input', () => {
  labelSizeVal.textContent = `${labelSizeInput.value}px`;
  updateQR();
});

labelTopSizeInput.addEventListener('input', () => {
  labelTopSizeVal.textContent = `${labelTopSizeInput.value}px`;
  updateQR();
});

customEyeColorToggle.addEventListener('change', () => {
  eyeColorControls.style.display = customEyeColorToggle.checked ? 'block' : 'none';
  updateQR();
});

frameColorInput.addEventListener('input', updateQR);
frameWidthInput.addEventListener('input', () => {
  frameWidthVal.textContent = `${frameWidthInput.value}px`;
  updateQR();
});

eyeFrameColorInput.addEventListener('input', updateQR);
eyeBallColorInput.addEventListener('input', updateQR);

transparentBgToggle.addEventListener('change', () => {
  bgColorControl.style.display = transparentBgToggle.checked ? 'none' : 'block';
  updateQR();
});

function updateLabelSettingsVisibility() {
  const hasTopText = labelTopTextInput.value.trim().length > 0;
  const hasBottomText = labelTextInput.value.trim().length > 0;
  
  labelTopSettingsPanel.style.display = hasTopText ? 'block' : 'none';
  labelSettingsPanel.style.display = hasBottomText ? 'block' : 'none';
  
  updateQR();
}

labelTopTextInput.addEventListener('input', updateLabelSettingsVisibility);
labelTextInput.addEventListener('input', updateLabelSettingsVisibility);

labelTopColorInput.addEventListener('input', updateQR);
fontWeightTopSelect.addEventListener('change', updateQR);
labelColorInput.addEventListener('input', updateQR);
fontWeightSelect.addEventListener('change', updateQR);
qrTextInput.addEventListener('input', updateQR);
clearBehindLogoToggle.addEventListener('change', updateQR);

// Logo upload handling
function handleLogoFile(file: File) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    const img = new Image();
    img.onload = () => {
      logoImage = img;
      logoBase64 = result;

      // Update UI preview
      logoPreviewThumb.src = result;
      logoFileName.textContent = file.name;
      logoFileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      logoPreviewContainer.style.display = 'block';
      logoTweakSettings.style.display = 'block';

      updateQR();
    };
    img.src = result;
  };
  reader.readAsDataURL(file);
}

logoDropZone.addEventListener('click', () => logoUploadInput.click());
logoUploadInput.addEventListener('change', (e) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    handleLogoFile(files[0]);
  }
});

logoDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  logoDropZone.classList.add('dragover');
});

logoDropZone.addEventListener('dragleave', () => {
  logoDropZone.classList.remove('dragover');
});

logoDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  logoDropZone.classList.remove('dragover');
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleLogoFile(files[0]);
  }
});

removeLogoBtn.addEventListener('click', () => {
  logoImage = null;
  logoBase64 = null;
  logoUploadInput.value = '';
  logoPreviewContainer.style.display = 'none';
  logoTweakSettings.style.display = 'none';
  updateQR();
});

// Compile active configs
function getConfig(): QRConfig {
  return {
    text: qrTextInput.value || 'https://google.com',
    dotStyle: selectedDotStyle,
    eyeFrame: selectedEyeFrame,
    eyeBall: selectedEyeBall,
    colorType: selectedColorType,
    solidColor: qrSolidColorInput.value,
    gradientColor1: qrColor1Input.value,
    gradientColor2: qrColor2Input.value,
    gradientAngle: parseInt(gradAngleInput.value, 10),
    customEyeColor: customEyeColorToggle.checked,
    eyeFrameColor: eyeFrameColorInput.value,
    eyeBallColor: eyeBallColorInput.value,
    transparentBg: transparentBgToggle.checked,
    bgColor: bgColorInput.value,
    logoImage: logoImage,
    logoSize: parseInt(logoSizeInput.value, 10),
    clearBehindLogo: clearBehindLogoToggle.checked,
    labelText: labelTextInput.value,
    labelTopText: labelTopTextInput.value,
    labelColor: labelColorInput.value,
    labelTopColor: labelTopColorInput.value,
    fontWeight: fontWeightSelect.value as 'normal' | 'bold',
    fontWeightTop: fontWeightTopSelect.value as 'normal' | 'bold',
    labelSize: parseInt(labelSizeInput.value, 10),
    labelTopSize: parseInt(labelTopSizeInput.value, 10),
    frameStyle: selectedFrameStyle,
    frameColor: frameColorInput.value,
    frameWidth: parseInt(frameWidthInput.value, 10)
  };
}

function updateQR() {
  try {
    const config = getConfig();
    renderQRCanvas(qrCanvas, config);
  } catch (error) {
    console.error('Error generating QR Code:', error);
  }
}

// Download action bindings
function downloadCanvas(filename: string, format: string) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1000;
  tempCanvas.height = 1000;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  if (format === 'image/jpeg') {
    tempCtx.fillStyle = transparentBgToggle.checked ? '#ffffff' : bgColorInput.value;
    tempCtx.fillRect(0, 0, 1000, 1000);
  }

  tempCtx.drawImage(qrCanvas, 0, 0);

  const link = document.createElement('a');
  link.download = filename;
  link.href = tempCanvas.toDataURL(format, format === 'image/jpeg' ? 0.95 : 1.0);
  link.click();
}

downloadPngBtn.addEventListener('click', () => downloadCanvas('qr-code.png', 'image/png'));
downloadJpgBtn.addEventListener('click', () => downloadCanvas('qr-code.jpg', 'image/jpeg'));

downloadSvgBtn.addEventListener('click', () => {
  const config = getConfig();
  const svgString = generateQRSvg(config, logoBase64);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = 'qr-code.svg';
  link.href = blobUrl;
  link.click();
  URL.revokeObjectURL(blobUrl);
});

// Trigger initial rendering
updateQR();
