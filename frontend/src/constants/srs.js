// src/constants/srs.js

export const SRS_SECONDS = {
  0: 0,
  1: 20 * 60,
  2: 10 * 3600,
  3: 24 * 3600,
  4: 24 * 3600,
  5: 3 * 86400,
  6: 5 * 86400
};

export const SRS_LABELS = {
  0: 'Chưa học',
  1: '🌱 Mới học',
  2: '📗 Biết',
  3: '📘 Gần thuộc',
  4: '📙 Đã thuộc',
  5: '📕 Nhớ dai',
  6: '🏆 Không quên'
};

export const SRS_INTERVAL_LABEL = {
  1: '20 phút',
  2: '10 giờ',
  3: '1 ngày',
  4: '1 ngày',
  5: '3 ngày',
  6: '5 ngày'
};

export const SRS_TRANSITION = {
  1: 'LV1 → LV2',
  2: 'LV2 → LV3',
  3: 'LV3 → LV4',
  4: 'LV4 → LV5',
  5: 'LV5 → LV6',
  6: 'LV6 ✓'
};

export const LV_COLORS = {
  0: '#8892b0',
  1: '#10b981',
  2: '#06b6d4',
  3: '#a5b4fc',
  4: '#fbbf24',
  5: '#f97316',
  6: '#f43f5e'
};

export const LV_BG = {
  0: 'rgba(255,255,255,0.08)',
  1: 'rgba(16,185,129,0.12)',
  2: 'rgba(99,102,241,0.15)',
  3: 'rgba(245,158,11,0.15)',
  4: 'rgba(248,113,113,0.12)',
  5: 'rgba(139,92,246,0.15)',
  6: 'rgba(6,182,212,0.12)'
};

export const LV_CFG = {
  0: { label: 'Mới', bg: LV_BG[0], color: LV_COLORS[0] },
  1: { label: 'Lv1', bg: LV_BG[1], color: LV_COLORS[1] },
  2: { label: 'Lv2', bg: LV_BG[2], color: LV_COLORS[2] },
  3: { label: 'Lv3', bg: LV_BG[3], color: LV_COLORS[3] },
  4: { label: 'Lv4', bg: LV_BG[4], color: LV_COLORS[4] },
  5: { label: 'Lv5', bg: LV_BG[5], color: LV_COLORS[5] },
  6: { label: 'Lv6', bg: LV_BG[6], color: LV_COLORS[6] }
};

// ============================================
// ✅ THÊM 2 HÀM NÀY
// ============================================

export function getNextReview(level, fromDate = new Date()) {
  const seconds = SRS_SECONDS[level] || 0;
  return new Date(fromDate.getTime() + seconds * 1000);
}

export function getNextLevel(currentLevel, action) {
  switch (action) {
    case 'complete':
      return Math.min(currentLevel + 1, 6);
    case 'demote':
      return Math.max(currentLevel - 1, 1);
    case 'reset':
      return 1;
    default:
      return currentLevel;
  }
}

export function formatNextReview(ms) {
  const d = new Date(ms);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / 86400000);
  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  if (diffDays === 0) return `${timeStr} hôm nay`;
  if (diffDays === 1) return `${timeStr} ngày mai`;
  return `${timeStr}, ${dateStr}`;
}