import React, { useRef, useState, useEffect, useCallback } from 'react';

/* ── Inline SVG icons (keep self-contained) ── */
const ICO = {
  adjust: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  rotate: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 6A5 5 0 103 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  crop: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 1v11h11M12 15V4H1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  frame: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="4" y="4" width="8" height="8" rx="0.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  ),
  rotL: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 2v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 6A5 5 0 1113 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  rotR: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 6A5 5 0 103 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  flipH: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M5 4H2l3 8zM11 4h3l-3 8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
};

/* ── Reusable slider ── */
function Slider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ext-fg-4)',
        textTransform: 'uppercase', letterSpacing: '0.06em', width: 72, flexShrink: 0,
      }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          flex: 1, height: 4, accentColor: 'var(--gold)',
          cursor: 'pointer', background: 'var(--ext-line)',
        }}
      />
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ext-fg-3)',
        width: 32, textAlign: 'right', flexShrink: 0,
      }}>{value > 0 ? `+${value}` : value}</span>
    </div>
  );
}

/* ── Small action button ── */
function TinyBtn({ children, active, onClick, style: sx }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 500,
      padding: '4px 8px', borderRadius: 'var(--r-sm)',
      border: `1px solid ${active ? 'var(--gold)' : 'var(--ext-line-strong)'}`,
      background: active ? 'var(--gold-wash)' : 'var(--ext-surface)',
      color: active ? 'var(--ext-fg)' : 'var(--ext-fg-3)',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
      lineHeight: 1, ...sx,
    }}>
      {children}
    </button>
  );
}

/* ── Tool tab button ── */
function ToolTab({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '6px 10px', borderRadius: 'var(--r-sm)', border: 'none',
      background: active ? 'var(--gold-wash)' : 'transparent',
      color: active ? 'var(--ext-fg)' : 'var(--ext-fg-4)',
      cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--sans)',
    }}>
      {icon}
      <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
    </button>
  );
}

/* ── Defaults ── */
const DEFAULTS = {
  brightness: 0, contrast: 0, saturation: 0,
  rotation: 0, flipH: false, microRot: 0,
  cropRatio: null, cropRect: null,
  frameSize: 0, frameColor: '#ffffff',
};

