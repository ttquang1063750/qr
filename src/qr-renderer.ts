import qrcode from 'qrcode-generator';

export interface QRConfig {
  text: string;
  dotStyle: 'square' | 'dots' | 'rounded';
  eyeFrame: 'square' | 'rounded' | 'circle';
  eyeBall: 'square' | 'rounded' | 'circle';
  colorType: 'solid' | 'gradient';
  solidColor: string;
  gradientColor1: string;
  gradientColor2: string;
  gradientAngle: number;
  customEyeColor: boolean;
  eyeFrameColor: string;
  eyeBallColor: string;
  transparentBg: boolean;
  bgColor: string;
  logoImage: HTMLImageElement | null;
  logoSize: number;
  clearBehindLogo: boolean;
  labelText: string;
  labelTopText: string;
  labelColor: string;
  labelTopColor: string;
  fontWeight: 'normal' | 'bold';
  fontWeightTop: 'normal' | 'bold';
  labelSize: number;
  labelTopSize: number;

  frameStyle?: 'none' | 'square' | 'rounded' | 'circle';
  frameColor?: string;
  frameWidth?: number;
}

// Finder modules boundaries check helper
export function isFinderModule(x: number, y: number, N: number): boolean {
  return (x < 8 && y < 8) ||                  // Top-Left (including separator)
         (x >= N - 8 && y < 8) ||             // Top-Right
         (x < 8 && y >= N - 8);               // Bottom-Left
}

