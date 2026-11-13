import React, { useMemo, useState } from 'react';
import { Download, Plus, Shield, Sparkles, CheckCircle2, Lock } from 'lucide-react';

const getAvatarUrl = (player) => {
  if (player?.avatar_url && typeof player.avatar_url === 'string' && player.avatar_url.trim() !== '') {
    return player.avatar_url;
  }
  const cleanName = encodeURIComponent(player?.name || 'NFL');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=0a0f1d&color=38bdf8&bold=true&size=128`;
};

const getLastName = (fullName) => {
  if (!fullName) return 'Unassigned';
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const suffixes = new Set(['Jr.', 'Jr', 'Sr.', 'Sr', 'II', 'III', 'IV', 'V']);
  if (parts.length >= 3 && suffixes.has(parts[parts.length - 1])) {
    return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
  }
  if (parts.length >= 3 && parts[parts.length - 2] === 'St.') {
    return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
  }
  return parts[parts.length - 1];
};

const getInitials = (fullName) => {
  if (!fullName) return '+';
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const getJerseyLabel = (player) => {
  if (!player) return '--';
  if (player.jersey_number !== undefined && player.jersey_number !== null && player.jersey_number !== 0) {
    return `#${player.jersey_number}`;
  }
  if (player.number && player.number !== '--') {
    return String(player.number).startsWith('#') ? player.number : `#${player.number}`;
  }
  return 'UNIT';
};

// Coordinates in (x%, y%) inside the turf zone
const FORMATION_COORDINATES = {
  'Offensive Spread 11': [
    { x: 50, y: 71, role: 'QB' },      // 0: QB in shotgun
    { x: 37, y: 74, role: 'RB' },      // 1: RB offset
    { x: 10, y: 55, role: 'WR1' },     // 2: WR1 wide left
    { x: 23, y: 61, role: 'WR2' },     // 3: WR2 slot left
    { x: 90, y: 55, role: 'WR3' },     // 4: WR3 wide right
    { x: 80, y: 63, role: 'WR4' },     // 5: WR4 slot right
    { x: 73, y: 55, role: 'TE' },      // 6: TE on the line
    { x: 64, y: 70, role: 'FLEX1' },   // 7: FLEX1 H-back/wing
    { x: 50, y: 86, role: 'FLEX2' },   // 8: FLEX2 deep weapon
    { x: 18, y: 85, role: 'K' },       // 9: Kicker
    { x: 82, y: 85, role: 'DST' }      // 10: DST unit
  ],
  '4-3 Defense': [
    { x: 31, y: 57, role: 'LDE' },     // 0: LDE
    { x: 43, y: 57, role: 'DT1' },     // 1: DT1
    { x: 57, y: 57, role: 'DT2' },     // 2: DT2
    { x: 69, y: 57, role: 'RDE' },     // 3: RDE
    { x: 32, y: 40, role: 'WLB' },     // 4: WLB
    { x: 50, y: 39, role: 'MLB' },     // 5: MLB
    { x: 68, y: 40, role: 'SLB' },     // 6: SLB
    { x: 12, y: 43, role: 'CB1' },     // 7: CB1
    { x: 88, y: 43, role: 'CB2' },     // 8: CB2
    { x: 35, y: 21, role: 'FS' },      // 9: FS
    { x: 65, y: 22, role: 'SS' }       // 10: SS
  ],
  'Fantasy Superflex 11': [
    { x: 42, y: 69, role: 'QB' },        // 0: QB
    { x: 58, y: 69, role: 'SUPERFLEX' }, // 1: SUPERFLEX
    { x: 24, y: 79, role: 'RB1' },       // 2: RB1
    { x: 76, y: 79, role: 'RB2' },       // 3: RB2
    { x: 11, y: 52, role: 'WR1' },       // 4: WR1
    { x: 33, y: 50, role: 'WR2' },       // 5: WR2
    { x: 89, y: 52, role: 'WR3' },       // 6: WR3
    { x: 67, y: 50, role: 'TE' },        // 7: TE
    { x: 24, y: 30, role: 'FLEX1' },     // 8: FLEX1
    { x: 50, y: 27, role: 'FLEX2' },     // 9: FLEX2
    { x: 76, y: 30, role: 'DST' }        // 10: DST
  ]
};