const RATIOS = [
  { label: 'Libre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
];

const FRAME_COLORS = [
  { label: 'Blanc', value: '#ffffff' },
  { label: 'Noir', value: '#000000' },
  { label: 'Crème', value: '#FAF7F2' },
];

/* ═══════════════════════════════════════════════════════ */
export default function PhotoEditor({ imageUrl, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [loaded, setLoaded] = useState(false);
  const [tool, setTool] = useState('adjust');
  const [s, setS] = useState({ ...DEFAULTS });

  /* Crop interaction state */
  const [cropDrag, setCropDrag] = useState(null);

  /* ── Load image ── */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setLoaded(true); };
    img.onerror = () => { imgRef.current = null; };
    img.src = imageUrl;
    return () => { img.onload = null; img.onerror = null; };
  }, [imageUrl]);

  /* ── Compute display dims for 370px max width ── */
  const getDisplaySize = useCallback(() => {
    const img = imgRef.current;
    if (!img) return { w: 370, h: 240 };
    const maxW = 370, maxH = 320;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > maxW) { h = h * (maxW / w); w = maxW; }
    if (h > maxH) { w = w * (maxH / h); h = maxH; }
    return { w: Math.round(w), h: Math.round(h) };
  }, [loaded]);

  /* ── Draw canvas ── */
  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    const img = imgRef.current;
    if (!cvs || !img) return;
    const { w, h } = getDisplaySize();

    /* account for frame in display */
    const fs = s.frameSize;
    cvs.width = w + fs * 2;
    cvs.height = h + fs * 2;
    const ctx = cvs.getContext('2d');

    /* frame background */
    if (fs > 0) {
      ctx.fillStyle = s.frameColor;
      ctx.fillRect(0, 0, cvs.width, cvs.height);
    }

    ctx.save();
    ctx.translate(cvs.width / 2, cvs.height / 2);

    /* rotation */
    const totalRot = (s.rotation + s.microRot) * (Math.PI / 180);
    if (totalRot) ctx.rotate(totalRot);

    /* flip */
    if (s.flipH) ctx.scale(-1, 1);

    /* draw image centred */
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    /* pixel manipulation: brightness / contrast / saturation */
    if (s.brightness !== 0 || s.contrast !== 0 || s.saturation !== 0) {
      const id = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const d = id.data;
      const br = s.brightness * 2.55;
      const co = s.contrast / 50;
      const factor = (1 + co) / (1.0001 - co);
      const sat = s.saturation / 50;

      for (let i = 0; i < d.length; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];

        /* brightness */
        r += br; g += br; b += br;

        /* contrast */
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;

        /* saturation */
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = gray + (1 + sat) * (r - gray);
        g = gray + (1 + sat) * (g - gray);
        b = gray + (1 + sat) * (b - gray);

        d[i] = Math.max(0, Math.min(255, r));
        d[i + 1] = Math.max(0, Math.min(255, g));
        d[i + 2] = Math.max(0, Math.min(255, b));
      }
      ctx.putImageData(id, 0, 0);
    }

    /* crop overlay (visual only — applied at export) */
    if (tool === 'crop' && s.cropRect) {
      const cr = s.cropRect;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      /* top */
      ctx.fillRect(0, 0, cvs.width, cr.y);
      /* bottom */
      ctx.fillRect(0, cr.y + cr.h, cvs.width, cvs.height - cr.y - cr.h);
      /* left */
      ctx.fillRect(0, cr.y, cr.x, cr.h);
      /* right */
      ctx.fillRect(cr.x + cr.w, cr.y, cvs.width - cr.x - cr.w, cr.h);
      /* border */
      ctx.strokeStyle = 'var(--gold, #E8C547)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
      /* rule-of-thirds */
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.5;
      for (let t = 1; t <= 2; t++) {
        ctx.beginPath();
        ctx.moveTo(cr.x + (cr.w * t) / 3, cr.y);
        ctx.lineTo(cr.x + (cr.w * t) / 3, cr.y + cr.h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cr.x, cr.y + (cr.h * t) / 3);
        ctx.lineTo(cr.x + cr.w, cr.y + (cr.h * t) / 3);
        ctx.stroke();
      }
    }
  }, [loaded, s, tool, getDisplaySize]);

  useEffect(() => { draw(); }, [draw]);

  /* ── Init crop rect when entering crop tool or changing ratio ── */
  useEffect(() => {
    if (tool !== 'crop') return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const cw = cvs.width, ch = cvs.height;
    if (s.cropRatio === null) {
      setS((p) => ({ ...p, cropRect: { x: 0, y: 0, w: cw, h: ch } }));
    } else {
      const ratio = s.cropRatio;
      let rw = cw, rh = cw / ratio;
      if (rh > ch) { rh = ch; rw = ch * ratio; }
      rw = Math.min(rw, cw); rh = Math.min(rh, ch);
      setS((p) => ({
        ...p,
        cropRect: {
          x: Math.round((cw - rw) / 2), y: Math.round((ch - rh) / 2),
          w: Math.round(rw), h: Math.round(rh),
        },
      }));
    }
  }, [tool, s.cropRatio]);

  /* ── Crop drag handling ── */
  const onCropMouseDown = (e) => {
    if (tool !== 'crop' || !s.cropRect) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const cr = s.cropRect;
    if (mx >= cr.x && mx <= cr.x + cr.w && my >= cr.y && my <= cr.y + cr.h) {
      setCropDrag({ startX: mx, startY: my, origRect: { ...cr } });
    }
  };
  const onCropMouseMove = (e) => {
    if (!cropDrag || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const dx = mx - cropDrag.startX, dy = my - cropDrag.startY;
    const or = cropDrag.origRect;
    const cw = canvasRef.current.width, ch = canvasRef.current.height;
    setS((p) => ({
      ...p,
      cropRect: {
        ...or,
        x: Math.max(0, Math.min(cw - or.w, or.x + dx)),
        y: Math.max(0, Math.min(ch - or.h, or.y + dy)),
      },
    }));
  };
  const onCropMouseUp = () => setCropDrag(null);

  useEffect(() => {
    if (cropDrag) {
      window.addEventListener('mousemove', onCropMouseMove);
      window.addEventListener('mouseup', onCropMouseUp);
      return () => {
        window.removeEventListener('mousemove', onCropMouseMove);
        window.removeEventListener('mouseup', onCropMouseUp);
      };
    }
  }, [cropDrag]);

  /* ── Setters ── */
  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));
  const reset = () => setS({ ...DEFAULTS });
  const rotateBy = (deg) => set('rotation', ((s.rotation + deg) % 360 + 360) % 360);

  /* ── Export ── */
  const handleApply = () => {
    const img = imgRef.current;
    if (!img) return;

    const srcW = img.naturalWidth, srcH = img.naturalHeight;
    const fs = s.frameSize;
    let outW = srcW + fs * 2, outH = srcH + fs * 2;

    const out = document.createElement('canvas');
    out.width = outW; out.height = outH;
    const ctx = out.getContext('2d');

    /* frame */
    if (fs > 0) {
      ctx.fillStyle = s.frameColor;
      ctx.fillRect(0, 0, outW, outH);
    }

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    const totalRot = (s.rotation + s.microRot) * (Math.PI / 180);
    if (totalRot) ctx.rotate(totalRot);
    if (s.flipH) ctx.scale(-1, 1);
    ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);
    ctx.restore();

    /* pixel adjustments */
    if (s.brightness !== 0 || s.contrast !== 0 || s.saturation !== 0) {
      const id = ctx.getImageData(0, 0, outW, outH);
      const d = id.data;
      const br = s.brightness * 2.55;
      const co = s.contrast / 50;
      const factor = (1 + co) / (1.0001 - co);
      const sat = s.saturation / 50;
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];
        r += br; g += br; b += br;
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = gray + (1 + sat) * (r - gray);
        g = gray + (1 + sat) * (g - gray);
        b = gray + (1 + sat) * (b - gray);
        d[i] = Math.max(0, Math.min(255, r));
        d[i + 1] = Math.max(0, Math.min(255, g));
        d[i + 2] = Math.max(0, Math.min(255, b));
      }
      ctx.putImageData(id, 0, 0);
    }

    /* crop */
    if (s.cropRect && canvasRef.current) {
      const cvs = canvasRef.current;
      const scaleX = outW / cvs.width, scaleY = outH / cvs.height;
      const cr = s.cropRect;
      const sx = cr.x * scaleX, sy = cr.y * scaleY;
      const sw = cr.w * scaleX, sh = cr.h * scaleY;
      const cropped = document.createElement('canvas');
      cropped.width = Math.round(sw); cropped.height = Math.round(sh);
      cropped.getContext('2d').drawImage(out, sx, sy, sw, sh, 0, 0, cropped.width, cropped.height);
      cropped.toBlob((blob) => { if (blob) onSave(blob); }, 'image/jpeg', 0.92);
      return;
    }

    out.toBlob((blob) => { if (blob) onSave(blob); }, 'image/jpeg', 0.92);
  };

  /* ── Tool panels ── */
  const panels = {
    adjust: (
      <div style={{ padding: '8px 12px' }}>
        <Slider label="Luminosité" value={s.brightness} min={-50} max={50} onChange={(v) => set('brightness', v)} />
        <Slider label="Contraste" value={s.contrast} min={-50} max={50} onChange={(v) => set('contrast', v)} />
        <Slider label="Saturation" value={s.saturation} min={-50} max={50} onChange={(v) => set('saturation', v)} />
      </div>
    ),
    rotate: (
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <TinyBtn onClick={() => rotateBy(-90)}>{ICO.rotL} -90°</TinyBtn>
          <TinyBtn onClick={() => rotateBy(90)}>{ICO.rotR} +90°</TinyBtn>
          <TinyBtn active={s.flipH} onClick={() => set('flipH', !s.flipH)}>{ICO.flipH} Miroir</TinyBtn>
        </div>
        <Slider label="Micro-rot." value={s.microRot} min={-5} max={5} step={0.5} onChange={(v) => set('microRot', v)} />
      </div>
    ),
    crop: (
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RATIOS.map((r) => (
            <TinyBtn key={r.label} active={s.cropRatio === r.value} onClick={() => set('cropRatio', r.value)}>
              {r.label}
            </TinyBtn>
          ))}
        </div>
        <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ext-fg-4)' }}>
          Glissez le cadre pour repositionner
        </div>
      </div>
    ),
    frame: (
      <div style={{ padding: '8px 12px' }}>
        <Slider label="Épaisseur" value={s.frameSize} min={0} max={30} onChange={(v) => set('frameSize', v)} />
        <div style={{ display: 'flex', gap: 6 }}>
          {FRAME_COLORS.map((fc) => (
            <TinyBtn key={fc.value} active={s.frameColor === fc.value} onClick={() => set('frameColor', fc.value)}>
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: 2,
                background: fc.value, border: '1px solid var(--ext-line-strong)',
              }} />
              {fc.label}
            </TinyBtn>
          ))}
        </div>
      </div>
    ),
  };

  /* ── Check if anything has changed ── */
  const isDirty = JSON.stringify(s) !== JSON.stringify(DEFAULTS);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--ext-bg)', color: 'var(--ext-fg)',
    }}>
      {/* Canvas area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 10, overflow: 'hidden', background: 'var(--ext-bg-2)',
        minHeight: 0,
      }}>
        {loaded ? (
          <canvas
            ref={canvasRef}
            onMouseDown={onCropMouseDown}
            style={{
              maxWidth: '100%', maxHeight: '100%',
              borderRadius: 'var(--r-sm)',
              cursor: tool === 'crop' ? 'move' : 'default',
              boxShadow: 'var(--shadow-2)',
            }}
          />
        ) : (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ext-fg-4)',
            letterSpacing: '0.1em',
          }}>CHARGEMENT...</div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 2, padding: '4px 8px',
        borderTop: '1px solid var(--ext-line)', background: 'var(--ext-bg)',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <ToolTab icon={ICO.adjust} label="Ajuster" active={tool === 'adjust'} onClick={() => setTool('adjust')} />
        <ToolTab icon={ICO.rotate} label="Rotation" active={tool === 'rotate'} onClick={() => setTool('rotate')} />
        <ToolTab icon={ICO.crop} label="Recadrer" active={tool === 'crop'} onClick={() => setTool('crop')} />
        <ToolTab icon={ICO.frame} label="Cadre" active={tool === 'frame'} onClick={() => setTool('frame')} />
      </div>

      {/* Active tool panel */}
      <div style={{
        borderTop: '1px solid var(--ext-line)', background: 'var(--ext-bg)',
        flexShrink: 0, minHeight: 64,
      }}>
        {panels[tool]}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderTop: '1px solid var(--ext-line)',
        background: 'var(--ext-bg)', flexShrink: 0,
      }}>
        {isDirty && (
          <button onClick={reset} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ext-fg-4)',
            textDecoration: 'underline', padding: 0,
          }}>Réinitialiser</button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Annuler</button>
        <button onClick={handleApply} className="btn btn-gold btn-sm" disabled={!loaded}>
          Appliquer
        </button>
      </div>
    </div>
  );
}
