// ===== PRO STRIKER - credits.js =====
console.log('[ProStriker] credits.js loaded');

const CREDITS_LIST = [
        { icon: 'goal',          label: 'Game Icon',        author: 'Magnific' },
    { icon: 'football',      label: 'Football',        author: 'ranksol graphics' },
    { icon: 'play',          label: 'Play',             author: 'hqrloveq' },
    { icon: 'pause',         label: 'Pause',            author: 'hqrloveq' },
    { icon: 'home',          label: 'Home',             author: 'Magnific' },
    { icon: 'back',          label: 'Back',             author: 'riajulislam' },
    { icon: 'settings',      label: 'Settings',         author: 'Magnific' },
    { icon: 'shield',        label: 'Easy Mode',        author: 'Iyahicon' },
    { icon: 'hard',          label: 'Hard Mode',        author: 'hqrloveq' },
    { icon: 'elite',         label: 'Elite Mode',       author: 'jithgnair' },
    { icon: 'worldclass',    label: 'World Class Mode', author: 'Magnific' },
    { icon: 'halfduration',  label: 'Half Duration',    author: 'Magnific' },
    { icon: 'instructions',  label: 'Instructions',     author: 'Magnific' },
    { icon: 'statistics',    label: 'Statistics',       author: 'Magnific' },
    { icon: 'trophy',        label: 'Trophy',           author: 'Magnific' },
    { icon: 'worldcup',      label: 'World Cup',        author: 'cube29' },
    { icon: '1vs1',          label: '1 vs 1',           author: 'tulpahn' },
    { icon: '1vscomputer',   label: 'Vs Computer',      author: 'Magnific' },
    { icon: 'volumeon',      label: 'Volume On',        author: 'apien' },
    { icon: 'mute',          label: 'Mute',             author: 'apien' },
    { icon: 'handshake',     label: 'Draw',             author: 'Magnific' },
    { icon: 'phone',         label: 'Rotate Device',    author: 'Magnific' },

    // ----- Tournament striker flags (images/flags/) -----
    { header: 'STRIKER FLAGS' },
    { icon: 'flags/algeria', label: "Algeria Flag", author: 'iconset.co' },
    { icon: 'flags/argentina', label: "Argentina Flag", author: 'iconset.co' },
    { icon: 'flags/australia', label: "Australia Flag", author: 'iconset.co' },
    { icon: 'flags/austria', label: "Austria Flag", author: 'Xinh Studio' },
    { icon: 'flags/belgium', label: "Belgium Flag", author: 'Xinh Studio' },
    { icon: 'flags/brazil', label: "Brazil Flag", author: 'Dighital' },
    { icon: 'flags/canada', label: "Canada Flag", author: 'silanti' },
    { icon: 'flags/colombia', label: "Colombia Flag", author: 'iconset.co' },
    { icon: 'flags/croatia', label: "Croatia Flag", author: 'iconset.co' },
    { icon: 'flags/cote-d-ivoire', label: "Côte d'Ivoire Flag", author: 'Xinh Studio' },
    { icon: 'flags/denmark', label: "Denmark Flag", author: 'iconset.co' },
    { icon: 'flags/ecuador', label: "Ecuador Flag", author: 'Xinh Studio' },
    { icon: 'flags/egypt', label: "Egypt Flag", author: 'Xinh Studio' },
    { icon: 'flags/england', label: "England Flag", author: 'Xinh Studio' },
    { icon: 'flags/france', label: "France Flag", author: 'Xinh Studio' },
    { icon: 'flags/germany', label: "Germany Flag", author: 'Xinh Studio' },
    { icon: 'flags/iran', label: "Iran Flag", author: 'iconset.co' },
    { icon: 'flags/italy', label: "Italy Flag", author: 'Dighital' },
    { icon: 'flags/japan', label: "Japan Flag", author: 'Roundicons' },
    { icon: 'flags/mexico', label: "Mexico Flag", author: 'iconset.co' },
    { icon: 'flags/morocco', label: "Morocco Flag", author: 'iconset.co' },
    { icon: 'flags/netherlands', label: "Netherlands Flag", author: 'iconset.co' },
    { icon: 'flags/nigeria', label: "Nigeria Flag", author: 'Roundicons' },
    { icon: 'flags/norway', label: "Norway Flag", author: 'Dighital' },
    { icon: 'flags/portugal', label: "Portugal Flag", author: 'iconset.co' },
    { icon: 'flags/senegal', label: "Senegal Flag", author: 'Xinh Studio' },
    { icon: 'flags/south-korea', label: "South Korea Flag", author: 'iconset.co' },
    { icon: 'flags/spain', label: "Spain Flag", author: 'Xinh Studio' },
    { icon: 'flags/switzerland', label: "Switzerland Flag", author: 'iconset.co' },
    { icon: 'flags/turkiye', label: "Türkiye Flag", author: 'iconset.co' },
    { icon: 'flags/uruguay', label: "Uruguay Flag", author: 'iconset.co' },
    { icon: 'flags/usa', label: "USA Flag", author: 'Dighital' },

    // ----- Additional flag artwork credited (no icon shown: not used in-game) -----
    { label: "Additional flag artwork", author: 'iconsimple' },
    { label: "Additional flag artwork", author: 'indielogy' }
];

