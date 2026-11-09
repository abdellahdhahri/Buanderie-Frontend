import React from 'react';
import { Wallet } from 'lucide-react';

export const KpiCard = ({ label, value, icon, color, bg }) => (
  <div
    style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '14px',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(15,23,42,0.03)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '4px',
        background: color,
      }}
    />
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: color,
        fontSize: '0.72rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      <span
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </span>
      {label}
    </div>
    <strong
      style={{
        fontSize: '1.5rem',
        fontWeight: 800,
        color: '#0f172a',
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </strong>
  </div>
);

export const SectionTitle = ({ icon, title, inline = false }) => (
  <h4
    style={{
      margin: inline ? '0 0 12px 0' : '0 0 12px 0',
      fontSize: '0.75rem',
      fontWeight: 800,
      color: '#0794a4',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}
  >
    {icon}
    {title}
  </h4>
);

export const TopBarresList = ({ items, formatValue = (v) => v, max = 6 }) => {
  if (!items || items.length === 0) {
    return (
      <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
        Aucune donnée.
      </p>
    );
  }

  const PALETTE = [
    { bar: 'linear-gradient(90deg, #0aa8ba, #0794a4)', badge: '#e9f8fa', text: '#067a87' },
    { bar: 'linear-gradient(90deg, #6366f1, #4f46e5)', badge: '#eef2ff', text: '#4f46e5' },
    { bar: 'linear-gradient(90deg, #ec4899, #db2777)', badge: '#fdf2f8', text: '#db2777' },
    { bar: 'linear-gradient(90deg, #f59e0b, #d97706)', badge: '#fef3c7', text: '#b45309' },
    { bar: 'linear-gradient(90deg, #10b981, #059669)', badge: '#ecfdf5', text: '#047857' },
    { bar: 'linear-gradient(90deg, #8b5cf6, #7c3aed)', badge: '#f5f3ff', text: '#6d28d9' },
  ];

  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {items.slice(0, max).map((item, i) => {
        const colors = PALETTE[i % PALETTE.length];
        const widthPct = (item.value / maxValue) * 100;

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '10px 12px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.text + '55';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: colors.badge,
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    flexShrink: 0,
                    border: `1.5px solid ${colors.text}33`,
                  }}
                >
                  {i + 1}
                </span>

                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                <strong
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: colors.text,
                  }}
                >
                  {formatValue(item.value)}
                </strong>
                <small
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    fontWeight: 700,
                  }}
                >
                  {item.percent.toFixed(1)}%
                </small>
              </div>
            </div>

            <div
              style={{
                height: '6px',
                background: '#f1f5f9',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: colors.bar,
                  borderRadius: '999px',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const TopPersonnelList = ({ items, formatValue = (v) => v, percentLabel = 'des demandes' }) => {
  if (!items || items.length === 0) {
    return (
      <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
        Aucune donnée.
      </p>
    );
  }

  const AVATAR_COLORS = [
    { bg: 'linear-gradient(135deg, #0aa8ba, #0794a4)', ring: '#0aa8ba' },
    { bg: 'linear-gradient(135deg, #6366f1, #4f46e5)', ring: '#6366f1' },
    { bg: 'linear-gradient(135deg, #ec4899, #db2777)', ring: '#ec4899' },
  ];

  const getInitialsLocal = (fullName) => {
    const parts = (fullName || '?').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || '?').toUpperCase();
  };

  const ProgressRing = ({ percent, color, size = 64, thickness = 5 }) => {
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const dash = (percent / 100) * circumference;

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'rotate(-90deg)',
          pointerEvents: 'none',
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}
    >
      {items.slice(0, 3).map((item, i) => {
        const colorPair = AVATAR_COLORS[i % AVATAR_COLORS.length];
        const initials = getInitialsLocal(item.label);

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 10px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              textAlign: 'center',
              transition: 'all 0.25s ease',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.03)',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.08)';
              e.currentTarget.style.borderColor = colorPair.ring + '55';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(15, 23, 42, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '68px',
                height: '68px',
              }}
            >
              <ProgressRing percent={item.percent} color={colorPair.ring} />

              <div
                style={{
                  position: 'absolute',
                  inset: '6px',
                  borderRadius: '50%',
                  background: colorPair.bg,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  letterSpacing: '0.5px',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
                }}
              >
                {initials}
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  minWidth: '22px',
                  height: '22px',
                  padding: '0 5px',
                  borderRadius: '999px',
                  background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#ea580c',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                }}
              >
                {i + 1}
              </div>
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0f172a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                lineHeight: 1.3,
              }}
              title={item.label}
            >
              {item.label}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: colorPair.ring,
                  lineHeight: 1,
                }}
              >
                {formatValue(item.value)}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {item.percent.toFixed(0)}% {percentLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DetailRow = ({ label, value, subtitle, highlight = false, subtitleIcon = <Wallet size={13} /> }) => (
  <div
    style={{
      background: highlight ? '#f0fdfa' : '#f8fafc',
      border: highlight ? '1px solid #99f6e4' : '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}
  >
    <div
      style={{
        fontSize: '0.7rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: highlight ? '#0d9488' : '#94a3b8',
        marginBottom: '2px',
      }}
    >
      {label}
    </div>

    <div
      style={{
        fontSize: '1.05rem',
        fontWeight: 800,
        color: '#0f172a',
      }}
    >
      {value}
    </div>

    {subtitle && (
      <div
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: highlight ? '#0d9488' : '#64748b',
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {subtitleIcon}
        {subtitle}
      </div>
    )}
  </div>
);

export const DonutChart = ({ data, size = 200, thickness = 32, centerLabel, centerValue }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: '0.85rem',
          fontStyle: 'italic',
        }}
      >
        Aucune donnée
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={thickness}
      />

      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, i) => {
          if (d.value === 0) return null;
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const element = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-cumulativeOffset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
          cumulativeOffset += dash;
          return element;
        })}
      </g>

      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        style={{
          fontSize: size * 0.16,
          fontWeight: 800,
          fill: '#0f172a',
        }}
      >
        {centerValue ?? total}
      </text>
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        style={{
          fontSize: size * 0.065,
          fontWeight: 700,
          fill: '#94a3b8',
          letterSpacing: '0.08em',
        }}
      >
        {centerLabel ?? 'TOTAL'}
      </text>
    </svg>
  );
};

export const LegendeItem = ({ color, label, value, total }) => {
  const percent = total > 0 ? (value / total) * 100 : 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '4px',
            background: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#334155',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <strong style={{ fontSize: '1.15rem', fontWeight: 800, color }}>
          {value}
        </strong>
        <small
          style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}
        >
          {percent.toFixed(1)}%
        </small>
      </div>
    </div>
  );
};
