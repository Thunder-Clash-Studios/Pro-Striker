// ===== PRO STRIKER - sound.js =====
console.log('[ProStriker] sound.js loaded');

function resolveAssetUrl(path) {
    try {
        return new URL(path, window.location.href).href;
    } catch (e) {
        return path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
    }
}

const SoundManager = {
    sounds: {},
    musicEnabled: true,
    sfxEnabled: true,
    isMusicPlaying: false,
    currentMusic: null,
    initialized: false,
    crowdPlaying: false,
    autoplayAttempted: false,
    pendingAutoplay: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        const files = {
            menuMusic: 'sounds/Game music.mp3',
            crowd: 'sounds/When game is in play crowd sound.mp3',
            victory: 'sounds/Victory music.mp3',
            defeat: 'sounds/Defeat music.mp3',
            kick: 'sounds/kick sound.mp3',
            goalCheer: 'sounds/Goal scored cheering.mp3',
            goalNet: 'sounds/Goal strike the net sound.mp3',
            whistleStart: 'sounds/Referee whistle game starting.mp3',
            whistleStop: 'sounds/Referee whistle at halftime or end of match.mp3',
            menuClick: 'sounds/Cinematic click sound.mp3',
            confirm: 'sounds/confirm selection sound.mp3'
        };

        const extToMime = (p) => {
            if (p.match(/\.mp3(\?\w*)?$/i)) return 'audio/mpeg';
            if (p.match(/\.wav(\?\w*)?$/i)) return 'audio/wav';
            if (p.match(/\.ogg(\?\w*)?$/i)) return 'audio/ogg';
            return '';
        };

        for (let [name, path] of Object.entries(files)) {
            try {
                const audio = new Audio();
                audio.preload = 'auto';
                const mime = extToMime(path);
                if (mime && typeof audio.canPlayType === 'function' && audio.canPlayType(mime) === '') {
                    console.debug(`[ProStriker] audio not supported by browser: ${path}`);
                    continue;
                }
                audio.src = resolveAssetUrl(path);
                audio.load();

                if (name === 'menuMusic' || name === 'crowd' || name === 'victory' || name === 'defeat') {
                    audio.loop = true;
                }

                this.sounds[name] = audio;
                console.log(`✅ Loaded: ${name} from ${path}`);
            } catch (e) {
                console.debug(`[ProStriker] could not create Audio for ${name}:`, e);
            }
        }

        if (this.sounds.menuMusic) this.sounds.menuMusic.volume = 0.7;
        if (this.sounds.crowd) this.sounds.crowd.volume = 0.35;
        if (this.sounds.victory) this.sounds.victory.volume = 0.7;
        if (this.sounds.defeat) this.sounds.defeat.volume = 0.7;

        this.attemptAutoplay();
        this.updateMusicForState(currentState);
    },

    attemptAutoplay() {
        if (this.autoplayAttempted) return;
        this.autoplayAttempted = true;

        if (this.musicEnabled && this.sounds.menuMusic) {
            const playPromise = this.sounds.menuMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('[ProStriker] Autoplay successful - menu music playing');
                    this.isMusicPlaying = true;
                    this.currentMusic = this.sounds.menuMusic;
                    this.crowdPlaying = false;
                    this.pendingAutoplay = false;
                }).catch((error) => {
                    console.log('[ProStriker] Autoplay blocked by browser. Will play on first interaction.');
                    this.pendingAutoplay = true;
                });
            }
        }
    },

    playMusic(name) {
        if (!this.musicEnabled) return;
        const sound = this.sounds[name];
        if (!sound) return;

        if (this.currentMusic && this.currentMusic !== sound) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }

        if (sound.paused || sound.currentTime === 0) {
            if (name === 'crowd') sound.volume = 0.35;
            else if (name === 'menuMusic' || name === 'victory' || name === 'defeat') sound.volume = 0.7;

            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('[ProStriker] Music playing:', name);
                    this.currentMusic = sound;
                    this.isMusicPlaying = true;
                    this.crowdPlaying = (name === 'crowd');
                    this.pendingAutoplay = false;
                }).catch(e => {
                    console.debug('Music play blocked:', e);
                    this.pendingAutoplay = true;
                });
            }
            this.currentMusic = sound;
            this.isMusicPlaying = true;
            this.crowdPlaying = (name === 'crowd');
        }
    },

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.isMusicPlaying = false;
        }
        this.crowdPlaying = false;
    },

    playSFX(name, volume = 0.6) {
        if (!this.sfxEnabled) return;
        const sound = this.sounds[name];
        if (!sound) return;

        try {
            const clone = sound.cloneNode();
            clone.volume = volume;
            clone.play().catch(e => console.debug('SFX play blocked:', e));
        } catch (e) {
            if (sound.paused) {
                sound.volume = volume;
                sound.currentTime = 0;
                sound.play().catch(e => {});
            }
        }
    },

    playGoalSounds() {
        this.playSFX('goalCheer', 0.7);
        this.playSFX('goalNet', 0.6);
        this.stopCrowd();
    },

    stopCrowd() {
        if (this.sounds.crowd) {
            this.sounds.crowd.pause();
            this.sounds.crowd.currentTime = 0;
            this.crowdPlaying = false;
        }
    },

    resumeCrowd() {
        if (this.musicEnabled && this.sounds.crowd && !this.crowdPlaying) {
            this.sounds.crowd.volume = 0.35;
            this.sounds.crowd.play().catch(e => console.debug('Crowd resume blocked:', e));
            this.crowdPlaying = true;
            this.currentMusic = this.sounds.crowd;
            this.isMusicPlaying = true;
        }
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) this.stopMusic();
        else this.updateMusicForState(currentState);
        return this.musicEnabled;
    },

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    },

    updateMusicForState(state) {
        if (!this.musicEnabled) { this.stopMusic(); return; }

        switch (state) {
            case 'MENU':
            case 'SETTINGS':
            case 'INSTRUCTIONS':
            case 'DIFFICULTY_SELECT':
            case 'STATS':
            case 'TOURNAMENT_MENU':
            case 'TOURNAMENT_TEAM_SELECT':
            case 'TOURNAMENT_GROUP_STAGE':
            case 'TOURNAMENT_BRACKET':
            case 'TOURNAMENT_RESULT':
            case 'TOURNAMENT_CHAMPION':
                this.playMusic('menuMusic');
                break;
            case 'PLAY':
                if (!this.crowdPlaying && currentState !== 'GOAL_SCORED') this.playMusic('crowd');
                break;
            case 'MATCH_END':
                const isVSComputer = typeof gameMode !== 'undefined' && gameMode === 'pve';
                const winner = lastScorer || '';
                if (isVSComputer) {
                    if (winner.includes('RED')) this.playMusic('victory');
                    else this.playMusic('defeat');
                } else this.playMusic('victory');
                break;
            default: this.stopMusic();
        }
    },

    resumeOnInteraction() {
        if (this.pendingAutoplay) {
            console.log('[ProStriker] Resuming music on user interaction');
            this.updateMusicForState(currentState);
            this.pendingAutoplay = false;
        }
    }
};

setTimeout(() => {
    if (!SoundManager.initialized) {
        SoundManager.init();
    }
}, 100);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (!SoundManager.initialized) SoundManager.init();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        if (!SoundManager.initialized) SoundManager.init();
    });
}

function initSoundOnInteraction() {
    if (!SoundManager.initialized) {
        SoundManager.init();
    }
    SoundManager.resumeOnInteraction();
    SoundManager.updateMusicForState(currentState);
}

document.addEventListener('click', initSoundOnInteraction);
document.addEventListener('keydown', initSoundOnInteraction);
document.addEventListener('touchstart', initSoundOnInteraction);

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (SoundManager.initialized && !SoundManager.isMusicPlaying && SoundManager.musicEnabled) {
            SoundManager.updateMusicForState('MENU');
        }
    }, 500);
});