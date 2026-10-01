// ===== PRO STRIKER - icons.js =====
// All UI icons are real PNGs from Flaticon (images/icons/), credited on the
// CREDITS screen. The football itself is drawn procedurally (Cosmetics.ballSkinCanvas in
// shop.js); this file only handles UI icon badges.
console.log('[ProStriker] icons.js loaded');

const ICON_FILE_MAP = {
    play: 'play', pause: 'pause', home: 'home', arrowLeft: 'back',     goal: 'goal',
    gear: 'settings', shield: 'shield', hard: 'hard', elite: 'elite',
    worldClass: 'worldclass', halfDuration: 'halfduration',
    book: 'instructions', chart: 'statistics', trophy: 'trophy',
    worldCup: 'worldcup', shirt: '1vs1', vsComputer: '1vscomputer',
    volumeOn: 'volumeon', mute: 'mute',
    handshake: 'handshake', phone: 'phone', football: 'football'
};

const IconImages = { cache: {} };
function loadIconImg(file) {
    if (IconImages.cache[file]) return IconImages.cache[file];
    const img = new Image();
    img.src = `images/${file}.png`;
    IconImages.cache[file] = img;
    return img;
}
Object.values(ICON_FILE_MAP).forEach(loadIconImg);

// ===== FALLBACK VECTOR ICONS (icons with no PNG: flag/medium, cross, checkmark, speedometer/target) =====
const Icons = {
    paths: {
        flag: { type: 'compound', parts: [
            { d: 'M6 3 v18 h1.4 v-18 z', shade: 'dark' },
            { d: 'M7.4 4 h11 l-2.5 3 2.5 3 h-11 z', shade: 'light' }
        ]},
        cross: { type: 'stroke', d: 'M5 5 L19 19 M19 5 L5 19' },
        checkmark: { type: 'stroke', d: 'M4 12.5 L9.5 18 L20 5' },
        target: { type: 'ring', rings: [10, 6.5, 3] }
    },
    _cache: {},
    _getPath2D(key) {
        if (this._cache[key]) return this._cache[key];
        const def = this.paths[key];
        if (!def) return null;
        let built;
        if (def.type === 'compound') built = def.parts.map(p => ({ path: new Path2D(p.d), shade: p.shade }));
        else built = new Path2D(def.d);
        this._cache[key] = built;
        return built;
    }
};

function shadeColor(hex, percent) {
    if (!hex.startsWith('#')) return hex;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// Draws an icon centered at (x, y), fit inside a `size`x`size` box.
function drawIcon(ctxRef, name, x, y, size, color = '#ffffff', opts = {}) {
    const file = ICON_FILE_MAP[name];
    if (file) {
        const img = IconImages.cache[file] || loadIconImg(file);
        if (img.complete && img.naturalWidth > 0) {
            if (opts.glow) { ctxRef.save(); ctxRef.shadowColor = opts.glowColor || color; ctxRef.shadowBlur = opts.glowBlur || 8; }
            ctxRef.drawImage(img, x - size / 2, y - size / 2, size, size);
            if (opts.glow) ctxRef.restore();
            return;
        }
    }

    // The football icon has a procedural fallback: if images/football.png is
    // missing or blocked (e.g. a different asset path on a portal), draw the
    // real ball sprite instead of nothing.
    if (name === 'football' && typeof Cosmetics !== 'undefined') {
        const ball = Cosmetics.ballSkinCanvas('classic');
        if (ball) { ctxRef.drawImage(ball, x - size / 2, y - size / 2, size, size); return; }
    }

    // 'target' is procedural rings, not a static path
    if (name === 'target') {
        const rings = Icons.paths.target.rings;
        const scale = size / 24;
        ctxRef.save();
        ctxRef.translate(x, y);
        ctxRef.scale(scale, scale);
        ctxRef.translate(-12, -12);
        ctxRef.strokeStyle = color;
        rings.forEach((r, i) => {
            ctxRef.lineWidth = i === rings.length - 1 ? 0 : 1.6;
            ctxRef.beginPath();
            ctxRef.arc(12, 12, r, 0, Math.PI * 2);
            if (i === rings.length - 1) { ctxRef.fillStyle = color; ctxRef.fill(); }
            else ctxRef.stroke();
        });
        ctxRef.restore();
        return;
    }

    const def = Icons.paths[name];
    if (!def) return;

    const scale = size / 24;
    ctxRef.save();
    ctxRef.translate(x - size / 2, y - size / 2);
    ctxRef.scale(scale, scale);
    if (opts.glow) { ctxRef.shadowColor = opts.glowColor || color; ctxRef.shadowBlur = opts.glowBlur || 8; }

    if (def.type === 'stroke') {
        const p = Icons._getPath2D(name);
        ctxRef.strokeStyle = color;
        ctxRef.lineWidth = opts.lineWidth || 2.4;
        ctxRef.lineCap = 'round'; ctxRef.lineJoin = 'round';
        ctxRef.stroke(p);
    } else if (def.type === 'compound') {
        const built = Icons._getPath2D(name);
        const darkColor = shadeColor(color, -35);
        built.forEach(part => {
            ctxRef.fillStyle = part.shade === 'dark' ? darkColor : color;
            ctxRef.fill(part.path);
        });
    }
    ctxRef.restore();
}