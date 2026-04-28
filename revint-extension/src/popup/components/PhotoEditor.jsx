import React, { useRef, useState, useEffect, useCallback } from 'react';

/* ── Compact SVG icons ── */
const sv = (d, extra) => <svg width="14" height="14" viewBox="0 0 16 16" fill="none">{d}{extra}</svg>;
const ICO = {
  adjust: sv(<><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>),
  rotate: sv(<><path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.5 6A5 5 0 103 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>),
  crop: sv(<path d="M4 1v11h11M12 15V4H1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>),
  frame: sv(<><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="4" y="4" width="8" height="8" rx=".5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/></>),
  rotL: sv(<><path d="M2 2v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.5 6A5 5 0 1113 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>),
  rotR: sv(<><path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.5 6A5 5 0 103 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>),
  flipH: sv(<><path d="M8 1v14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 2"/><path d="M5 4H2l3 8zM11 4h3l-3 8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></>),
};

/* ── Reusable slider ── */
function Slider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ext-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 72, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1, height: 4, accentColor: 'var(--gold)', cursor: 'pointer', background: 'var(--ext-line)' }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ext-fg-3)', width: 32, textAlign: 'right', flexShrink: 0 }}>{value > 0 ? `+${value}` : value}</span>
    </div>
  );
}

function TinyBtn({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 500, padding: '4px 8px', borderRadius: 'var(--r-sm)',
      border: `1px solid ${active ? 'var(--gold)' : 'var(--ext-line-strong)'}`,
      background: active ? 'var(--gold-wash)' : 'var(--ext-surface)',
      color: active ? 'var(--ext-fg)' : 'var(--ext-fg-3)',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 1,
    }}>{children}</button>
  );
}

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

const DEFAULTS = {
  brightness: 0, contrast: 0, saturation: 0, rotation: 0,
  flipH: false, microRot: 0, cropRatio: null, cropRect: null,
  frameSize: 0, frameColor: '#ffffff',
};
const RATIOS = [{ label: 'Libre', value: null }, { label: '1:1', value: 1 }, { label: '4:3', value: 4/3 }, { label: '3:4', value: 3/4 }];
const FRAME_COLORS = [{ label: 'Blanc', value: '#ffffff' }, { label: 'Noir', value: '#000000' }, { label: 'Crème', value: '#FAF7F2' }];

/* Shared pixel-manipulation — used by both preview and export */
function applyPixelAdjustments(ctx, w, h, brightness, contrast, saturation) {
  if (brightness === 0 && contrast === 0 && saturation === 0) return;
  const id = ctx.getImageData(0, 0, w, h), d = id.data;
  const br = brightness * 2.55, co = contrast / 50, factor = (1 + co) / (1.0001 - co), sat = saturation / 50;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] + br, g = d[i+1] + br, b = d[i+2] + br;
    r = factor * (r - 128) + 128; g = factor * (g - 128) + 128; b = factor * (b - 128) + 128;
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (1 + sat) * (r - gray); g = gray + (1 + sat) * (g - gray); b = gray + (1 + sat) * (b - gray);
    d[i] = Math.max(0, Math.min(255, r)); d[i+1] = Math.max(0, Math.min(255, g)); d[i+2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(id, 0, 0);
}

/* Draw image with transforms onto a context */
function drawTransformed(ctx, img, imgW, imgH, cvsW, cvsH, st) {
  if (st.frameSize > 0) { ctx.fillStyle = st.frameColor; ctx.fillRect(0, 0, cvsW, cvsH); }
  ctx.save();
  ctx.translate(cvsW / 2, cvsH / 2);
  const totalRot = (st.rotation + st.microRot) * (Math.PI / 180);
  if (totalRot) ctx.rotate(totalRot);
  if (st.flipH) ctx.scale(-1, 1);
  ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
  ctx.restore();
}