// Draw rounded rectangle path helper
export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Core Canvas Drawing Pipeline
export function renderQRCanvas(canvas: HTMLCanvasElement, config: QRConfig): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const hasLogo = config.logoImage !== null;
  const ecc = hasLogo ? 'H' : 'M'; // Auto ECC selection for best scan rates

  // Generate QR matrix using npm library
  const qrLib = qrcode(0, ecc);
  qrLib.addData(config.text || 'https://google.com');
  qrLib.make();

  const N = qrLib.getModuleCount();
  const size = 1000;
  canvas.width = size;
  canvas.height = size;

  // Clear Canvas
  ctx.clearRect(0, 0, size, size);

  // Background Fill
  if (!config.transparentBg) {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  // Layout Calculations
  const hasTopLabel = config.labelTopText.trim().length > 0;
  const hasBottomLabel = config.labelText.trim().length > 0;
  const hasAnyLabel = hasTopLabel || hasBottomLabel;
  
  let qrAreaSize = hasAnyLabel ? 760 : 840;
  if (config.frameStyle === 'circle') {
    qrAreaSize = hasAnyLabel ? 640 : 680;
  } else if (config.frameStyle && config.frameStyle !== 'none') {
    qrAreaSize = hasAnyLabel ? 720 : 800;
  }

  const marginX = (size - qrAreaSize) / 2;
  const marginY = (size - qrAreaSize) / 2;
  const S = qrAreaSize / N; // module block size
  const cx = size / 2;
  const cy = marginY + qrAreaSize / 2;

  // Watermark Clearance bounds
  const logoPercent = config.logoSize / 100;
  const lw = qrAreaSize * logoPercent;
  const clearAreaSize = lw * 1.15;

  // Compile QR fill style (solid or linear gradient)
  let qrFillStyle: string | CanvasGradient;
  if (config.colorType === 'solid') {
    qrFillStyle = config.solidColor;
  } else {
    const angleRad = (config.gradientAngle * Math.PI) / 180;
    const r = qrAreaSize / 2;
    const x1 = cx - Math.cos(angleRad) * r;
    const y1 = cy - Math.sin(angleRad) * r;
    const x2 = cx + Math.cos(angleRad) * r;
    const y2 = cy + Math.sin(angleRad) * r;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, config.gradientColor1);
    grad.addColorStop(1, config.gradientColor2);
    qrFillStyle = grad;
  }

  // Draw QR Frame
  if (config.frameStyle && config.frameStyle !== 'none') {
    ctx.save();
    ctx.strokeStyle = config.frameColor || qrFillStyle;
    ctx.lineWidth = config.frameWidth || 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pad = 25;
    const fx = marginX - pad;
    const fy = marginY - pad;
    const fw = qrAreaSize + 2 * pad;
    const fh = qrAreaSize + 2 * pad;

    ctx.beginPath();
    if (config.frameStyle === 'square') {
      ctx.strokeRect(fx, fy, fw, fh);
    } 
    else if (config.frameStyle === 'rounded') {
      const r = 40;
      drawRoundedRectPath(ctx, fx, fy, fw, fh, r);
      ctx.stroke();
    } 
    else if (config.frameStyle === 'circle') {
      const radius = (qrAreaSize / 2) * Math.sqrt(2) + 12;
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 1. Draw Data Modules (Timing, alignments, and modules)
  ctx.fillStyle = qrFillStyle;

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!qrLib.isDark(y, x)) continue;
      if (isFinderModule(x, y, N)) continue;

      const mx = marginX + x * S + S / 2;
      const my = marginY + y * S + S / 2;

      // Clear area for center logo
      if (hasLogo && config.clearBehindLogo) {
        if (Math.abs(mx - cx) < clearAreaSize / 2 && Math.abs(my - cy) < clearAreaSize / 2) {
          continue;
        }
      }

      const px = marginX + x * S;
      const py = marginY + y * S;

      ctx.beginPath();
      if (config.dotStyle === 'square') {
        ctx.fillRect(px, py, S + 0.5, S + 0.5);
      } 
      else if (config.dotStyle === 'dots') {
        ctx.arc(px + S / 2, py + S / 2, S * 0.4, 0, 2 * Math.PI);
        ctx.fill();
      } 
      else if (config.dotStyle === 'rounded') {
        // Look up neighbors to make rounded tracks
        const T = y > 0 && qrLib.isDark(y - 1, x) && !isFinderModule(x, y - 1, N);
        const B = y < N - 1 && qrLib.isDark(y + 1, x) && !isFinderModule(x, y + 1, N);
        const L = x > 0 && qrLib.isDark(y, x - 1) && !isFinderModule(x - 1, y, N);
        const R = x < N - 1 && qrLib.isDark(y, x + 1) && !isFinderModule(x + 1, y, N);

        const r = S / 2;
        ctx.moveTo(px + r, py);

        // Top-Right Corner
        if (!T && !R) ctx.arcTo(px + S, py, px + S, py + r, r);
        else { ctx.lineTo(px + S, py); ctx.lineTo(px + S, py + r); }

        // Bottom-Right Corner
        if (!B && !R) ctx.arcTo(px + S, py + S, px + S - r, py + S, r);
        else { ctx.lineTo(px + S, py + S); ctx.lineTo(px + S - r, py + S); }

        // Bottom-Left Corner
        if (!B && !L) ctx.arcTo(px, py + S, px, py + S - r, r);
        else { ctx.lineTo(px, py + S); ctx.lineTo(px, py + S - r); }

        // Top-Left Corner
        if (!T && !L) ctx.arcTo(px, py, px + r, py, r);
        else { ctx.lineTo(px, py); ctx.lineTo(px + r, py); }

        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // 2. Draw 3 Finder Eyes (Top-Left, Top-Right, Bottom-Left)
  const finderPositions = [
    { x: 0, y: 0 },
    { x: N - 7, y: 0 },
    { x: 0, y: N - 7 }
  ];

  finderPositions.forEach(pos => {
    const ex = marginX + pos.x * S;
    const ey = marginY + pos.y * S;
    const eyeSize = 7 * S;

    const frameColor = config.customEyeColor ? config.eyeFrameColor : qrFillStyle;
    const ballColor = config.customEyeColor ? config.eyeBallColor : qrFillStyle;

    // Outer Frame
    ctx.fillStyle = frameColor;
    ctx.beginPath();

    if (config.eyeFrame === 'square') {
      ctx.fillRect(ex, ey, eyeSize, eyeSize);
      ctx.globalCompositeOperation = config.transparentBg ? 'destination-out' : 'source-over';
      ctx.fillStyle = config.transparentBg ? 'rgba(0,0,0,0)' : config.bgColor;
      ctx.fillRect(ex + S, ey + S, 5 * S, 5 * S);
      ctx.globalCompositeOperation = 'source-over';
    } 
    else if (config.eyeFrame === 'rounded') {
      const r = S * 1.8;
      drawRoundedRectPath(ctx, ex, ey, eyeSize, eyeSize, r);
      ctx.fillStyle = frameColor;
      ctx.fill();

      ctx.globalCompositeOperation = config.transparentBg ? 'destination-out' : 'source-over';
      ctx.fillStyle = config.transparentBg ? 'rgba(0,0,0,0)' : config.bgColor;
      drawRoundedRectPath(ctx, ex + S, ey + S, 5 * S, 5 * S, r - S);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } 
    else if (config.eyeFrame === 'circle') {
      ctx.arc(ex + eyeSize / 2, ey + eyeSize / 2, eyeSize / 2, 0, 2 * Math.PI);
      ctx.fill();

      ctx.globalCompositeOperation = config.transparentBg ? 'destination-out' : 'source-over';
      ctx.fillStyle = config.transparentBg ? 'rgba(0,0,0,0)' : config.bgColor;
      ctx.beginPath();
      ctx.arc(ex + eyeSize / 2, ey + eyeSize / 2, eyeSize / 2 - S, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // Inner Eyeball Ball
    ctx.fillStyle = ballColor;
    ctx.beginPath();
    const bx = ex + 2 * S;
    const by = ey + 2 * S;
    const bSize = 3 * S;

    if (config.eyeBall === 'square') {
      ctx.fillRect(bx, by, bSize, bSize);
    } 
    else if (config.eyeBall === 'rounded') {
      drawRoundedRectPath(ctx, bx, by, bSize, bSize, S * 0.8);
      ctx.fill();
    } 
    else if (config.eyeBall === 'circle') {
      ctx.arc(bx + bSize / 2, by + bSize / 2, bSize / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // 3. Draw Watermark Logo
  if (hasLogo && config.logoImage) {
    ctx.save();
    if (config.clearBehindLogo) {
      ctx.beginPath();
      ctx.arc(cx, cy, lw / 2 + 8, 0, 2 * Math.PI);
      ctx.fillStyle = config.transparentBg ? '#ffffff' : config.bgColor;
      ctx.fill();
    }
    const lx = cx - lw / 2;
    const ly = cy - lw / 2;
    ctx.drawImage(config.logoImage, lx, ly, lw, lw);
    ctx.restore();
  }

  // 4. Draw Label Text (Top and Bottom)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (hasTopLabel) {
    const fontSize = config.labelTopSize * 2.5;
    const lineHeight = fontSize * 1.25;
    ctx.font = `${config.fontWeightTop} ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = config.labelTopColor;
    
    const lines = config.labelTopText.split('\n');
    const totalHeight = lines.length * lineHeight;
    const startY = marginY / 2 - totalHeight / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line.trim(), cx, startY + index * lineHeight + fontSize * 0.8);
    });
  }

  if (hasBottomLabel) {
    const fontSize = config.labelSize * 2.5;
    const lineHeight = fontSize * 1.25;
    ctx.font = `${config.fontWeight} ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = config.labelColor;

    const lines = config.labelText.split('\n');
    const totalHeight = lines.length * lineHeight;
    const startY = (size + cy + qrAreaSize / 2) / 2 - totalHeight / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line.trim(), cx, startY + index * lineHeight + fontSize * 0.8);
    });
  }
}

// Native Vector SVG Compiler
export function generateQRSvg(config: QRConfig, logoBase64: string | null): string {
  const hasLogo = config.logoImage !== null;
  const ecc = hasLogo ? 'H' : 'M';

  const qrLib = qrcode(0, ecc);
  qrLib.addData(config.text || 'https://google.com');
  qrLib.make();

  const N = qrLib.getModuleCount();
  const size = 1000;

  const hasTopLabel = config.labelTopText.trim().length > 0;
  const hasBottomLabel = config.labelText.trim().length > 0;
  const hasAnyLabel = hasTopLabel || hasBottomLabel;
  
  let qrAreaSize = hasAnyLabel ? 760 : 840;
  if (config.frameStyle === 'circle') {
    qrAreaSize = hasAnyLabel ? 640 : 680;
  } else if (config.frameStyle && config.frameStyle !== 'none') {
    qrAreaSize = hasAnyLabel ? 720 : 800;
  }

  const marginX = (size - qrAreaSize) / 2;
  const marginY = (size - qrAreaSize) / 2;
  const S = qrAreaSize / N;
  const cx = size / 2;
  const cy = marginY + qrAreaSize / 2;

  const logoPercent = config.logoSize / 100;
  const lw = qrAreaSize * logoPercent;
  const clearAreaSize = lw * 1.15;

  let svg = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">
  <defs>
`;

  // Gradient setups
  if (config.colorType === 'gradient') {
    const angleRad = (config.gradientAngle * Math.PI) / 180;
    const r = qrAreaSize / 2;
    const x1 = cx - Math.cos(angleRad) * r;
    const y1 = cy - Math.sin(angleRad) * r;
    const x2 = cx + Math.cos(angleRad) * r;
    const y2 = cy + Math.sin(angleRad) * r;

    svg += `    <linearGradient id="qrGradient" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${config.gradientColor1}" />
      <stop offset="100%" stop-color="${config.gradientColor2}" />
    </linearGradient>\n`;
  }
  svg += `  </defs>\n`;

  const qrColorRef = config.colorType === 'solid' ? config.solidColor : 'url(#qrGradient)';
  const eyeFrameColor = config.customEyeColor ? config.eyeFrameColor : qrColorRef;
  const eyeBallColor = config.customEyeColor ? config.eyeBallColor : qrColorRef;
  const clearBgColor = config.transparentBg ? '#ffffff' : config.bgColor;

  // Draw Background
  if (!config.transparentBg) {
    svg += `  <rect width="${size}" height="${size}" fill="${config.bgColor}" />\n`;
  }

  // Draw QR Frame
  if (config.frameStyle && config.frameStyle !== 'none') {
    const pad = 25;
    const fx = marginX - pad;
    const fy = marginY - pad;
    const fw = qrAreaSize + 2 * pad;
    const fh = qrAreaSize + 2 * pad;
    const strokeWidth = config.frameWidth || 12;
    const frameColor = config.frameColor || qrColorRef;

    if (config.frameStyle === 'square') {
      svg += `  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="${frameColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    } 
    else if (config.frameStyle === 'rounded') {
      const r = 40;
      svg += `  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${r}" fill="none" stroke="${frameColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    } 
    else if (config.frameStyle === 'circle') {
      const radius = (qrAreaSize / 2) * Math.sqrt(2) + 12;
      svg += `  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${frameColor}" stroke-width="${strokeWidth}" />\n`;
    }
  }

  // Draw Regular Modules Path
  let modulesPath = '';
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!qrLib.isDark(y, x)) continue;
      if (isFinderModule(x, y, N)) continue;

      const mx = marginX + x * S + S / 2;
      const my = marginY + y * S + S / 2;

      // Clear center for logo
      if (hasLogo && config.clearBehindLogo) {
        if (Math.abs(mx - cx) < clearAreaSize / 2 && Math.abs(my - cy) < clearAreaSize / 2) {
          continue;
        }
      }

      const px = marginX + x * S;
      const py = marginY + y * S;

      if (config.dotStyle === 'square') {
        modulesPath += `M${px.toFixed(1)},${py.toFixed(1)} h${S.toFixed(1)} v${S.toFixed(1)} h-${S.toFixed(1)} z `;
      } 
      else if (config.dotStyle === 'dots') {
        const r = S * 0.4;
        modulesPath += `M${(px + S/2).toFixed(1)},${(py + S/2 - r).toFixed(1)} a${r.toFixed(1)},${r.toFixed(1)} 0 1,1 0,${(2*r).toFixed(1)} a${r.toFixed(1)},${r.toFixed(1)} 0 1,1 0,-${(2*r).toFixed(1)} `;
      } 
      else if (config.dotStyle === 'rounded') {
        const T = y > 0 && qrLib.isDark(y - 1, x) && !isFinderModule(x, y - 1, N);
        const B = y < N - 1 && qrLib.isDark(y + 1, x) && !isFinderModule(x, y + 1, N);
        const L = x > 0 && qrLib.isDark(y, x - 1) && !isFinderModule(x - 1, y, N);
        const R = x < N - 1 && qrLib.isDark(y, x + 1) && !isFinderModule(x + 1, y, N);

        const r = S / 2;
        let p = `M${(px + r).toFixed(1)},${py.toFixed(1)} `;
        if (!T && !R) p += `a${r},${r} 0 0,1 ${r},${r} `;
        else p += `h${r} v${r} `;

        if (!B && !R) p += `a${r},${r} 0 0,1 -${r},${r} `;
        else p += `v${r} h-${r} `;

        if (!B && !L) p += `a${r},${r} 0 0,1 -${r},-${r} `;
        else p += `h-${r} v-${r} `;

        if (!T && !L) p += `a${r},${r} 0 0,1 ${r},-${r} `;
        else p += `v-${r} h${r} `;

        p += `z `;
        modulesPath += p;
      }
    }
  }

  if (modulesPath) {
    svg += `  <path d="${modulesPath.trim()}" fill="${qrColorRef}" />\n`;
  }

  // Draw 3 Eyes
  const finderPositions = [
    { x: 0, y: 0 },
    { x: N - 7, y: 0 },
    { x: 0, y: N - 7 }
  ];

  finderPositions.forEach(pos => {
    const ex = marginX + pos.x * S;
    const ey = marginY + pos.y * S;
    const eyeSize = 7 * S;

    if (config.eyeFrame === 'square') {
      svg += `  <path d="M${ex},${ey} h${eyeSize} v${eyeSize} h-${eyeSize} z M${ex + S},${ey + S} v${5*S} h${5*S} v-${5*S} z" fill="${eyeFrameColor}" fill-rule="evenodd" />\n`;
    } 
    else if (config.eyeFrame === 'rounded') {
      const r = S * 1.8;
      const r2 = r - S;
      svg += `  <path d="M${ex + r},${ey} h${eyeSize - 2*r} a${r},${r} 0 0,1 ${r},${r} v${eyeSize - 2*r} a${r},${r} 0 0,1 -${r},${r} h-${eyeSize - 2*r} a${r},${r} 0 0,1 -${r},-${r} v-${eyeSize - 2*r} a${r},${r} 0 0,1 ${r},-${r} z M${ex + S + r2},${ey + S} a${r2},${r2} 0 0,0 -${r2},${r2} v${5*S - 2*r2} a${r2},${r2} 0 0,0 ${r2},${r2} h${5*S - 2*r2} a${r2},${r2} 0 0,0 ${r2},-${r2} v-${5*S - 2*r2} a${r2},${r2} 0 0,0 -${r2},-${r2} z" fill="${eyeFrameColor}" fill-rule="evenodd" />\n`;
    } 
    else if (config.eyeFrame === 'circle') {
      const r = eyeSize / 2;
      const r2 = r - S;
      svg += `  <path d="M${ex + r},${ey} a${r},${r} 0 1,1 0,${2*r} a${r},${r} 0 1,1 0,-${2*r} z M${ex + r},${ey + S} a${r2},${r2} 0 1,0 0,${2*r2} a${r2},${r2} 0 1,0 0,-${2*r2} z" fill="${eyeFrameColor}" fill-rule="evenodd" />\n`;
    }

    const bx = ex + 2 * S;
    const by = ey + 2 * S;
    const bSize = 3 * S;

    if (config.eyeBall === 'square') {
      svg += `  <rect x="${bx}" y="${by}" width="${bSize}" height="${bSize}" fill="${eyeBallColor}" />\n`;
    } 
    else if (config.eyeBall === 'rounded') {
      const r = S * 0.8;
      svg += `  <rect x="${bx}" y="${by}" width="${bSize}" height="${bSize}" rx="${r}" fill="${eyeBallColor}" />\n`;
    } 
    else if (config.eyeBall === 'circle') {
      svg += `  <circle cx="${bx + bSize/2}" cy="${by + bSize/2}" r="${bSize/2}" fill="${eyeBallColor}" />\n`;
    }
  });

  // Draw Logo Watermark
  if (hasLogo && logoBase64) {
    if (config.clearBehindLogo) {
      svg += `  <circle cx="${cx}" cy="${cy}" r="${lw / 2 + 8}" fill="${clearBgColor}" />\n`;
    }
    svg += `  <image href="${logoBase64}" x="${cx - lw/2}" y="${cy - lw/2}" width="${lw}" height="${lw}" />\n`;
  }

  // Draw Text Label (Top and Bottom)
  if (hasTopLabel) {
    const lines = config.labelTopText.split('\n');
    const fontSize = config.labelTopSize * 2.5;
    const lineHeight = fontSize * 1.25;
    const weightAttr = config.fontWeightTop === 'bold' ? ' font-weight="bold"' : '';
    const totalHeight = lines.length * lineHeight;
    const startY = marginY / 2 - totalHeight / 2;
    svg += `  <text x="${cx}" fill="${config.labelTopColor}" font-family="Plus Jakarta Sans, sans-serif" font-size="${fontSize}" text-anchor="middle"${weightAttr}>\n`;
    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight + fontSize * 0.8;
      svg += `    <tspan x="${cx}" y="${lineY.toFixed(1)}">${line.trim()}</tspan>\n`;
    });
    svg += `  </text>\n`;
  }

  if (hasBottomLabel) {
    const lines = config.labelText.split('\n');
    const fontSize = config.labelSize * 2.5;
    const lineHeight = fontSize * 1.25;
    const weightAttr = config.fontWeight === 'bold' ? ' font-weight="bold"' : '';
    const totalHeight = lines.length * lineHeight;
    const startY = (size + cy + qrAreaSize / 2) / 2 - totalHeight / 2;
    svg += `  <text x="${cx}" fill="${config.labelColor}" font-family="Plus Jakarta Sans, sans-serif" font-size="${fontSize}" text-anchor="middle"${weightAttr}>\n`;
    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight + fontSize * 0.8;
      svg += `    <tspan x="${cx}" y="${lineY.toFixed(1)}">${line.trim()}</tspan>\n`;
    });
    svg += `  </text>\n`;
  }

  svg += `</svg>`;
  return svg;
}