function drawCreditsScreen() {
    themeBackdrop();
    ctx.save();
    themeCard(140, 40, 620, 500, 24, THEME.gold);
    ctx.textAlign = 'center';
    themeTitle('football', 'CREDITS', 450, 90, THEME.gold, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('All icons via Flaticon.com — credited to their authors below', 450, 112);

    const rowH = 34;
    const listTop = 130;
    const listBottom = 500;
    const totalH = CREDITS_LIST.length * rowH;

    if (typeof window._creditsScrollOffset === 'undefined') window._creditsScrollOffset = 0;
    const maxScroll = Math.max(0, totalH - (listBottom - listTop) + 10);
    if (window._creditsScrollOffset > maxScroll) window._creditsScrollOffset = maxScroll;
    if (window._creditsScrollOffset < 0) window._creditsScrollOffset = 0;
    const scrollY = window._creditsScrollOffset;

    ctx.save();
    ctx.beginPath();
    ctx.rect(160, listTop, 580, listBottom - listTop);
    ctx.clip();

    CREDITS_LIST.forEach((c, i) => {
        const y = listTop + i * rowH - scrollY;
        if (y + rowH < listTop || y > listBottom) return;

        if (c.header) {
            ctx.textAlign = 'center';
            ctx.fillStyle = THEME.gold;
            ctx.font = '800 13px Outfit, sans-serif';
            ctx.fillText(c.header, 450, y + 22);
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(190, y + 28, 520, 1);
            return;
        }

        if (c.icon && c.icon.startsWith('flags/')) {
            const file = `${c.icon.slice('flags/'.length)}.png`;
            const team = TOURNAMENT_TEAMS.find(t => TEAM_FLAG_FILES[t.name] === file);
            if (team) drawTeamFlag(team, 190, y + 24, 26, 'left');
        } else if (c.icon) {
            const iconImg = IconImages.cache[c.icon] || loadIconImg(c.icon);
            if (iconImg.complete && iconImg.naturalWidth > 0) {
                ctx.drawImage(iconImg, 190, y + 3, 26, 26);
            }
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '600 14px Outfit, sans-serif';
        ctx.fillText(c.label, 230, y + 20);

        ctx.textAlign = 'right';
        ctx.fillStyle = THEME.gold;
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.fillText(c.author, 710, y + 20);
    });
    ctx.restore();

    if (totalH > (listBottom - listTop)) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(725, listTop, 8, listBottom - listTop, 4);
        ctx.fill();
        const trackH = listBottom - listTop;
        const thumbH = Math.max(24, trackH * (trackH / totalH));
        const thumbY = listTop + (trackH - thumbH) * (scrollY / maxScroll);
        ctx.fillStyle = THEME.gold;
        ctx.beginPath();
        ctx.roundRect(725, thumbY, 8, thumbH, 4);
        ctx.fill();
    }

    window._backBtn = themeBackButton(350, 508, 200, 25);
    ctx.restore();
}