/* ══════════════════════════════════════════════ */
export default function PhotoEditor({ imageUrl, onSave, onCancel }) {
  const canvasRef = useRef(null), imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [tool, setTool] = useState('adjust');
  const [s, setS] = useState({ ...DEFAULTS });
  const [cropDrag, setCropDrag] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setLoaded(true); };
    img.onerror = () => { imgRef.current = null; };
    img.src = imageUrl;
    return () => { img.onload = null; img.onerror = null; };
  }, [imageUrl]);

  const getDisplaySize = useCallback(() => {
    const img = imgRef.current;
    if (!img) return { w: 370, h: 240 };
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > 370) { h = h * (370 / w); w = 370; }
    if (h > 320) { w = w * (320 / h); h = 320; }
    return { w: Math.round(w), h: Math.round(h) };
  }, [loaded]);

  const draw = useCallback(() => {
    const cvs = canvasRef.current, img = imgRef.current;
    if (!cvs || !img) return;
    const { w, h } = getDisplaySize(), fs = s.frameSize;
    cvs.width = w + fs * 2; cvs.height = h + fs * 2;
    const ctx = cvs.getContext('2d');
    drawTransformed(ctx, img, w, h, cvs.width, cvs.height, s);
    applyPixelAdjustments(ctx, cvs.width, cvs.height, s.brightness, s.contrast, s.saturation);

    if (tool === 'crop' && s.cropRect) {
      const cr = s.cropRect;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, cvs.width, cr.y);
      ctx.fillRect(0, cr.y + cr.h, cvs.width, cvs.height - cr.y - cr.h);
      ctx.fillRect(0, cr.y, cr.x, cr.h);
      ctx.fillRect(cr.x + cr.w, cr.y, cvs.width - cr.x - cr.w, cr.h);
      ctx.strokeStyle = '#E8C547'; ctx.lineWidth = 1.5;
      ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.5;
      for (let t = 1; t <= 2; t++) {
        ctx.beginPath(); ctx.moveTo(cr.x + cr.w * t / 3, cr.y); ctx.lineTo(cr.x + cr.w * t / 3, cr.y + cr.h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cr.x, cr.y + cr.h * t / 3); ctx.lineTo(cr.x + cr.w, cr.y + cr.h * t / 3); ctx.stroke();
      }
    }
  }, [loaded, s, tool, getDisplaySize]);

  useEffect(() => { draw(); }, [draw]);

  /* Init crop rect when entering crop tool or changing ratio */
  useEffect(() => {
    if (tool !== 'crop') return;
    const cvs = canvasRef.current; if (!cvs) return;
    const cw = cvs.width, ch = cvs.height;
    if (s.cropRatio === null) {
      setS(p => ({ ...p, cropRect: { x: 0, y: 0, w: cw, h: ch } }));
    } else {
      let rw = cw, rh = cw / s.cropRatio;
      if (rh > ch) { rh = ch; rw = ch * s.cropRatio; }
      rw = Math.min(rw, cw); rh = Math.min(rh, ch);
      setS(p => ({ ...p, cropRect: { x: Math.round((cw - rw) / 2), y: Math.round((ch - rh) / 2), w: Math.round(rw), h: Math.round(rh) } }));
    }
  }, [tool, s.cropRatio]);

  /* Crop drag */
  const onCropMouseDown = (e) => {
    if (tool !== 'crop' || !s.cropRect) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top, cr = s.cropRect;
    if (mx >= cr.x && mx <= cr.x + cr.w && my >= cr.y && my <= cr.y + cr.h)
      setCropDrag({ startX: mx, startY: my, origRect: { ...cr } });
  };
  useEffect(() => {
    if (!cropDrag) return;
    const move = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = e.clientX - rect.left - cropDrag.startX, dy = e.clientY - rect.top - cropDrag.startY;
      const or = cropDrag.origRect, cw = canvasRef.current.width, ch = canvasRef.current.height;
      setS(p => ({ ...p, cropRect: { ...or, x: Math.max(0, Math.min(cw - or.w, or.x + dx)), y: Math.max(0, Math.min(ch - or.h, or.y + dy)) } }));
    };
    const up = () => setCropDrag(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [cropDrag]);

  const set = (k, v) => setS(p => ({ ...p, [k]: v }));
  const reset = () => setS({ ...DEFAULTS });
  const rotateBy = (deg) => set('rotation', ((s.rotation + deg) % 360 + 360) % 360);

  /* Export at full resolution */
  const handleApply = () => {
    const img = imgRef.current; if (!img) return;
    const srcW = img.naturalWidth, srcH = img.naturalHeight, fs = s.frameSize;
    const outW = srcW + fs * 2, outH = srcH + fs * 2;
    const out = document.createElement('canvas');
    out.width = outW; out.height = outH;
    const ctx = out.getContext('2d');
    drawTransformed(ctx, img, srcW, srcH, outW, outH, s);
    applyPixelAdjustments(ctx, outW, outH, s.brightness, s.contrast, s.saturation);

    const exportBlob = (canvas) => canvas.toBlob(blob => { if (blob) onSave(blob); }, 'image/jpeg', 0.92);
    if (s.cropRect && canvasRef.current) {
      const scX = outW / canvasRef.current.width, scY = outH / canvasRef.current.height, cr = s.cropRect;
      const cropped = document.createElement('canvas');
      cropped.width = Math.round(cr.w * scX); cropped.height = Math.round(cr.h * scY);
      cropped.getContext('2d').drawImage(out, cr.x * scX, cr.y * scY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
      exportBlob(cropped); return;
    }
    exportBlob(out);
  };

  const isDirty = JSON.stringify(s) !== JSON.stringify(DEFAULTS);

  const panels = {
    adjust: (
      <div style={{ padding: '8px 12px' }}>
        <Slider label="Luminosité" value={s.brightness} min={-50} max={50} onChange={v => set('brightness', v)} />
        <Slider label="Contraste" value={s.contrast} min={-50} max={50} onChange={v => set('contrast', v)} />
        <Slider label="Saturation" value={s.saturation} min={-50} max={50} onChange={v => set('saturation', v)} />
      </div>
    ),
    rotate: (
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <TinyBtn onClick={() => rotateBy(-90)}>{ICO.rotL} -90°</TinyBtn>
          <TinyBtn onClick={() => rotateBy(90)}>{ICO.rotR} +90°</TinyBtn>
          <TinyBtn active={s.flipH} onClick={() => set('flipH', !s.flipH)}>{ICO.flipH} Miroir</TinyBtn>
        </div>
        <Slider label="Micro-rot." value={s.microRot} min={-5} max={5} step={0.5} onChange={v => set('microRot', v)} />
      </div>
    ),
    crop: (
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RATIOS.map(r => <TinyBtn key={r.label} active={s.cropRatio === r.value} onClick={() => set('cropRatio', r.value)}>{r.label}</TinyBtn>)}
        </div>
        <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ext-fg-4)' }}>Glissez le cadre pour repositionner</div>
      </div>
    ),
    frame: (
      <div style={{ padding: '8px 12px' }}>
        <Slider label="Épaisseur" value={s.frameSize} min={0} max={30} onChange={v => set('frameSize', v)} />
        <div style={{ display: 'flex', gap: 6 }}>
          {FRAME_COLORS.map(fc => (
            <TinyBtn key={fc.value} active={s.frameColor === fc.value} onClick={() => set('frameColor', fc.value)}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: fc.value, border: '1px solid var(--ext-line-strong)' }} />
              {fc.label}
            </TinyBtn>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ext-bg)', color: 'var(--ext-fg)' }}>
      {/* Canvas area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, overflow: 'hidden', background: 'var(--ext-bg-2)', minHeight: 0 }}>
        {loaded ? (
          <canvas ref={canvasRef} onMouseDown={onCropMouseDown} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 'var(--r-sm)', cursor: tool === 'crop' ? 'move' : 'default', boxShadow: 'var(--shadow-2)' }} />
        ) : (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ext-fg-4)', letterSpacing: '0.1em' }}>CHARGEMENT...</div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 2, padding: '4px 8px', borderTop: '1px solid var(--ext-line)', background: 'var(--ext-bg)', justifyContent: 'center', flexShrink: 0 }}>
        {[['adjust','Ajuster'],['rotate','Rotation'],['crop','Recadrer'],['frame','Cadre']].map(([id, lbl]) => (
          <ToolTab key={id} icon={ICO[id]} label={lbl} active={tool === id} onClick={() => setTool(id)} />
        ))}
      </div>

      {/* Active tool panel */}
      <div style={{ borderTop: '1px solid var(--ext-line)', background: 'var(--ext-bg)', flexShrink: 0, minHeight: 64 }}>{panels[tool]}</div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid var(--ext-line)', background: 'var(--ext-bg)', flexShrink: 0 }}>
        {isDirty && (
          <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ext-fg-4)', textDecoration: 'underline', padding: 0 }}>Réinitialiser</button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Annuler</button>
        <button onClick={handleApply} className="btn btn-gold btn-sm" disabled={!loaded}>Appliquer</button>
      </div>
    </div>
  );
}