// 5-Man Offensive Line visual anchor markers for Offensive Spread 11
const OFFENSIVE_LINE_ANCHORS = [
  { label: 'LT', x: 35, y: 55 },
  { label: 'LG', x: 42.5, y: 55 },
  { label: 'C', x: 50, y: 55 },
  { label: 'RG', x: 57.5, y: 55 },
  { label: 'RT', x: 65, y: 55 }
];

const LOS_PERCENT = {
  'Offensive Spread 11': 55,
  '4-3 Defense': 60,
  'Fantasy Superflex 11': 56
};

export default function TacticalFieldDiagram({
  lineupName = 'Championship Roster 2026',
  formation = 'Offensive Spread 11',
  slots = [],
  avgRating = '0.00',
  isFinalized = false,
  onSlotClick
}) {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const coords = useMemo(() => {
    return FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['Offensive Spread 11'];
  }, [formation]);

  const losY = LOS_PERCENT[formation] ?? 55;
  const filledCount = useMemo(() => slots.filter((s) => Boolean(s?.player)).length, [slots]);

  // Zero-dependency HTML5 Canvas 2D PNG Exporter (pure vector/text to guarantee zero CORS taint)
  const handleDownloadPng = () => {
    setExporting(true);
    try {
      const width = 1200;
      const height = 750;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setExporting(false);
        return;
      }

      // 1. Outer Stadium Frame
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#070b16');
      bgGrad.addColorStop(1, '#0a0f1d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Top Branding & Metadata Header Bar
      const headerHeight = 92;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, headerHeight);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight);
      ctx.lineTo(width, headerHeight);
      ctx.stroke();

      // GRIDIRON HUB 2026 Pill
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(32, 22, 198, 28, 5);
      ctx.fill();

      ctx.fillStyle = '#0a0f1d';
      ctx.font = '900 14px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GRIDIRON HUB 2026', 131, 36);

      // Roster Title
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 30px "Teko", "Chakra Petch", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(lineupName || 'Custom Lineup').toUpperCase().slice(0, 36), 248, 36);

      // Subtitle Formation
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 14px "Chakra Petch", sans-serif';
      ctx.fillText(`FORMATION: ${formation.toUpperCase()}  •  ${filledCount}/11 STARTERS`, 32, 70);

      // Avg Rating Badge on right
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(width - 236, 20, 204, 52, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 11px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AVG PERFORMANCE RATING', width - 134, 34);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 22px "Chakra Petch", sans-serif';
      ctx.fillText(`${avgRating} / 5.00`, width - 134, 56);

      // 3. Field Turf Dimensions
      const fieldX = 48;
      const fieldY = 114;
      const fieldW = width - 96;
      const fieldH = height - 142;

      // End zones (top & bottom)
      const ezHeight = 52;
      const playTop = fieldY + ezHeight;
      const playBottom = fieldY + fieldH - ezHeight;
      const playH = playBottom - playTop;

      // Alternating dark stadium turf bands (10-yard increments)
      const bandCount = 10;
      const bandH = playH / bandCount;
      for (let i = 0; i < bandCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#0b1d22' : '#0e2429';
        ctx.fillRect(fieldX, playTop + i * bandH, fieldW, bandH);
      }

      // Top & Bottom End Zone fills
      ctx.fillStyle = '#111827';
      ctx.fillRect(fieldX, fieldY, fieldW, ezHeight);
      ctx.fillRect(fieldX, playBottom, fieldW, ezHeight);

      // End zone labels
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.font = '900 26px "Teko", "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GRIDIRON HUB • TACTICAL END ZONE', fieldX + fieldW / 2, fieldY + ezHeight / 2);
      ctx.fillText('2026 OFFENSIVE / DEFENSIVE BACKFIELD', fieldX + fieldW / 2, playBottom + ezHeight / 2);

      // Yard lines & Yard numbers
      const yardLabels = ['10', '20', '30', '40', '50', '40', '30', '20', '10'];
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.26)';
      ctx.lineWidth = 1.5;

      for (let i = 0; i <= bandCount; i++) {
        const yPos = playTop + i * bandH;
        ctx.beginPath();
        ctx.moveTo(fieldX, yPos);
        ctx.lineTo(fieldX + fieldW, yPos);
        ctx.stroke();

        if (i >= 1 && i <= 9) {
          const label = yardLabels[i - 1];
          ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
          ctx.font = '800 18px "Chakra Petch", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(label, fieldX + 22, yPos);
          ctx.textAlign = 'right';
          ctx.fillText(label, fieldX + fieldW - 22, yPos);
        }
      }

      // Hash marks along center lanes
      const leftHashX = fieldX + fieldW * 0.41;
      const rightHashX = fieldX + fieldW * 0.59;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 1.5;
      for (let step = 1; step < 50; step++) {
        if (step % 5 === 0) continue;
        const hy = playTop + (step / 50) * playH;
        ctx.beginPath();
        ctx.moveTo(leftHashX - 6, hy);
        ctx.lineTo(leftHashX + 6, hy);
        ctx.moveTo(rightHashX - 6, hy);
        ctx.lineTo(rightHashX + 6, hy);
        ctx.stroke();
      }

      // Outer field boundary
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(fieldX, fieldY, fieldW, fieldH);

      // Line of Scrimmage (Electric Ice Blue dashed)
      const losPxY = fieldY + (losY / 100) * fieldH;
      ctx.save();
      ctx.setLineDash([10, 6]);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fieldX, losPxY);
      ctx.lineTo(fieldX + fieldW, losPxY);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 11px "Chakra Petch", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('LINE OF SCRIMMAGE', fieldX + 12, losPxY - 11);

      // Decorative 5-Man OL anchors on Offensive Spread 11
      if (formation === 'Offensive Spread 11') {
        OFFENSIVE_LINE_ANCHORS.forEach((ol) => {
          const ox = fieldX + (ol.x / 100) * fieldW;
          const oy = fieldY + (ol.y / 100) * fieldH;
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ox, oy, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '800 10px "Chakra Petch", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ol.label, ox, oy);
        });
      }

      // 4. Draw 11 Starter Player Tokens
      slots.slice(0, 11).forEach((slotItem, idx) => {
        const pos = coords[idx] || { x: 50, y: 50 };
        const px = fieldX + (pos.x / 100) * fieldW;
        const py = fieldY + (pos.y / 100) * fieldH;
        const player = slotItem?.player;
        const slotLabel = slotItem?.slotName || pos.role || `S${idx + 1}`;

        if (player) {
          // Glow ring
          ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
          ctx.beginPath();
          ctx.arc(px, py, 30, 0, Math.PI * 2);
          ctx.fill();

          // Token circle
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(px, py, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Initials inside circle
          ctx.fillStyle = '#38bdf8';
          ctx.font = '900 16px "Chakra Petch", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(getInitials(player.name), px, py - 2);

          // Jersey number mini badge below initials
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '700 10px "Chakra Petch", sans-serif';
          ctx.fillText(getJerseyLabel(player), px, py + 13);

          // Slot/Pos pill top-right
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(px + 12, py - 30, 38, 16, 4);
          ctx.fill();
          ctx.fillStyle = '#0a0f1d';
          ctx.font = '900 10px "Chakra Petch", sans-serif';
          ctx.fillText(slotLabel.slice(0, 5), px + 31, py - 22);

          // Rating pill top-left
          const ratingStr = Number(player.player_performance_rating || 4.0).toFixed(2);
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.roundRect(px - 48, py - 30, 34, 16, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 10px "Chakra Petch", sans-serif';
          ctx.fillText(ratingStr, px - 31, py - 22);

          // Player Last Name nameplate below circle
          const nameText = getLastName(player.name).slice(0, 14);
          ctx.font = '800 12px "Chakra Petch", sans-serif';
          const textW = Math.max(76, ctx.measureText(nameText).width + 16);
          ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(px - textW / 2, py + 28, textW, 20, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(nameText, px, py + 38);
        } else {
          // Empty slot dashed circle
          ctx.save();
          ctx.setLineDash([5, 4]);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = '#94a3b8';
          ctx.font = '800 11px "Chakra Petch", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`+ ${slotLabel}`, px, py);
        }
      });

      const safeFilename = (lineupName || 'gridiron-roster')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'gridiron-roster';

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${safeFilename}-lineup.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus('✓ Downloaded PNG Lineup Card');
      setTimeout(() => setExportStatus(null), 3500);
    } catch (err) {
      console.warn('PNG Lineup Card export notice:', err);
      setExportStatus('Unable to export PNG');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 12,
        padding: '1.15rem',
        marginBottom: '2rem',
        boxShadow: '0 14px 34px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Tactical Field Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
          marginBottom: '1rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.22)'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-tech)',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.05em'
            }}
          >
            <Sparkles size={14} /> 2D TACTICAL FIELD FORMATION • {formation.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
            {isFinalized
              ? 'Roster locked — unlock to swap players on the field, or export your graphic card.'
              : 'Click any player token or dashed slot directly on the turf to assign or swap starters.'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {exportStatus && (
            <span
              style={{
                fontFamily: 'var(--font-tech)',
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#4ade80',
                backgroundColor: 'rgba(34, 197, 94, 0.14)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                padding: '5px 10px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <CheckCircle2 size={13} /> {exportStatus}
            </span>
          )}

          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadPng}
            style={{
              backgroundColor: '#38bdf8',
              color: '#0a0f1d',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.84rem',
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              cursor: exporting ? 'wait' : 'pointer',
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.3)'
            }}
          >
            <Download size={16} />
            {exporting ? 'Rendering 1200x750 PNG...' : 'Download Lineup Card (PNG)'}
          </button>
        </div>
      </div>

      {/* Responsive 2D Stadium Turf Container */}
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            minWidth: 680,
            height: 620,
            borderRadius: 10,
            border: '2px solid rgba(203, 213, 225, 0.45)',
            overflow: 'hidden',
            backgroundColor: '#0b1d22',
            userSelect: 'none'
          }}
        >
          {/* Top End Zone */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '8.5%',
              backgroundColor: '#111827',
              borderBottom: '2px solid rgba(203, 213, 225, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              letterSpacing: '0.28em',
              color: 'rgba(56, 189, 248, 0.35)',
              pointerEvents: 'none'
            }}
          >
            GRIDIRON HUB • STADIUM END ZONE
          </div>

          {/* 10 Alternating Turf Yard Bands */}
          <div
            style={{
              position: 'absolute',
              top: '8.5%',
              bottom: '8.5%',
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'none'
            }}
          >
            {['10', '20', '30', '40', '50', '40', '30', '20', '10', ''].map((yardLabel, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: i % 2 === 0 ? 'rgba(13, 35, 41, 0.92)' : 'rgba(10, 27, 33, 0.95)',
                  borderBottom: i < 9 ? '1px solid rgba(148, 163, 184, 0.22)' : 'none',
                  position: 'relative'
                }}
              >
                {yardLabel && (
                  <>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -10,
                        left: 18,
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: 'rgba(203, 213, 225, 0.32)'
                      }}
                    >
                      {yardLabel}
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -10,
                        right: 18,
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: 'rgba(203, 213, 225, 0.32)'
                      }}
                    >
                      {yardLabel}
                    </span>
                  </>
                )}

                {/* Hash mark lane ticks */}
                <div
                  style={{
                    position: 'absolute',
                    left: '41%',
                    top: '25%',
                    width: 10,
                    height: 1,
                    backgroundColor: 'rgba(148, 163, 184, 0.22)'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '41%',
                    top: '65%',
                    width: 10,
                    height: 1,
                    backgroundColor: 'rgba(148, 163, 184, 0.22)'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '41%',
                    top: '25%',
                    width: 10,
                    height: 1,
                    backgroundColor: 'rgba(148, 163, 184, 0.22)'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '41%',
                    top: '65%',
                    width: 10,
                    height: 1,
                    backgroundColor: 'rgba(148, 163, 184, 0.22)'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Bottom End Zone */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '8.5%',
              backgroundColor: '#111827',
              borderTop: '2px solid rgba(203, 213, 225, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.25rem',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#94a3b8',
              pointerEvents: 'none'
            }}
          >
            <span>{lineupName}</span>
            <span style={{ color: 'rgba(56, 189, 248, 0.55)', letterSpacing: '0.18em' }}>2026 TACTICAL PLAYBOOK</span>
            <span>AVG: {avgRating} / 5.00</span>
          </div>

          {/* Line of Scrimmage Indicator */}
          <div
            style={{
              position: 'absolute',
              top: `${losY}%`,
              left: 0,
              right: 0,
              borderTop: '2px dashed #38bdf8',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.45)',
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: -20,
                backgroundColor: 'rgba(10, 15, 29, 0.9)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 4,
                padding: '1px 7px',
                fontFamily: 'var(--font-tech)',
                fontSize: '0.64rem',
                fontWeight: 800,
                letterSpacing: '0.06em'
              }}
            >
              LINE OF SCRIMMAGE
            </span>
          </div>

          {/* Decorative 5-Man Offensive Line for Offensive Spread 11 */}
          {formation === 'Offensive Spread 11' &&
            OFFENSIVE_LINE_ANCHORS.map((ol) => (
              <div
                key={ol.label}
                title={`Offensive Line (${ol.label})`}
                style={{
                  position: 'absolute',
                  left: `${ol.x}%`,
                  top: `${ol.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: '#1e293b',
                  border: '1.5px solid #64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  color: '#cbd5e1',
                  zIndex: 3,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.45)'
                }}
              >
                {ol.label}
              </div>
            ))}

          {/* 11 Interactive Player Nodes */}
          {slots.slice(0, 11).map((slotItem, index) => {
            const pos = coords[index] || { x: 50, y: 50, role: `S${index + 1}` };
            const player = slotItem?.player;
            const slotName = slotItem?.slotName || pos.role;

            return (
              <button
                key={slotItem?.slotId || index}
                type="button"
                disabled={isFinalized}
                onClick={() => !isFinalized && onSlotClick && onSlotClick(index)}
                title={
                  isFinalized
                    ? `${slotName}: ${player?.name || 'Empty'} (Roster Locked)`
                    : player
                    ? `Click to swap ${slotName} (${player.name})`
                    : `Click to add ${slotName}`
                }
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: isFinalized ? 'default' : 'pointer',
                  zIndex: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                {player ? (
                  <>
                    {/* Avatar Circle + Rating + Position Pill */}
                    <div style={{ position: 'relative', width: 52, height: 52 }}>
                      <img
                        src={getAvatarUrl(player)}
                        alt={player.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            player.name || 'NFL'
                          )}&background=0a0f1d&color=38bdf8&bold=true&size=128`;
                        }}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2.5px solid #38bdf8',
                          backgroundColor: '#0a0f1d',
                          boxShadow: '0 0 14px rgba(56, 189, 248, 0.35)'
                        }}
                      />

                      {/* Performance Rating Badge (Top Left) */}
                      <span
                        style={{
                          position: 'absolute',
                          top: -6,
                          left: -12,
                          backgroundColor: '#15803d',
                          color: '#ffffff',
                          border: '1px solid #4ade80',
                          borderRadius: 4,
                          padding: '1px 4px',
                          fontFamily: 'var(--font-tech)',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          lineHeight: 1.15
                        }}
                      >
                        {Number(player.player_performance_rating || 4.0).toFixed(2)}
                      </span>

                      {/* Position Tag (Top Right) */}
                      <span
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -12,
                          backgroundColor: '#38bdf8',
                          color: '#0a0f1d',
                          borderRadius: 4,
                          padding: '1px 5px',
                          fontFamily: 'var(--font-tech)',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          lineHeight: 1.15
                        }}
                      >
                        {player.pos || player.position || slotName}
                      </span>

                      {/* Jersey Number Pill (Bottom Center overlap) */}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: -5,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#0a0f1d',
                          color: '#cbd5e1',
                          border: '1px solid rgba(148, 163, 184, 0.5)',
                          borderRadius: 999,
                          padding: '0px 6px',
                          fontFamily: 'var(--font-tech)',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {getJerseyLabel(player)}
                      </span>
                    </div>

                    {/* Player Last Name Pill */}
                    <div
                      style={{
                        marginTop: 3,
                        backgroundColor: 'rgba(10, 15, 29, 0.94)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: 4,
                        padding: '2px 7px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        maxWidth: 112,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.55)'
                      }}
                    >
                      {getLastName(player.name)}
                    </div>
                  </>
                ) : (
                  /* Empty Dashed Tactical Node */
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        border: '2px dashed #38bdf8',
                        backgroundColor: 'rgba(10, 15, 29, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        boxShadow: '0 0 10px rgba(56, 189, 248, 0.18)'
                      }}
                    >
                      {isFinalized ? <Lock size={16} /> : <Plus size={18} strokeWidth={2.5} />}
                    </div>
                    <span
                      style={{
                        backgroundColor: 'rgba(10, 15, 29, 0.92)',
                        border: '1px dashed rgba(56, 189, 248, 0.5)',
                        borderRadius: 4,
                        padding: '2px 7px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: '#38bdf8',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Add {slotName}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
