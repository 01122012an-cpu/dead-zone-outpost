const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSFX(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'shoot') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(420, now); osc.frequency.exponentialRampToValueAtTime(55, now + 0.1);
        gain.gain.setValueAtTime(0.22, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'swing') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(260, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12); osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'hurt' || type === 'crash') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(140, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25); osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'boss') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(95, now); osc.frequency.linearRampToValueAtTime(35, now + 0.6);
        gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6); osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'build' || type === 'upgrade') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(type === 'upgrade' ? 320 : 240, now);
        osc.frequency.setValueAtTime(type === 'upgrade' ? 580 : 360, now + 0.08);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18); osc.start(now); osc.stop(now + 0.18);
    } else if (type === 'mine') {
        osc.type = 'square'; osc.frequency.setValueAtTime(160, now); osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);
        gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09); osc.start(now); osc.stop(now + 0.09);
    }
}

let bestDay = Number(localStorage.getItem('deadZoneBestDay')) || 1;
let totalDaysSurvived = Number(localStorage.getItem('deadZoneTotalDays')) || 0;
let totalPlaySeconds = Number(localStorage.getItem('deadZoneTotalSec')) || 0;
let totalKills = Number(localStorage.getItem('deadZoneTotalKills')) || 0;
let totalFriendsSaved = Number(localStorage.getItem('deadZoneFriendsSaved')) || 0;

function saveStats() {
    localStorage.setItem('deadZoneBestDay', bestDay);
    localStorage.setItem('deadZoneTotalDays', totalDaysSurvived);
    localStorage.setItem('deadZoneTotalSec', Math.floor(totalPlaySeconds));
    localStorage.setItem('deadZoneTotalKills', totalKills);
    localStorage.setItem('deadZoneFriendsSaved', totalFriendsSaved);
}

function formatPlayTime(sec) {
    const s = Math.floor(sec), hrs = Math.floor(s / 3600), mins = Math.floor((s % 3600) / 60), rem = s % 60;
    return (hrs > 0 ? hrs + ' ч. ' : '') + mins + ' мин. ' + rem + ' сек.';
}

let isAdShowing = false;
let isMobileMode = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
let joyVec = { x: 0, y: 0 }, touchAttack = false, touchActionE = false;

function showInterstitialAd(onDone) {
    if (!window.ysdk || isAdShowing) { if (onDone) onDone(); return; }
    isAdShowing = true;
    window.ysdk.features?.GameplayAPI?.stop();
    window.ysdk.adv.showFullscreenAdv({
        callbacks: {
            onOpen: () => { if (audioCtx.state === 'running') audioCtx.suspend(); },
            onClose: () => { isAdShowing = false; if (audioCtx.state === 'suspended' && !document.hidden) audioCtx.resume(); if (onDone) onDone(); },
            onError: () => { isAdShowing = false; if (audioCtx.state === 'suspended' && !document.hidden) audioCtx.resume(); if (onDone) onDone(); }
        }
    });
}

function showRewardedAd(onReward) {
    if (!window.ysdk || isAdShowing) { if (onReward) onReward(); return; }
    isAdShowing = true;
    let rewarded = false;
    window.ysdk.features?.GameplayAPI?.stop();
    window.ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => { if (audioCtx.state === 'running') audioCtx.suspend(); },
            onRewarded: () => { rewarded = true; },
            onClose: () => {
                isAdShowing = false;
                if (audioCtx.state === 'suspended' && !document.hidden) audioCtx.resume();
                window.ysdk?.features?.GameplayAPI?.start();
                if (rewarded && onReward) onReward();
            },
            onError: () => { isAdShowing = false; if (audioCtx.state === 'suspended' && !document.hidden) audioCtx.resume(); }
        }
    });
}

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }
    create() {
        const g = this.add.graphics();
        g.fillStyle(0x0b140d, 1).fillRect(0, 0, 900, 650).fillStyle(0x16291b, 1);
        for (let i = 0; i < 45; i++) g.fillCircle(40 + (i * 73) % 820, 40 + (i * 137) % 570, 18);
        g.lineStyle(2, 0x00ff88, 0.35).strokeRect(20, 20, 860, 610);

        const zg = this.make.graphics({ x: 0, y: 0, add: false });
        zg.fillStyle(0x000000, 0.45).fillCircle(32, 32, 24).fillStyle(0x52b788, 1).fillRect(38, 14, 20, 7).fillRect(38, 43, 20, 7).fillStyle(0x386641, 1).fillRoundedRect(14, 9, 32, 46, 10).fillStyle(0x6a994e, 1).fillCircle(30, 32, 14).generateTexture('menuZombieTex', 66, 64);

        this.menuZombie = this.add.sprite(160, 560, 'menuZombieTex').setAlpha(0.75).setDepth(1);
        this.zDir = 1;
        this.tweens.add({ targets: this.menuZombie, angle: { from: -12, to: 12 }, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        this.add.text(450, 90, 'DEAD ZONE: OUTPOST', { fontSize: '54px', fontStyle: 'bold', fill: '#00ff88', stroke: '#050a06', strokeThickness: 8 }).setOrigin(0.5).setDepth(5);
        this.add.text(450, 142, 'ВЫЖИВАНИЕ В ЗАРАЖЁННОМ МИРЕ', { fontSize: '16px', fontStyle: 'bold', fill: '#00f0ff', letterSpacing: 2 }).setOrigin(0.5).setDepth(5);
        this.add.text(868, 618, 'v1.1.0 MOBILE | Andre_Studiooo', { fontSize: '13px', fontStyle: 'bold', fill: '#64748b' }).setOrigin(1, 1).setDepth(5);

        this.makeMenuBtn(450, 225, 310, 64, 'ИГРАТЬ', 0x00ff88, '#090d0a', () => this.scene.start('IntroScene'));
        this.makeMenuBtn(450, 308, 310, 52, 'СТАТИСТИКА', 0x162b1d, '#ffee00', () => this.statsModal.setVisible(true));
        this.makeMenuBtn(450, 378, 310, 52, 'ИНСТРУКТАЖ', 0x162b1d, '#00f0ff', () => this.helpModal.setVisible(true));
        this.makeMenuBtn(450, 448, 310, 48, isMobileMode ? 'РЕЖИМ: ТЕЛЕФОН' : 'РЕЖИМ: ПК', 0x0f172a, '#00ff88', () => {
            isMobileMode = !isMobileMode;
            this.scene.restart();
        });

        this.statsModal = this.add.container(0, 0).setDepth(20).setVisible(false);
        this.statsModal.add([
            this.add.rectangle(450, 325, 580, 420, 0x090f0a, 0.97).setStrokeStyle(3, 0xffee00),
            this.add.text(450, 155, 'СТАТИСТИКА ВЫЖИВШЕГО', { fontSize: '26px', fontStyle: 'bold', fill: '#ffee00' }).setOrigin(0.5)
        ]);
        ['Рекорд выживания за заезд:   ' + bestDay + ' дн.', 'Всего прожито дней:   ' + totalDaysSurvived + ' дн.', 'Общее время в игре:   ' + formatPlayTime(totalPlaySeconds), 'Уничтожено зомби и Титанов:   ' + totalKills + ' шт.', 'Спасено друзей:   ' + totalFriendsSaved + ' чел.'].forEach((line, i) => {
            this.statsModal.add(this.add.text(450, 215 + i * 38, line, { fontSize: '18px', fontStyle: 'bold', fill: '#ffffff' }).setOrigin(0.5));
        });
        const cBtn1 = this.add.rectangle(450, 475, 200, 48, 0xff0055).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff).on('pointerdown', () => this.statsModal.setVisible(false));
        this.statsModal.add([cBtn1, this.add.text(450, 475, 'ЗАКРЫТЬ', { fontSize: '20px', fontStyle: 'bold', fill: '#ffffff' }).setOrigin(0.5)]);

        this.helpModal = this.add.container(0, 0).setDepth(20).setVisible(false);
        this.helpModal.add([
            this.add.rectangle(450, 325, 700, 490, 0x090f0a, 0.97).setStrokeStyle(3, 0x00f0ff),
            this.add.text(450, 115, 'ИНСТРУКТАЖ ПО ВЫЖИВАНИЮ', { fontSize: '25px', fontStyle: 'bold', fill: '#00f0ff' }).setOrigin(0.5)
        ]);
        ['W A S D / Стик — Движение по 6 биомам (4800x2400)', 'ЛКМ / Огонь — Удар / Стрельба / Добыча / Постройка', 'E — Верстак, Сундук, Стабилизатор или спасение друзей', 'F / H — Ягоды (+45 сытости) / Аптечка (+40 HP)', '1 — Боевой режим | 2 / 3 — Стена / Авто-турель', '4 / 5 — Снос (+50% рес.) / Ремонт и Апгрейд', '6 / 7 — Шипы / Прожектор (Верстак 2 ур.)', 'R / ESC — Рестарт / В меню'].forEach((txt, i) => {
            this.helpModal.add(this.add.text(145, 170 + i * 34, txt, { fontSize: '15px', fontStyle: 'bold', fill: i % 2 === 0 ? '#ffffff' : '#a7f3d0' }).setOrigin(0, 0.5));
        });
        const cBtn2 = this.add.rectangle(450, 525, 200, 46, 0x00ff88).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff).on('pointerdown', () => this.helpModal.setVisible(false));
        this.helpModal.add([cBtn2, this.add.text(450, 525, 'ПОНЯТНО', { fontSize: '20px', fontStyle: 'bold', fill: '#090d0a' }).setOrigin(0.5)]);

        if (window.YaGames) YaGames.init().then(ysdk => { window.ysdk = ysdk; ysdk.features?.LoadingAPI?.ready(); }).catch(() => {});
    }
    makeMenuBtn(x, y, w, h, label, bgCol, txtCol, onClick) {
        const btn = this.add.rectangle(x, y, w, h, bgCol).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff88).setDepth(5);
        const txt = this.add.text(x, y, label, { fontSize: h > 60 ? '32px' : '20px', fontStyle: 'bold', fill: txtCol }).setOrigin(0.5).setDepth(6);
        btn.on('pointerover', () => { btn.fillColor = 0xffee00; txt.setColor('#090d0a'); });
btn.on('pointerout', () => { btn.fillColor = bgCol; txt.setColor(txtCol); });
btn.on('pointerdown', onClick);
}
update(time, delta) {
if (this.menuZombie) {
this.menuZombie.x += 42 * this.zDir * (delta / 1000);
this.menuZombie.setFlipX(this.zDir < 0);
if (this.menuZombie.x > 780) this.zDir = -1;
if (this.menuZombie.x < 120) this.zDir = 1;
}
}
}
class IntroScene extends Phaser.Scene {
constructor() { super({ key: 'IntroScene' }); }
create() {
const g = this.add.graphics();
g.fillStyle(0x162b1b, 1).fillRect(0, 0, 900, 650).fillStyle(0x2b2d42, 1).fillRect(0, 250, 900, 150).lineStyle(4, 0xffee00, 0.8).lineBetween(0, 325, 900, 325);
const car = this.add.container(120, 325).add([
this.add.rectangle(0, 0, 110, 52, 0x3a86ff).setStrokeStyle(3, 0xffffff),
this.add.rectangle(-10, 0, 60, 42, 0x1d3557),
this.add.circle(12, -10, 8, 0xffbe0b), this.add.circle(12, 10, 8, 0xff0055), this.add.circle(-18, 0, 8, 0x00ff88)
]);
const subText = this.add.text(450, 110, 'Выходные. Ты, Макс и Артём едете на пикник за город...', { fontSize: '22px', fontStyle: 'bold', fill: '#ffffff', backgroundColor: '#090f0acc', padding: { x: 16, y: 8 } }).setOrigin(0.5);
this.add.text(450, 590, '[ Нажми ПРОБЕЛ или кликни, чтобы пропустить ]', { fontSize: '14px', fill: '#aaaaaa' }).setOrigin(0.5);
for (let i = 0; i < 14; i++) this.add.circle(680 + Math.random() * 140, 265 + Math.random() * 120, 14, 0x52b788).setStrokeStyle(2, 0x1b4332);
this.tweens.add({
targets: car, x: 640, duration: 2600, ease: 'Quad.easeIn',
onUpdate: () => { if (car.x > 420) subText.setText('ВНИМАНИЕ! Впереди на трассе орда зомби!!').setColor('#ff0055'); },
onComplete: () => {
playSFX('crash'); this.cameras.main.shake(400, 0.03);
const boom = this.add.circle(660, 325, 80, 0xffaa00, 0.9);
this.tweens.add({ targets: boom, scale: 2, alpha: 0, duration: 500 });
car.setAngle(28); subText.setText('МАШИНА РАЗБИТА! Макс и Артём пропали, заражение 75%...').setColor('#ffee00');
this.time.delayedCall(2200, () => this.scene.start('GameScene'));
}
});
this.input.on('pointerdown', () => this.scene.start('GameScene'));
this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
}
}
let player, core, workbench, labConsole, keys, bullets, zombies, walls, turrets, spikes, lamps, hutWalls, chests, resNodes, friendsGroup, nightOverlay, lightGfx, buildGhost, decalsGfx;
let wood = 30, metal = 15, vines = 0, food = 2, medkits = 1, hunger = 100, dayNum = 1, isNight = false, phaseTimer = 28, isGameOver = false;
let buildMode = 1, lastShot = 0, spawnTimer = 0, citySpawnTimer = 0, weaponType = 'stick', weaponBonusDmg = 0, wbOpen = false, wbLvl = 1, bpWall = false, bpTurret = false, bpBuild = false, hasMap = false, infectionRate = 75;
let uiResText, uiPhaseText, uiModeText, uiHpBar, uiHpText, uiHungerBar, uiInfText, actionPrompt, wbContainer, statusText, mapGfx, mapHintTxt;
const WORLD_W = 4800, WORLD_H = 2400, BASE_X = 4000, BASE_Y = 650, bloodDecals = [];
const WEAPONS = {
    stick: { name: 'ПАЛКА', melee: true, dmg: 1, range: 64, rate: 340, color: 0xa47148 },
    saber: { name: 'САБЛЯ', melee: true, dmg: 3, range: 86, rate: 250, color: 0x00f0ff },
    pistol: { name: 'ПИСТОЛЕТ', melee: false, dmg: 2, rate: 320, color: 0xffee00 },
    rifle: { name: 'ВИНТОВКА', melee: false, dmg: 3, rate: 150, color: 0xff0055 }
};

function spawnBloodDecal(x, y, isBoss = false) {
    if (bloodDecals.length > 150) bloodDecals.shift();
    bloodDecals.push({ x: x + Phaser.Math.Between(-12, 12), y: y + Phaser.Math.Between(-12, 12), r: isBoss ? Phaser.Math.Between(14, 24) : Phaser.Math.Between(5, 11), alpha: Phaser.Math.FloatBetween(0.45, 0.75) });
    redrawDecals();
}
function spawnShellCasing(x, y, angle) {
    if (bloodDecals.length > 150) bloodDecals.shift();
    const a = angle + Math.PI / 2 + Phaser.Math.FloatBetween(-0.4, 0.4), d = Phaser.Math.Between(12, 24);
    bloodDecals.push({ isShell: true, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
    redrawDecals();
}
function redrawDecals() {
    if (!decalsGfx) return;
    decalsGfx.clear();
    for (let i = 0; i < bloodDecals.length; i++) {
        const d = bloodDecals[i];
        if (d.isShell) decalsGfx.fillStyle(0xfbbf24, 0.85).fillRect(d.x - 2, d.y - 1, 4, 2);
        else decalsGfx.fillStyle(0x7f1d1d, d.alpha).fillCircle(d.x, d.y, d.r);
    }
}
function spawnMuzzleFlash(s, x, y, angle, color = 0xffee00) {
    const fx = x + Math.cos(angle) * 26, fy = y + Math.sin(angle) * 26;
    const f1 = s.add.circle(fx, fy, 11, color, 0.9).setDepth(6), f2 = s.add.circle(fx, fy, 5, 0xffffff, 1).setDepth(7);
    s.tweens.add({ targets: [f1, f2], scale: 0.1, alpha: 0, duration: 65, onComplete: () => { f1.destroy(); f2.destroy(); } });
}
function spawnSparks(s, x, y, color = 0xffbe0b) {
    for (let i = 0; i < 5; i++) {
        const p = s.add.circle(x, y, 2.5, color, 1).setDepth(8), a = Math.random() * Math.PI * 2, spd = Phaser.Math.Between(20, 45);
        s.tweens.add({ targets: p, x: x + Math.cos(a) * spd, y: y + Math.sin(a) * spd, alpha: 0, duration: 180, onComplete: () => p.destroy() });
    }
}
function generateProceduralTextures(s) {
    const g = s.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x18301e, 1).fillRect(0, 0, 128, 128).fillStyle(0x214029, 1).fillCircle(30, 40, 18).fillCircle(95, 90, 22).fillStyle(0x2d5a38, 1).fillRect(18, 24, 3, 7).fillRect(85, 65, 3, 8).generateTexture('grassTex', 128, 128);
    g.clear().fillStyle(0x162920, 1).fillRect(0, 0, 128, 128).fillStyle(0x0f1f18, 1).fillCircle(45, 45, 26).fillStyle(0x38b000, 0.35).fillCircle(45, 45, 20).lineStyle(1.5, 0x70e000, 0.5).strokeCircle(45, 45, 16).generateTexture('swampTex', 128, 128);
    g.clear().fillStyle(0x473623, 1).fillRect(0, 0, 128, 128).fillStyle(0x382a1b, 1).fillCircle(35, 80, 14).lineStyle(1.5, 0x261c12, 0.7).lineBetween(10, 20, 45, 35).lineBetween(75, 85, 115, 105).generateTexture('wasteTex', 128, 128);
    g.clear().fillStyle(0x20232b, 1).fillRect(0, 0, 128, 128).lineStyle(1, 0x2e3340, 0.9).strokeRect(0, 0, 64, 64).strokeRect(64, 64, 64, 64).generateTexture('cityFloorTex', 128, 128);
    g.clear().fillStyle(0x282433, 1).fillRect(0, 0, 128, 128).lineStyle(1, 0x3d364f, 0.85);
    for (let px = 0; px < 128; px += 32) for (let py = 0; py < 128; py += 16) g.strokeRect(px + (py % 32 === 0 ? 0 : 16), py, 32, 16);
    g.generateTexture('parisFloorTex', 128, 128);
    g.clear().fillStyle(0x272e2a, 1).fillRect(0, 0, 128, 128).lineStyle(2, 0x1a1f1c, 1).strokeRect(1, 1, 126, 126).fillStyle(0x4a5750, 1).fillCircle(10, 10, 2.5).fillCircle(118, 118, 2.5).generateTexture('milFloorTex', 128, 128);

    g.clear().fillStyle(0x000000, 0.45).fillEllipse(24, 26, 36, 30).fillStyle(0x1d3557, 1).fillRoundedRect(6, 14, 10, 20, 4).fillStyle(0x3a86ff, 1).fillRoundedRect(13, 6, 20, 36, 9).fillStyle(0xffe0bd, 1).fillCircle(32, 12, 5).fillCircle(32, 36, 5).fillCircle(23, 24, 10).fillStyle(0xffbe0b, 1).fillCircle(21, 24, 9).fillRect(24, 19, 9, 10).generateTexture('playerTex', 52, 48);
    g.clear().fillStyle(0x000000, 0.45).fillEllipse(24, 26, 36, 30).fillStyle(0x047857, 1).fillRoundedRect(6, 14, 10, 20, 4).fillStyle(0x10b981, 1).fillRoundedRect(13, 6, 20, 36, 9).fillStyle(0x334155, 1).fillRect(28, 21, 18, 6).fillStyle(0xffe0bd, 1).fillCircle(23, 24, 10).fillStyle(0xef476f, 1).fillCircle(22, 24, 8.5).generateTexture('friendMaxTex', 52, 48);
    g.clear().fillStyle(0x000000, 0.45).fillEllipse(24, 26, 36, 30).fillStyle(0x9a3412, 1).fillRoundedRect(6, 14, 10, 20, 4).fillStyle(0xf97316, 1).fillRoundedRect(13, 6, 20, 36, 9).fillStyle(0x1e293b, 1).fillRect(28, 21, 18, 6).fillStyle(0xffe0bd, 1).fillCircle(23, 24, 10).fillStyle(0x00b4d8, 1).fillCircle(22, 24, 8.5).generateTexture('friendArtTex', 52, 48);

    g.clear().fillStyle(0x000000, 0.45).fillEllipse(22, 24, 34, 28).fillStyle(0x52b788, 1).fillRoundedRect(24, 9, 17, 6, 3).fillRoundedRect(24, 29, 17, 6, 3).fillStyle(0x2d6a4f, 1).fillRoundedRect(10, 6, 22, 32, 8).fillStyle(0x991b1b, 0.8).fillCircle(18, 14, 4).fillStyle(0x74c69d, 1).fillCircle(21, 22, 9.5).fillStyle(0xdc2626, 1).fillCircle(26, 19, 1.8).fillCircle(26, 25, 1.8).generateTexture('zombieTex', 46, 44);
    g.clear().fillStyle(0x000000, 0.45).fillEllipse(20, 22, 30, 24).fillStyle(0xff4d6d, 1).fillRoundedRect(22, 8, 16, 5, 2).fillRoundedRect(22, 27, 16, 5, 2).fillStyle(0x9d0208, 1).fillRoundedRect(9, 6, 20, 28, 7).fillStyle(0xff758f, 1).fillCircle(19, 20, 8.5).fillStyle(0xffee00, 1).fillCircle(24, 17, 1.8).fillCircle(24, 23, 1.8).generateTexture('runnerTex', 42, 40);
    g.clear().fillStyle(0x000000, 0.55).fillCircle(30, 32, 25).fillStyle(0x7209b7, 1).fillRoundedRect(34, 10, 22, 9, 4).fillRoundedRect(34, 41, 22, 9, 4).fillStyle(0x3a0ca3, 1).fillRoundedRect(10, 6, 32, 48, 12).fillStyle(0x64748b, 1).fillCircle(22, 10, 8).fillCircle(22, 50, 8).fillStyle(0xb5179e, 1).fillCircle(27, 30, 13).generateTexture('bruteTex', 62, 60);
    g.clear().fillStyle(0x000000, 0.65).fillCircle(44, 46, 40).fillStyle(0xff0055, 1).fillRoundedRect(50, 14, 30, 12, 5).fillRoundedRect(50, 62, 30, 12, 5).fillStyle(0x4a0418, 1).fillRoundedRect(12, 6, 50, 76, 16).lineStyle(3, 0xffee00, 1).strokeRoundedRect(12, 6, 50, 76, 16).fillStyle(0x00f0ff, 1).fillCircle(24, 44, 9).fillStyle(0xffbe0b, 1).fillCircle(40, 44, 18).generateTexture('bossTex', 88, 88);

    g.clear().fillStyle(0x0f172a, 1).fillCircle(42, 42, 41).lineStyle(4, 0x00f0ff, 1).strokeCircle(42, 42, 39).lineStyle(2, 0x38bdf8, 0.7).strokeCircle(42, 42, 28).fillStyle(0x00f0ff, 0.9).fillCircle(42, 42, 16).fillStyle(0xffffff, 1).fillCircle(42, 42, 7).generateTexture('coreTex', 84, 84);
    g.clear().fillStyle(0x5c3a21, 1).fillRoundedRect(2, 2, 52, 40, 6).lineStyle(3, 0xffbe0b, 1).strokeRoundedRect(2, 2, 52, 40, 6).fillStyle(0xe2e8f0, 1).fillRect(8, 8, 18, 14).fillStyle(0x94a3b8, 1).fillRect(32, 10, 14, 8).generateTexture('wbTex', 56, 44);
    g.clear().fillStyle(0x334155, 1).fillRoundedRect(2, 2, 52, 40, 6).lineStyle(3, 0x00f0ff, 1).strokeRoundedRect(2, 2, 52, 40, 6).fillStyle(0x00f0ff, 0.8).fillRect(8, 8, 22, 14).fillStyle(0xfbbf24, 1).fillRect(34, 10, 12, 22).generateTexture('wbTex2', 56, 44);
    g.clear().fillStyle(0x240046, 1).fillRoundedRect(2, 2, 52, 40, 6).lineStyle(3, 0xff007f, 1).strokeRoundedRect(2, 2, 52, 40, 6).fillStyle(0xffee00, 1).fillRect(8, 8, 40, 12).fillStyle(0x00ff88, 1).fillCircle(28, 30, 7).generateTexture('wbTex3', 56, 44);

    g.clear().fillStyle(0x6f4518, 1).fillRect(1, 1, 46, 46).lineStyle(2, 0x3d2208, 1).strokeRect(1, 1, 46, 46).lineBetween(1, 16, 47, 16).lineBetween(1, 32, 47, 32).fillStyle(0xa47148, 1).fillRect(10, 3, 6, 42).fillRect(32, 3, 6, 42).generateTexture('wallTex', 48, 48);
    g.clear().fillStyle(0x475569, 1).fillRect(1, 1, 46, 46).lineStyle(3, 0x00f0ff, 1).strokeRect(1, 1, 46, 46).fillStyle(0x94a3b8, 1).fillRect(7, 7, 34, 34).generateTexture('wallTex2', 48, 48);
    g.clear().fillStyle(0x1e293b, 1).fillCircle(22, 22, 21).lineStyle(2, 0xff0055, 1).strokeCircle(22, 22, 20).fillStyle(0x64748b, 1).fillRect(20, 17, 24, 10).fillStyle(0xff0055, 1).fillCircle(22, 22, 9).generateTexture('turretTex', 46, 44);
    g.clear().fillStyle(0x0f172a, 1).fillCircle(22, 22, 21).lineStyle(3, 0xffee00, 1).strokeCircle(22, 22, 20).fillStyle(0xfbbf24, 1).fillRect(20, 10, 26, 7).fillRect(20, 27, 26, 7).fillStyle(0x00f0ff, 1).fillCircle(22, 22, 10).generateTexture('turretTex2', 48, 44);

    g.clear().fillStyle(0x2d3748, 0.9).fillRect(3, 3, 42, 42).lineStyle(2, 0x64748b, 1).strokeRect(3, 3, 42, 42);
    [12, 24, 36].forEach(sx => [12, 24, 36].forEach(sy => { g.fillStyle(0x94a3b8, 1).fillCircle(sx, sy, 4.5).fillStyle(0xffffff, 1).fillCircle(sx - 1, sy - 1, 1.8); }));
    g.generateTexture('spikeTex', 48, 48);
    g.clear().fillStyle(0x1e293b, 0.95).fillRect(3, 3, 42, 42).lineStyle(2, 0xff0055, 1).strokeRect(3, 3, 42, 42);
    [12, 24, 36].forEach(sx => [12, 24, 36].forEach(sy => { g.fillStyle(0xff0055, 1).fillCircle(sx, sy, 5).fillStyle(0xffee00, 1).fillCircle(sx - 1, sy - 1, 2); }));
    g.generateTexture('spikeTex2', 48, 48);

g.clear().fillStyle(0x1e293b, 1).fillCircle(24, 24, 17).fillStyle(0xffee00, 1).fillCircle(24, 24, 11).fillStyle(0xffffff, 1).fillCircle(24, 24, 5).generateTexture('lampTex', 48, 48);
g.clear().fillStyle(0x0f172a, 1).fillCircle(24, 24, 19).lineStyle(2, 0x00f0ff, 1).strokeCircle(24, 24, 18).fillStyle(0x00f0ff, 1).fillCircle(24, 24, 12).fillStyle(0xffffff, 1).fillCircle(24, 24, 6).generateTexture('lampTex2', 48, 48);
g.clear().fillStyle(0x4a2c11, 1).fillRect(0, 0, 48, 48).lineStyle(2, 0x2b1706, 1).strokeRect(1, 1, 46, 46).lineBetween(0, 24, 48, 24).generateTexture('hutWallTex', 48, 48);
g.clear().fillStyle(0xe2e8f0, 1).fillRect(0, 0, 48, 48).lineStyle(2, 0xff0055, 1).strokeRect(1, 1, 46, 46).generateTexture('medWallTex', 48, 48);
g.clear().fillStyle(0xd97706, 1).fillRect(0, 0, 48, 48).lineStyle(3, 0x111111, 1).strokeRect(1, 1, 46, 46).lineBetween(0, 48, 48, 0).generateTexture('constWallTex', 48, 48);
g.clear().fillStyle(0x3b0764, 1).fillRect(0, 0, 48, 48).lineStyle(2, 0x00f0ff, 1).strokeRect(1, 1, 46, 46).generateTexture('labWallTex', 48, 48);
g.clear().fillStyle(0x1d4ed8, 1).fillRect(0, 0, 48, 48).lineStyle(2, 0x93c5fd, 1).strokeRect(1, 1, 46, 46).generateTexture('shopWallTex', 48, 48);
g.clear().fillStyle(0x0f172a, 1).fillRoundedRect(2, 2, 56, 44, 6).lineStyle(3, 0x00ff88, 1).strokeRoundedRect(2, 2, 56, 44, 6).fillStyle(0x00ff88, 0.85).fillRect(10, 10, 40, 14).generateTexture('labTermTex', 60, 48);
g.clear().fillStyle(0x000000, 0.4).fillRect(3, 10, 42, 32).fillStyle(0x8b5a2b, 1).fillRoundedRect(4, 8, 40, 32, 5).lineStyle(3, 0xffbe0b, 1).strokeRoundedRect(4, 8, 40, 32, 5).fillStyle(0xffbe0b, 1).fillRect(19, 19, 10, 10).generateTexture('chestTex', 48, 48);
g.clear().fillStyle(0x4a3520, 1).fillRoundedRect(4, 8, 40, 32, 5).lineStyle(2, 0x718096, 1).strokeRoundedRect(4, 8, 40, 32, 5).fillStyle(0x111111, 1).fillRect(8, 14, 32, 18).generateTexture('chestOpenTex', 48, 48);
g.clear().fillStyle(0x000000, 0.35).fillCircle(28, 30, 24).fillStyle(0x1b4332, 1).fillCircle(26, 26, 24).fillStyle(0x2d6a4f, 1).fillCircle(24, 24, 19).fillStyle(0x40916c, 1).fillCircle(20, 20, 12).generateTexture('treeTex', 54, 54);
g.clear().fillStyle(0x000000, 0.35).fillCircle(21, 22, 18).fillStyle(0x2d6a4f, 1).fillCircle(20, 20, 18).fillStyle(0x52b788, 1).fillCircle(17, 17, 12).fillStyle(0xff0055, 1).fillCircle(14, 14, 3.5).fillCircle(25, 16, 3.5).fillCircle(19, 25, 3.5).generateTexture('bushTex', 42, 42);
g.clear().fillStyle(0x000000, 0.4).fillEllipse(24, 26, 38, 28).fillStyle(0x475569, 1).fillRoundedRect(5, 10, 36, 24, 5).fillStyle(0x94a3b8, 1).fillRect(10, 6, 24, 12).fillCircle(16, 24, 7).generateTexture('metalTex', 46, 42);
g.clear().fillStyle(0xffee00, 1).fillRect(0, 0, 14, 4).fillStyle(0xffffff, 1).fillRect(8, 1, 6, 2).generateTexture('bulletTex', 14, 4);
}
class GameScene extends Phaser.Scene {
constructor() { super({ key: 'GameScene' }); }
create() {
wood = 30; metal = 15; vines = 0; food = 2; medkits = 1; hunger = 100;
dayNum = 1; isNight = false; phaseTimer = 28; isGameOver = false;
buildMode = 1; weaponType = 'stick'; weaponBonusDmg = 0; wbOpen = false;
wbLvl = 1; bpWall = false; bpTurret = false; bpBuild = false; hasMap = false; infectionRate = 75;
this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
generateProceduralTextures(this);
bloodDecals.length = 0;
decalsGfx = this.add.graphics().setDepth(1.5);
for (let x = 0; x < WORLD_W; x += 128) {
for (let y = 0; y < WORLD_H; y += 128) {
let fTex = 'grassTex';
if (y < 1200) {
if (x < 1600) fTex = 'parisFloorTex';
else if (x < 3200) fTex = 'swampTex';
else fTex = 'grassTex';
} else {
if (x < 1600) fTex = 'wasteTex';
else if (x < 3200) fTex = 'cityFloorTex';
else fTex = 'milFloorTex';
}
this.add.image(x + 64, y + 64, fTex).setDepth(0);
}
}
bullets = this.physics.add.group(); zombies = this.physics.add.group();
walls = this.physics.add.staticGroup(); turrets = this.physics.add.staticGroup();
spikes = this.physics.add.staticGroup(); lamps = this.physics.add.staticGroup();
hutWalls = this.physics.add.staticGroup(); chests = this.physics.add.staticGroup();
resNodes = this.physics.add.staticGroup(); friendsGroup = this.physics.add.group();
core = this.physics.add.staticSprite(BASE_X, BASE_Y, 'coreTex').setDepth(3);
core.hp = 200; core.maxHp = 200;
this.tweens.add({ targets: core, scale: 1.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
workbench = this.physics.add.staticSprite(BASE_X - 85, BASE_Y, 'wbTex').setDepth(3);
this.add.rectangle(BASE_X + 105, BASE_Y + 60, 74, 38, 0x3a86ff).setAngle(24).setDepth(2).setStrokeStyle(2, 0x111111);
const buildings = [
{ name: 'ИЗБУШКА #1', x: 3500, y: 240, w: 192, h: 192, wall: 'hutWallTex', kind: 'bp_wall' },
{ name: 'ИЗБУШКА #2', x: 4500, y: 260, w: 192, h: 192, wall: 'hutWallTex', kind: 'bp_turret' },
{ name: 'ИЗБУШКА #3', x: 3520, y: 1020, w: 192, h: 192, wall: 'hutWallTex', kind: 'loot' },
{ name: 'СТАРАЯ ЛЕСОПИЛКА', x: 4480, y: 980, w: 288, h: 192, wall: 'hutWallTex', kind: 'wood' },
{ name: 'СЕКРЕТНАЯ ЛАБОРАТОРИЯ', x: 520, y: 720, w: 336, h: 240, wall: 'labWallTex', kind: 'med', hasLab: true },
{ name: 'МЕДПУНКТ', x: 2050, y: 1550, w: 288, h: 240, wall: 'medWallTex', kind: 'med' },
{ name: 'СТРОЙКА', x: 2850, y: 1450, w: 336, h: 240, wall: 'constWallTex', kind: 'bp_build' },
{ name: 'СУПЕРМАРКЕТ', x: 2200, y: 2050, w: 336, h: 240, wall: 'shopWallTex', kind: 'food' },
{ name: 'НАУЧНЫЙ КУПОЛ', x: 650, y: 1850, w: 288, h: 240, wall: 'labWallTex', kind: 'bp_build' },
{ name: 'ОРУЖЕЙНЫЙ БУНКЕР', x: 4100, y: 1850, w: 336, h: 240, wall: 'constWallTex', kind: 'gun' }
];
buildings.forEach(b => {
this.add.text(b.x, b.y - b.h / 2 - 34, b.name, { fontSize: '16px', fontStyle: 'bold', fill: '#00f0ff', backgroundColor: '#090f0add', padding: { x: 8, y: 3 } }).setOrigin(0.5).setDepth(5);
this.add.rectangle(b.x, b.y, b.w, b.h, 0x1e293b, 0.85).setDepth(1);
for (let dx = -b.w / 2; dx <= b.w / 2; dx += 48) {
for (let dy = -b.h / 2; dy <= b.h / 2; dy += 48) {
const isEdge = Math.abs(dx) >= b.w / 2 - 24 || Math.abs(dy) >= b.h / 2 - 24;
if (isEdge && !(dy > 0 && Math.abs(dx) <= 24)) hutWalls.create(b.x + dx, b.y + dy, b.wall).setDepth(3);
}
}
const ch = chests.create(b.x, b.y - 20, 'chestTex').setDepth(3);
ch.opened = false; ch.chestKind = b.kind;
if (b.hasLab) labConsole = this.physics.add.staticSprite(b.x - 80, b.y, 'labTermTex').setDepth(3);
});
const friendsInit = [
{ name: 'МАКС', x: 2150, y: 450, tex: 'friendMaxTex' },
{ name: 'АРТЁМ', x: 950, y: 1450, tex: 'friendArtTex' }
];
friendsInit.forEach(fd => {
const fr = friendsGroup.create(fd.x, fd.y, fd.tex).setDepth(4).setCollideWorldBounds(true);
fr.body.setCircle(16, 8, 8); fr.friendName = fd.name; fr.rescued = false; fr.shootCD = 0;
fr.tag = this.add.text(fd.x, fd.y - 28, fd.name + ' (НУЖНА ПОМОЩЬ [E])', { fontSize: '12px', fontStyle: 'bold', fill: '#ffee00', backgroundColor: '#000000aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(10);
});
spawnNatureResources(this, 65);
decorateWorld(this);
player = this.physics.add.sprite(BASE_X, BASE_Y + 85, 'playerTex').setDepth(4).setCollideWorldBounds(true);
player.body.setCircle(16, 8, 8); player.hp = 75; player.maxHp = 100; player.hitCD = 0;
this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H).startFollow(player, true, 0.12, 0.12);
buildGhost = this.add.rectangle(0, 0, 48, 48, 0x00ff88, 0.35).setStrokeStyle(2, 0x00ff88).setDepth(10).setVisible(false);
nightOverlay = this.add.rectangle(450, 325, 900, 650, 0x040714, 0).setScrollFactor(0).setDepth(15);
lightGfx = this.add.graphics().setDepth(16);
this.weatherGfx = this.add.graphics().setScrollFactor(0).setDepth(17);
this.weatherTint = this.add.rectangle(450, 325, 900, 650, 0x000000, 0).setScrollFactor(0).setDepth(14);
this.weatherParticles = [];
for (let i = 0; i < 90; i++) {
this.weatherParticles.push({ x: Math.random() * 900, y: Math.random() * 650, speed: 0.7 + Math.random() * 0.6, size: 1.5 + Math.random() * 2.5 });
}
const solidObjs = [core, workbench, labConsole, walls, hutWalls, chests, resNodes];
solidObjs.forEach(obj => { if (obj) this.physics.add.collider(player, obj); });
this.physics.add.collider(zombies, zombies);
this.physics.add.collider(zombies, hutWalls);
this.physics.add.collider(bullets, hutWalls, b => b.destroy());
this.physics.add.collider(zombies, walls, (z, w) => {
if (!z.hitClock || this.time.now > z.hitClock + 700) {
z.hitClock = this.time.now; w.hp -= (z.zDmg || 1); w.setTint(0xff5555);
this.time.delayedCall(100, () => { if (w.active) w.clearTint(); });
if (w.hp <= 0) w.destroy();
}
});
this.physics.add.collider(zombies, core, (z) => {
if (!z.hitClock || this.time.now > z.hitClock + 800) {
z.hitClock = this.time.now; core.hp = Math.max(0, core.hp - 12 * (z.zDmg || 1));
this.cameras.main.shake(100, 0.01);
}
});
this.physics.add.overlap(zombies, player, (z) => {
if (this.time.now > player.hitCD + 750 && !isGameOver && !isAdShowing) {
player.hitCD = this.time.now; player.hp = Math.max(0, player.hp - 14 * (z.zDmg || 1));
playSFX('hurt'); player.setTint(0xff0055);
this.time.delayedCall(140, () => { if (player.active) player.clearTint(); });
this.cameras.main.shake(130, 0.014);
}
});
this.physics.add.overlap(zombies, spikes, (z, sp) => {
z.slowedUntil = this.time.now + (sp.lvl === 2 ? 600 : 300);
if (!z.spikeCD || this.time.now > z.spikeCD + (sp.lvl === 2 ? 320 : 550)) { z.spikeCD = this.time.now; damageZombie(this, z, sp.lvl === 2 ? 2 : 1); }
});
this.physics.add.overlap(bullets, zombies, (b, z) => { const dmg = b.dmg || 1; b.destroy(); damageZombie(this, z, dmg); });
this.physics.add.overlap(bullets, resNodes, (b, node) => { b.destroy(); harvestNode(this, node, 1); });
this.input.on('pointerdown', (ptr) => {
if (isGameOver || wbOpen || isAdShowing || isMobileMode) return;
const gx = Math.floor(ptr.worldX / 48) * 48 + 24, gy = Math.floor(ptr.worldY / 48) * 48 + 24;
if (Phaser.Math.Distance.Between(player.x, player.y, gx, gy) > 220) return;
if (buildMode === 2 && wood >= 15 && !findStructureAt(gx, gy)) { wood -= 15; playSFX('build'); const w = walls.create(gx, gy, 'wallTex').setDepth(3); w.hp = 6; w.maxHp = 6; w.lvl = 1; }
else if (buildMode === 3 && metal >= 30 && !findStructureAt(gx, gy)) { metal -= 30; playSFX('build'); const t = turrets.create(gx, gy, 'turretTex').setDepth(3); t.lastFire = 0; t.lvl = 1; }
else if (buildMode === 6 && wbLvl >= 2 && wood >= 10 && metal >= 10 && !findStructureAt(gx, gy)) { wood -= 10; metal -= 10; playSFX('build'); const sp = spikes.create(gx, gy, 'spikeTex').setDepth(2); sp.lvl = 1; }
else if (buildMode === 7 && wbLvl >= 2 && metal >= 20 && vines >= 10 && !findStructureAt(gx, gy)) { metal -= 20; vines -= 10; playSFX('build'); const l = lamps.create(gx, gy, 'lampTex').setDepth(3); l.lvl = 1; }
else if (buildMode === 4) {
const target = findStructureAt(gx, gy);
if (target) {
playSFX('mine');
if (target.type === 'wall') { wood += 8; if (target.obj.lvl === 2) metal += 12; }
else if (target.type === 'turret') metal += target.obj.lvl === 2 ? 40 : 15;
else if (target.type === 'spike') { wood += 5; metal += 5; }
else if (target.type === 'lamp') { metal += 10; vines += 5; }
target.obj.destroy();
}
} else if (buildMode === 5) handleRepairAndUpgrade(this, ptr, gx, gy);
});
this.add.rectangle(450, 38, 876, 62, 0x090f0a, 0.92).setScrollFactor(0).setDepth(20).setStrokeStyle(2, 0x00ff88);
uiResText = this.add.text(22, 22, '', { fontSize: '13px', fontStyle: 'bold', fill: '#ffee00' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);
this.add.text(22, 48, 'HP:', { fontSize: '12px', fontStyle: 'bold', fill: '#ffffff' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);
this.add.rectangle(50, 48, 110, 12, 0x330000).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);
uiHpBar = this.add.rectangle(50, 48, 82, 12, 0x00ff88).setOrigin(0, 0.5).setScrollFactor(0).setDepth(22);
uiHpText = this.add.text(105, 48, '75/100', { fontSize: '10px', fontStyle: 'bold', fill: '#000' }).setOrigin(0.5).setScrollFactor(0).setDepth(23);
this.add.text(175, 48, 'СЫТОСТЬ:', { fontSize: '12px', fontStyle: 'bold', fill: '#ffbe0b' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);
this.add.rectangle(242, 48, 100, 12, 0x332200).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);
uiHungerBar = this.add.rectangle(242, 48, 100, 12, 0xffbe0b).setOrigin(0, 0.5).setScrollFactor(0).setDepth(22);
uiInfText = this.add.text(360, 48, 'ЗАРАЖЕНИЕ: 75%', { fontSize: '13px', fontStyle: 'bold', fill: '#ff0055' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);
uiPhaseText = this.add.text(876, 38, '', { fontSize: '15px', fontStyle: 'bold', fill: '#00f0ff', align: 'right' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(21);
uiModeText = this.add.text(350, 622, '', { fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', backgroundColor: '#090f0add', padding: { x: 10, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
actionPrompt = this.add.text(450, 580, '', { fontSize: '15px', fontStyle: 'bold', fill: '#ffbe0b', backgroundColor: '#090f0aee', padding: { x: 14, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(22).setVisible(false);
statusText = this.add.text(450, 300, '', { fontSize: '30px', fontStyle: 'bold', fill: '#ff0055', backgroundColor: '#090f0aee', padding: { x: 24, y: 16 }, align: 'center' }).setOrigin(0.5).setDepth(35).setScrollFactor(0).setVisible(false);
this.reviveBtn = this.add.rectangle(450, 415, 340, 52, 0x00ff88).setScrollFactor(0).setDepth(36).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff).setVisible(false);
this.reviveTxt = this.add.text(450, 415, 'ВОСКРЕСНУТЬ ЗА РЕКЛАМУ', { fontSize: '18px', fontStyle: 'bold', fill: '#090d0a' }).setOrigin(0.5).setScrollFactor(0).setDepth(37).setVisible(false);
this.reviveBtn.on('pointerdown', () => {
showRewardedAd(() => {
isGameOver = false; player.hp = player.maxHp; core.hp = Math.max(core.hp, 120); hunger = 100;
statusText.setVisible(false); this.reviveBtn.setVisible(false); this.reviveTxt.setVisible(false);
zombies.getChildren().slice().forEach(z => { if (!z.isBoss && Phaser.Math.Distance.Between(z.x, z.y, player.x, player.y) < 450) z.destroy(); });
playSFX('upgrade'); showFloatText(this, player.x, player.y - 40, 'ВЫ ВОСКРЕСЛИ!', '#00ff88');
});
});
mapGfx = this.add.graphics().setScrollFactor(0).setDepth(25);
mapHintTxt = this.add.text(790, 595, 'КАРТА НЕ СКРАФЧЕНА\n(Верстак: 10 дерева)', { fontSize: '11px', fontStyle: 'bold', fill: '#888888', backgroundColor: '#090f0add', padding: { x: 8, y: 6 }, align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(25);
createWorkbenchUI(this);
createMobileControls(this);
keys = this.input.keyboard.addKeys('W,A,S,D,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,E,F,H,R,ESC');
window.ysdk?.features?.GameplayAPI?.start();
}
    update(time, delta) {
        if (isAdShowing) { player.setVelocity(0); return; }
        if (Phaser.Input.Keyboard.JustDown(keys.R)) { showInterstitialAd(() => this.scene.restart()); return; }
        if (Phaser.Input.Keyboard.JustDown(keys.ESC)) {
            if (wbOpen) { wbOpen = false; wbContainer.setVisible(false); return; }
            window.ysdk?.features?.GameplayAPI?.stop();
            showInterstitialAd(() => this.scene.start('MenuScene'));
            return;
        }
        if (isGameOver) return;

        const dt = delta / 1000;
        totalPlaySeconds += dt;

        const nearWB = Phaser.Math.Distance.Between(player.x, player.y, workbench.x, workbench.y) < 95;
        const nearLab = labConsole && Phaser.Math.Distance.Between(player.x, player.y, labConsole.x, labConsole.y) < 95;
        let nearChest = null, nearFriend = null;
        chests.getChildren().forEach(ch => { if (!ch.opened && Phaser.Math.Distance.Between(player.x, player.y, ch.x, ch.y) < 75) nearChest = ch; });
        friendsGroup.getChildren().forEach(fr => { if (!fr.rescued && Phaser.Math.Distance.Between(player.x, player.y, fr.x, fr.y) < 85) nearFriend = fr; });

        if (nearFriend && !wbOpen) actionPrompt.setText('Нажми [ E ] — СПАСТИ ДРУГА (' + nearFriend.friendName + ')').setVisible(true);
        else if (nearChest && !wbOpen) actionPrompt.setText('Нажми [ E ] — ОТКРЫТЬ СУНДУК').setVisible(true);
        else if (nearLab && !wbOpen) actionPrompt.setText('Нажми [ E ] — СТАБИЛИЗАТОР (-25% заражения | 30 мет. + 20 лиан)').setVisible(true);
        else if (nearWB && !wbOpen) actionPrompt.setText('Нажми [ E ] — ВЕРСТАК (LVL ' + wbLvl + ')').setVisible(true);
        else actionPrompt.setVisible(false);

        if (Phaser.Input.Keyboard.JustDown(keys.F) && food > 0 && hunger < 100) { food--; hunger = Math.min(100, hunger + 45); playSFX('build'); showFloatText(this, player.x, player.y - 30, '+45 СЫТОСТЬ!', '#ffbe0b'); }
        if (Phaser.Input.Keyboard.JustDown(keys.H) && medkits > 0 && player.hp < player.maxHp) { medkits--; player.hp = Math.min(player.maxHp, player.hp + 40); playSFX('upgrade'); showFloatText(this, player.x, player.y - 30, '+40 HP!', '#00ff88'); }
        if (Phaser.Input.Keyboard.JustDown(keys.E) || touchActionE) {
            touchActionE = false;
            if (nearFriend && !wbOpen) {
                nearFriend.rescued = true; nearFriend.tag.setText(nearFriend.friendName + ' (ОХРАНА БАЗЫ)').setColor('#00ff88');
                totalFriendsSaved++; saveStats(); playSFX('upgrade'); showFloatText(this, nearFriend.x, nearFriend.y - 45, nearFriend.friendName + ' БЕЖИТ НА БАЗУ!', '#00ff88');
            } else if (nearChest && !wbOpen) openChestLoot(this, nearChest);
            else if (nearLab && !wbOpen) {
                if (infectionRate > 15 && metal >= 30 && vines >= 20) { metal -= 30; vines -= 20; infectionRate = Math.max(15, infectionRate - 25); playSFX('upgrade'); showFloatText(this, labConsole.x, labConsole.y - 35, 'ЗАРАЖЕНИЕ: ' + infectionRate + '%!', '#00ff88'); }
                else playSFX('hurt');
            } else if (nearWB) { wbOpen = !wbOpen; if (wbOpen) refreshWorkbenchUI(this); wbContainer.setVisible(wbOpen); }
        }

        [keys.ONE, keys.TWO, keys.THREE, keys.FOUR, keys.FIVE, keys.SIX, keys.SEVEN].forEach((k, idx) => {
            if (Phaser.Input.Keyboard.JustDown(k)) {
                const targetMode = idx + 1;
                if ((targetMode === 6 || targetMode === 7) && wbLvl < 2) { playSFX('hurt'); showFloatText(this, player.x, player.y - 30, 'НУЖЕН ВЕРСТАК LVL 2!', '#ff0055'); return; }
                buildMode = targetMode; wbOpen = false; wbContainer.setVisible(false);
            }
        });

        hunger = Math.max(0, hunger - 1.3 * dt);
        if (hunger <= 0) player.hp = Math.max(0, player.hp - 2.5 * dt);
        else if (!isNight && hunger > 60 && player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + 2 * dt);

        phaseTimer -= dt;
        if (phaseTimer <= 0) {
            isNight = !isNight;
            if (isNight) { phaseTimer = 26 + dayNum * 3; if (dayNum % 5 === 0) spawnBoss(this); }
            else {
                dayNum++; totalDaysSurvived++; if (dayNum > bestDay) bestDay = dayNum; saveStats();
                infectionRate = Math.min(100, infectionRate + 10); phaseTimer = 28; core.hp = Math.min(core.maxHp, core.hp + 20);
                const missing = Math.max(0, 65 - resNodes.countActive());
                if (missing > 0) spawnNatureResources(this, Math.min(missing, 18));
                showFloatText(this, player.x, player.y - 45, 'РАССВЕТ! ЗАРАЖЕНИЕ +10% (' + infectionRate + '%)', '#ff0055');
            }
        }
        nightOverlay.alpha = Phaser.Math.Linear(nightOverlay.alpha, isNight ? 0.44 : 0, 0.04);
        lightGfx.clear();
        if (isNight) lamps.getChildren().forEach(l => {
            lightGfx.fillStyle(l.lvl === 2 ? 0x80f8ff : 0xfff3b0, 0.16).fillCircle(l.x, l.y, l.lvl === 2 ? 235 : 145);
            lightGfx.fillStyle(l.lvl === 2 ? 0x00f0ff : 0xffee00, 0.25).fillCircle(l.x, l.y, l.lvl === 2 ? 115 : 65);
        });

        player.setVelocity(0);
        let isMoving = false;
        if (!wbOpen) {
            if (keys.A.isDown) { player.setVelocityX(-260); isMoving = true; }
            if (keys.D.isDown) { player.setVelocityX(260); isMoving = true; }
            if (keys.W.isDown) { player.setVelocityY(-260); isMoving = true; }
            if (keys.S.isDown) { player.setVelocityY(260); isMoving = true; }
            if (Math.abs(joyVec.x) > 0.05 || Math.abs(joyVec.y) > 0.05) {
                player.setVelocity(joyVec.x * 260, joyVec.y * 260);
                isMoving = true;
            }
        }
        player.setScale(isMoving ? 1 + Math.sin(time * 0.018) * 0.06 : 1, isMoving ? 1 - Math.sin(time * 0.018) * 0.06 : 1);

        const ptr = this.input.activePointer;
        if (!isMobileMode && ptr.isDown && !wbOpen) {
            player.setRotation(Phaser.Math.Angle.Between(player.x, player.y, ptr.worldX, ptr.worldY));
        } else if (isMoving) {
            player.setRotation(Math.atan2(player.body.velocity.y, player.body.velocity.x));
        }

        if (buildMode > 1 && !wbOpen) {
            const targetX = isMobileMode ? player.x + Math.cos(player.rotation) * 65 : ptr.worldX;
            const targetY = isMobileMode ? player.y + Math.sin(player.rotation) * 65 : ptr.worldY;
            const gx = Math.floor(targetX / 48) * 48 + 24, gy = Math.floor(targetY / 48) * 48 + 24;
            const inRange = Phaser.Math.Distance.Between(player.x, player.y, gx, gy) <= 220;
            const existing = findStructureAt(gx, gy);
            buildGhost.setVisible(true).setPosition(gx, gy);
            const ok = inRange && (buildMode === 4 ? existing : buildMode === 5 ? (existing || Phaser.Math.Distance.Between(targetX, targetY, core.x, core.y) < 55) : !existing);
            buildGhost.setStrokeStyle(2, ok ? 0x00ff88 : 0xff0055).fillColor = ok ? 0x00ff88 : 0xff0055;
        } else {
            buildGhost.setVisible(false);
            const wCfg = WEAPONS[weaponType];
            const isFiring = (!isMobileMode && ptr.isDown) || touchAttack;
            if (!wbOpen && isFiring && time > lastShot + wCfg.rate) {
                if (touchAttack) {
                    let nearTarget = null, minD = 380;
                    zombies.getChildren().forEach(z => { const d = Phaser.Math.Distance.Between(player.x, player.y, z.x, z.y); if (d < minD) { minD = d; nearTarget = z; } });
                    if (!nearTarget && wCfg.melee) {
                        resNodes.getChildren().forEach(n => { const d = Phaser.Math.Distance.Between(player.x, player.y, n.x, n.y); if (d < 110 && d < minD) { minD = d; nearTarget = n; } });
                    }
                    if (nearTarget) player.setRotation(Phaser.Math.Angle.Between(player.x, player.y, nearTarget.x, nearTarget.y));
                }
                lastShot = time; const totalDmg = wCfg.dmg + weaponBonusDmg;
                if (wCfg.melee) {
                    playSFX('swing');
                    const hx = player.x + Math.cos(player.rotation) * (wCfg.range * 0.65), hy = player.y + Math.sin(player.rotation) * (wCfg.range * 0.65);
                    const slash = this.add.circle(hx, hy, wCfg.range * 0.55, wCfg.color, 0.45).setDepth(5);
                    this.time.delayedCall(95, () => slash.destroy());
                    zombies.getChildren().slice().forEach(z => { if (Phaser.Math.Distance.Between(hx, hy, z.x, z.y) < wCfg.range * 0.75) damageZombie(this, z, totalDmg); });
                    resNodes.getChildren().slice().forEach(n => { if (Phaser.Math.Distance.Between(hx, hy, n.x, n.y) < wCfg.range * 0.75) harvestNode(this, n, 1); });
                } else {
                    playSFX('shoot'); spawnMuzzleFlash(this, player.x, player.y, player.rotation, wCfg.color); spawnShellCasing(player.x, player.y, player.rotation);
                    const b = bullets.create(player.x + Math.cos(player.rotation) * 26, player.y + Math.sin(player.rotation) * 26, 'bulletTex').setDepth(3).setTint(wCfg.color).setRotation(player.rotation);
                    b.dmg = totalDmg; this.physics.velocityFromRotation(player.rotation, 800, b.body.velocity);
                    this.time.delayedCall(900, () => { if (b.active) b.destroy(); });
                }
            }
        }

        friendsGroup.getChildren().forEach(fr => {
            fr.tag.setPosition(fr.x, fr.y - 28);
            if (!fr.rescued) return;
            const guardX = fr.friendName === 'МАКС' ? BASE_X - 75 : BASE_X + 75, guardY = BASE_Y + 65;
            if (Phaser.Math.Distance.Between(fr.x, fr.y, guardX, guardY) > 25) {
                this.physics.moveTo(fr, guardX, guardY, 210);
fr.setScale(1 + Math.sin(time * 0.018) * 0.05, 1 - Math.sin(time * 0.018) * 0.05);
} else { fr.setVelocity(0); fr.setScale(1, 1); }
let targetZ = null, minD = 360;
zombies.getChildren().forEach(z => { const d = Phaser.Math.Distance.Between(fr.x, fr.y, z.x, z.y); if (d < minD) { minD = d; targetZ = z; } });
if (targetZ) {
const ang = Phaser.Math.Angle.Between(fr.x, fr.y, targetZ.x, targetZ.y); fr.setRotation(ang);
if (time > fr.shootCD) {
fr.shootCD = time + 480; playSFX('shoot'); spawnMuzzleFlash(this, fr.x, fr.y, ang, 0x00ff88);
const b = bullets.create(fr.x + Math.cos(ang) * 22, fr.y + Math.sin(ang) * 22, 'bulletTex').setDepth(3).setTint(0x00ff88).setRotation(ang);
b.dmg = 2; this.physics.velocityFromRotation(ang, 820, b.body.velocity);
this.time.delayedCall(800, () => { if (b.active) b.destroy(); });
}
}
});
turrets.getChildren().forEach(t => {
let nearest = null, minDist = t.lvl === 2 ? 420 : 340;
zombies.getChildren().forEach(z => { const d = Phaser.Math.Distance.Between(t.x, t.y, z.x, z.y); if (d < minDist) { minDist = d; nearest = z; } });
if (nearest) {
const ang = Phaser.Math.Angle.Between(t.x, t.y, nearest.x, nearest.y); t.setRotation(ang);
if (time > t.lastFire + (t.lvl === 2 ? 230 : 420)) {
t.lastFire = time; playSFX('shoot'); spawnMuzzleFlash(this, t.x, t.y, ang, t.lvl === 2 ? 0xffee00 : 0xff0055);
(t.lvl === 2 ? [ang - 0.08, ang + 0.08] : [ang]).forEach(a => {
const b = bullets.create(t.x + Math.cos(a) * 22, t.y + Math.sin(a) * 22, 'bulletTex').setDepth(3).setTint(t.lvl === 2 ? 0xffee00 : 0xff0055).setRotation(a);
b.dmg = 1; this.physics.velocityFromRotation(a, 850, b.body.velocity);
this.time.delayedCall(800, () => { if (b.active) b.destroy(); });
});
}
}
});
if (isNight) { spawnTimer += delta; if (spawnTimer > Math.max(420, 2100 - infectionRate * 14)) { spawnTimer = 0; spawnZombie(this, 'forest'); } }
citySpawnTimer += delta;
if (citySpawnTimer > 1500 && zombies.countActive() < 36) { citySpawnTimer = 0; spawnZombie(this, 'wild'); }
zombies.getChildren().forEach(z => {
z.setScale(1 + Math.sin(time * 0.012 + z.x) * 0.05, 1 - Math.sin(time * 0.012 + z.x) * 0.05);
if (z.isBoss && z.hpBg && z.hpBar) { z.hpBg.setPosition(z.x, z.y - 54); z.hpBar.setPosition(z.x - 45, z.y - 54); z.hpBar.width = 90 * Math.max(0, z.hp / z.maxHp); }
const distToP = Phaser.Math.Distance.Between(z.x, z.y, player.x, player.y);
const target = (z.zone !== 'forest' || distToP < 270) ? player : core;
if (z.zone !== 'forest' && distToP > 700) { z.setVelocity(0); return; }
const ang = Phaser.Math.Angle.Between(z.x, z.y, target.x, target.y); z.setRotation(ang);
this.physics.velocityFromRotation(ang, (z.slowedUntil && time < z.slowedUntil) ? 38 : (z.baseSpd + dayNum * 5), z.body.velocity);
});
const biomeNames = [['ПАРИЖ', 'БОЛОТА', 'ЛЕСНОЙ ЛАГЕРЬ'], ['ПУСТОШЬ', 'МЕГАПОЛИС', 'ВОЕННАЯ БАЗА']];
const zoneName = biomeNames[Math.min(1, Math.floor(player.y / 1200))][Math.min(2, Math.floor(player.x / 1600))];
updateWeather(this, zoneName, dt);
const bpTags = (bpWall ? '[С]' : '') + (bpTurret ? '[Т]' : '') + (bpBuild ? '[Ш]' : '');
uiResText.setText('ДЕР:' + wood + ' | МЕТ:' + metal + ' | ЛИАН:' + vines + ' | ЕДА(F):' + food + ' | АПТ(H):' + medkits + ' | БАЗА:' + core.hp + ' ' + bpTags);
uiHpBar.width = 110 * (player.hp / player.maxHp); uiHpBar.fillColor = player.hp > 35 ? 0x00ff88 : 0xff0055;
uiHpText.setText(Math.ceil(player.hp) + '/100'); uiHungerBar.width = 100 * (hunger / 100);
uiInfText.setText('ЗАРАЖЕНИЕ: ' + infectionRate + '%').setColor(infectionRate >= 75 ? '#ff0055' : (infectionRate >= 45 ? '#ffbe0b' : '#00ff88'));
uiPhaseText.setText(zoneName + '\n' + (isNight ? 'НОЧЬ ' : 'ДЕНЬ ') + dayNum + ' (' + Math.ceil(phaseTimer) + 'с)').setColor(isNight ? '#ff0055' : '#00f0ff');
const wTitle = WEAPONS[weaponType].name + (weaponBonusDmg > 0 ? ' +' + weaponBonusDmg : ''), lockTag = wbLvl < 2 ? ' (ЗАКР.)' : '';
uiModeText.setText(['', '1:' + wTitle, '2:СТЕНА(15д)', '3:ТУРЕЛЬ(30м)', '4:СНОС', '5:РЕМОНТ', '6:ШИПЫ' + lockTag, '7:СВЕТ' + lockTag][buildMode] + ' | ВЕРСТАК LVL ' + wbLvl);
mapGfx.clear();
if (hasMap) {
mapHintTxt.setVisible(false);
const mx = 700, my = 535, mw = 186, mh = 93, bCols = [[0x3b0764, 0x2a4d3b, 0x1b4332], [0x5c4932, 0x334155, 0x262e29]];
mapGfx.fillStyle(0x090f0a, 0.92).fillRect(mx - 2, my - 2, mw + 4, mh + 4).lineStyle(2, 0x00ff88, 1).strokeRect(mx - 2, my - 2, mw + 4, mh + 4);
for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) mapGfx.fillStyle(bCols[r][c], 1).fillRect(mx + c * (mw / 3), my + r * (mh / 2), mw / 3, mh / 2);
mapGfx.fillStyle(0x00f0ff, 1).fillCircle(mx + (core.x / WORLD_W) * mw, my + (core.y / WORLD_H) * mh, 3.5);
chests.getChildren().forEach(ch => { if (!ch.opened) mapGfx.fillStyle(0xffee00, 1).fillRect(mx + (ch.x / WORLD_W) * mw - 1.5, my + (ch.y / WORLD_H) * mh - 1.5, 3, 3); });
friendsGroup.getChildren().forEach(fr => mapGfx.fillStyle(0x00ff88, 1).fillCircle(mx + (fr.x / WORLD_W) * mw, my + (fr.y / WORLD_H) * mh, 2.5));
mapGfx.fillStyle(0xffffff, 1).fillCircle(mx + (player.x / WORLD_W) * mw, my + (player.y / WORLD_H) * mh, 3);
}
if ((core.hp <= 0 || player.hp <= 0) && !isGameOver) {
isGameOver = true; wbOpen = false; wbContainer.setVisible(false); saveStats();
window.ysdk?.features?.GameplayAPI?.stop();
const reason = hunger <= 0 ? 'ТЫ ПОГИБ ОТ ГОЛОДА!' : (player.hp <= 0 ? 'ТЕБЯ СЪЕЛИ ЗОМБИ!' : 'РЕАКТОР БАЗЫ УНИЧТОЖЕН!');
statusText.setText(reason + '\nПрожито дней: ' + dayNum + '\nR — заново  |  ESC — в меню').setVisible(true);
this.reviveBtn.setVisible(true); this.reviveTxt.setVisible(true);
}
}
}
function createMobileControls(s) {
if (!isMobileMode) return;
joyVec = { x: 0, y: 0 }; touchAttack = false; touchActionE = false;
const baseX = 115, baseY = 510, maxR = 55;
s.add.circle(baseX, baseY, maxR, 0xffffff, 0.12).setScrollFactor(0).setDepth(26).setStrokeStyle(2, 0x00ff88, 0.5);
const joyThumb = s.add.circle(baseX, baseY, 24, 0x00ff88, 0.55).setScrollFactor(0).setDepth(27);
let joyPointerId = null;
const joyZone = s.add.zone(0, 260, 400, 390).setOrigin(0).setScrollFactor(0).setDepth(28).setInteractive();
joyZone.on('pointerdown', (p) => { if (!wbOpen && !isGameOver) { joyPointerId = p.id; updateJoy(p); } });
s.input.on('pointermove', (p) => { if (p.id === joyPointerId) updateJoy(p); });
s.input.on('pointerup', (p) => { if (p.id === joyPointerId) { joyPointerId = null; joyVec = { x: 0, y: 0 }; joyThumb.setPosition(baseX, baseY); } });
function updateJoy(p) {
const dx = p.x - baseX, dy = p.y - baseY, dist = Math.hypot(dx, dy), clamped = Math.min(dist, maxR), ang = Math.atan2(dy, dx);
joyThumb.setPosition(baseX + Math.cos(ang) * clamped, baseY + Math.sin(ang) * clamped);
if (dist > 8) { joyVec.x = Math.cos(ang); joyVec.y = Math.sin(ang); } else { joyVec.x = 0; joyVec.y = 0; }
}
function makeTouchBtn(x, y, r, label, col, onDown, onUp) {
const c = s.add.circle(x, y, r, col, 0.35).setScrollFactor(0).setDepth(26).setStrokeStyle(2, col, 0.9).setInteractive();
s.add.text(x, y, label, { fontSize: r > 30 ? '15px' : '13px', fontStyle: 'bold', fill: '#ffffff', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(27);
c.on('pointerdown', () => { c.setFillStyle(col, 0.7); if (onDown) onDown(); });
c.on('pointerup', () => { c.setFillStyle(col, 0.35); if (onUp) onUp(); });
c.on('pointerout', () => { c.setFillStyle(col, 0.35); if (onUp) onUp(); });
}
makeTouchBtn(810, 510, 44, 'ОГОНЬ\n/ СТРОЙ', 0xff0055, () => {
touchAttack = true;
if (buildMode > 1 && !wbOpen) {
const tx = player.x + Math.cos(player.rotation) * 65, ty = player.y + Math.sin(player.rotation) * 65;
const gx = Math.floor(tx / 48) * 48 + 24, gy = Math.floor(ty / 48) * 48 + 24;
if (buildMode === 2 && wood >= 15 && !findStructureAt(gx, gy)) { wood -= 15; playSFX('build'); const w = walls.create(gx, gy, 'wallTex').setDepth(3); w.hp = 6; w.maxHp = 6; w.lvl = 1; }
else if (buildMode === 3 && metal >= 30 && !findStructureAt(gx, gy)) { metal -= 30; playSFX('build'); const t = turrets.create(gx, gy, 'turretTex').setDepth(3); t.lastFire = 0; t.lvl = 1; }
else if (buildMode === 6 && wbLvl >= 2 && wood >= 10 && metal >= 10 && !findStructureAt(gx, gy)) { wood -= 10; metal -= 10; playSFX('build'); const sp = spikes.create(gx, gy, 'spikeTex').setDepth(2); sp.lvl = 1; }
else if (buildMode === 7 && wbLvl >= 2 && metal >= 20 && vines >= 10 && !findStructureAt(gx, gy)) { metal -= 20; vines -= 10; playSFX('build'); const l = lamps.create(gx, gy, 'lampTex').setDepth(3); l.lvl = 1; }
else if (buildMode === 4) { const target = findStructureAt(gx, gy); if (target) { playSFX('mine'); target.obj.destroy(); } }
else if (buildMode === 5) handleRepairAndUpgrade(s, { worldX: gx, worldY: gy }, gx, gy);
}
}, () => { touchAttack = false; });
makeTouchBtn(715, 535, 28, '[ E ]\nДЕЙСТВ', 0xffee00, () => { touchActionE = true; }, () => { touchActionE = false; });
makeTouchBtn(735, 455, 25, 'ЕДА\n[F]', 0xffbe0b, () => { if (food > 0 && hunger < 100) { food--; hunger = Math.min(100, hunger + 45); playSFX('build'); showFloatText(s, player.x, player.y - 30, '+45 СЫТОСТЬ!', '#ffbe0b'); } });
makeTouchBtn(815, 425, 25, 'ХИЛ\n[H]', 0x00ff88, () => { if (medkits > 0 && player.hp < player.maxHp) { medkits--; player.hp = Math.min(player.maxHp, player.hp + 40); playSFX('upgrade'); showFloatText(s, player.x, player.y - 30, '+40 HP!', '#00ff88'); } });
makeTouchBtn(645, 555, 24, 'РЕЖИМ\n1-7', 0x00f0ff, () => { const maxM = wbLvl >= 2 ? 7 : 5; buildMode = buildMode >= maxM ? 1 : buildMode + 1; wbOpen = false; wbContainer.setVisible(false); });
}


function showFloatText(s, x, y, msg, color = '#00ff88') {
    const t = s.add.text(x, y, msg, { fontSize: '14px', fontStyle: 'bold', fill: color, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(28);
    s.tweens.add({ targets: t, y: y - 35, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
}
function findStructureAt(gx, gy) {
    let found = null;
    walls.getChildren().forEach(w => { if (w.active && w.x === gx && w.y === gy) found = { type: 'wall', obj: w }; });
    if (found) return found;
    turrets.getChildren().forEach(t => { if (t.active && t.x === gx && t.y === gy) found = { type: 'turret', obj: t }; });
    if (found) return found;
    spikes.getChildren().forEach(sp => { if (sp.active && sp.x === gx && sp.y === gy) found = { type: 'spike', obj: sp }; });
    if (found) return found;
    lamps.getChildren().forEach(l => { if (l.active && l.x === gx && l.y === gy) found = { type: 'lamp', obj: l }; });
    return found;
}
function spawnZombie(s, zone) {
    let sx, sy;
    if (zone === 'forest') { const ang = Math.random() * Math.PI * 2; sx = Phaser.Math.Clamp(BASE_X + Math.cos(ang) * 650, 80, WORLD_W - 80); sy = Phaser.Math.Clamp(BASE_Y + Math.sin(ang) * 650, 80, WORLD_H - 80); }
    else { sx = Phaser.Math.Clamp(player.x + Phaser.Math.Between(-550, 550), 80, WORLD_W - 80); sy = Phaser.Math.Clamp(player.y + Phaser.Math.Between(-550, 550), 80, WORLD_H - 80); if (Phaser.Math.Distance.Between(sx, sy, player.x, player.y) < 300) return; }
    const roll = Math.random();
    let tex = 'zombieTex', hp = 3 + Math.floor(dayNum / 2), spd = 85, dmg = 1;
    if (roll < 0.25 && dayNum >= 2) { tex = 'runnerTex'; hp = 2 + Math.floor(dayNum / 3); spd = 145; dmg = 1; }
    else if (roll > 0.85 && dayNum >= 3) { tex = 'bruteTex'; hp = 10 + dayNum * 2; spd = 55; dmg = 2; }
    const z = zombies.create(sx, sy, tex).setDepth(4).setCollideWorldBounds(true);
    z.body.setCircle(15, 7, 7); z.hp = hp; z.maxHp = hp; z.baseSpd = spd; z.zDmg = dmg; z.zone = zone;
}
function spawnBoss(s) {
    playSFX('boss'); showFloatText(s, player.x, player.y - 60, 'ВНИМАНИЕ! ПРИБЛИЖАЕТСЯ ТИТАН!', '#ff0055');
    const z = zombies.create(BASE_X - 700, BASE_Y, 'bossTex').setDepth(5).setCollideWorldBounds(true);
    z.body.setCircle(32, 12, 12); z.isBoss = true; z.hp = 60 + dayNum * 15; z.maxHp = z.hp; z.baseSpd = 65; z.zDmg = 3; z.zone = 'forest';
    z.hpBg = s.add.rectangle(z.x, z.y - 54, 94, 10, 0x000000).setDepth(12);
    z.hpBar = s.add.rectangle(z.x - 45, z.y - 54, 90, 6, 0xff0055).setOrigin(0, 0.5).setDepth(13);
}
function damageZombie(s, z, dmg) {
    if (!z || !z.active) return;
    z.hp -= dmg; spawnSparks(s, z.x, z.y, 0xff0055); z.setTint(0xffffff);
    s.time.delayedCall(70, () => { if (z.active) z.clearTint(); });
    if (z.hp <= 0) {
        spawnBloodDecal(z.x, z.y, z.isBoss); totalKills++; saveStats();
        if (z.isBoss) { if (z.hpBg) z.hpBg.destroy(); if (z.hpBar) z.hpBar.destroy(); metal += 40; medkits += 2; showFloatText(s, z.x, z.y - 30, 'ТИТАН ПОВЕРЖЕН! +40 МЕТ. +2 АПТ.', '#ffee00'); }
        z.destroy();
    }
}
function harvestNode(s, node, dmg) {
    if (!node || !node.active) return;
    node.hp -= dmg; playSFX('mine'); spawnSparks(s, node.x, node.y, 0xffbe0b); node.setTint(0xcccccc);
    s.time.delayedCall(80, () => { if (node.active) node.clearTint(); });
    if (node.hp <= 0) {
        if (node.resType === 'wood') { const g = Phaser.Math.Between(6, 10); wood += g; showFloatText(s, node.x, node.y - 20, '+' + g + ' ДЕРЕВА', '#00ff88'); }
        else if (node.resType === 'metal') { const g = Phaser.Math.Between(5, 8); metal += g; showFloatText(s, node.x, node.y - 20, '+' + g + ' МЕТАЛЛА', '#00f0ff'); }
        else { const g = Phaser.Math.Between(4, 7); vines += g; if (Math.random() < 0.45) { food++; showFloatText(s, node.x, node.y - 20, '+' + g + ' ЛИАН +1 ЯГОДЫ', '#ffbe0b'); } else showFloatText(s, node.x, node.y - 20, '+' + g + ' ЛИАН', '#a7f3d0'); }
        node.destroy();
    }
}
function updateWeather(s, zoneName, dt) {
    s.weatherGfx.clear();
    if (zoneName === 'БОЛОТА') {
        s.weatherTint.fillColor = 0x1b4332; s.weatherTint.alpha = 0.14; s.weatherGfx.lineStyle(1.5, 0x70e000, 0.4);
        s.weatherParticles.forEach(p => { p.y += 280 * p.speed * dt; p.x -= 40 * dt; if (p.y > 650) { p.y = 0; p.x = Math.random() * 900; } s.weatherGfx.lineBetween(p.x, p.y, p.x - 3, p.y + 12); });
    } else if (zoneName === 'ПУСТОШЬ') {
        s.weatherTint.fillColor = 0xd97706; s.weatherTint.alpha = 0.12; s.weatherGfx.fillStyle(0xfbbf24, 0.35);
        s.weatherParticles.forEach(p => { p.x += 220 * p.speed * dt; p.y += 30 * dt; if (p.x > 900) { p.x = 0; p.y = Math.random() * 650; } s.weatherGfx.fillCircle(p.x, p.y, p.size); });
    } else { s.weatherTint.alpha = 0; }
}
function openChestLoot(s, ch) {
    ch.opened = true; ch.setTexture('chestOpenTex'); playSFX('upgrade');
    if (ch.chestKind === 'bp_wall') { bpWall = true; medkits++; food += 2; wood += 20; showFloatText(s, ch.x, ch.y - 35, 'ЧЕРТЁЖ: БРОНЕ-СТЕНА!', '#00f0ff'); }
    else if (ch.chestKind === 'bp_turret') { bpTurret = true; medkits++; food += 2; metal += 20; showFloatText(s, ch.x, ch.y - 35, 'ЧЕРТЁЖ: ЗОЛОТАЯ ТУРЕЛЬ!', '#ffee00'); }
    else if (ch.chestKind === 'bp_build') { bpBuild = true; metal += 35; vines += 20; showFloatText(s, ch.x, ch.y - 35, 'ЧЕРТЁЖ СТРОЙКИ: ШИПЫ И СВЕТ!', '#ffbe0b'); }
    else if (ch.chestKind === 'med') { medkits += 3; metal += 25; food++; showFloatText(s, ch.x, ch.y - 35, '+3 АПТЕЧКИ +25 МЕТ. +1 ЕДА!', '#00ff88'); }
    else if (ch.chestKind === 'food') { food += 4; vines += 15; showFloatText(s, ch.x, ch.y - 35, '+4 ЕДЫ +15 ЛИАН!', '#ffbe0b'); }
    else if (ch.chestKind === 'wood') { wood += 45; showFloatText(s, ch.x, ch.y - 35, '+45 ДЕРЕВА!', '#00ff88'); }
    else if (ch.chestKind === 'gun') { metal += 45; weaponBonusDmg++; showFloatText(s, ch.x, ch.y - 35, 'АРСЕНАЛ БУНКЕРА: +45 МЕТ. +1 УРОН!', '#ff0055'); }
    else { medkits++; food += 2; wood += 25; vines += 20; showFloatText(s, ch.x, ch.y - 35, '+1 АПТЕЧКА +2 ЕДЫ +РЕСУРСЫ!', '#ffee00'); }
}
function handleRepairAndUpgrade(s, ptr, gx, gy) {
    if (Phaser.Math.Distance.Between(ptr.worldX, ptr.worldY, core.x, core.y) < 55) {
        if (core.hp < core.maxHp && wood >= 15 && metal >= 10) { wood -= 15; metal -= 10; core.hp = Math.min(core.maxHp, core.hp + 50); playSFX('upgrade'); showFloatText(s, core.x, core.y - 45, '+50 HP БАЗА!', '#00ff88'); }
        return;
    }
    const target = findStructureAt(gx, gy);
    if (!target) return;
    if (target.type === 'wall') {
        const w = target.obj;
        if (w.hp < w.maxHp && wood >= 5) { wood -= 5; w.hp = w.maxHp; playSFX('build'); showFloatText(s, w.x, w.y - 25, 'ПОЧИНЕНО!', '#00ff88'); }
        else if (w.lvl === 1 && bpWall && metal >= 25) { metal -= 25; w.lvl = 2; w.maxHp = 18; w.hp = 18; w.setTexture('wallTex2'); playSFX('upgrade'); showFloatText(s, w.x, w.y - 25, 'БРОНЯ LVL 2!', '#00f0ff'); }
    } else if (target.type === 'turret' && target.obj.lvl === 1 && bpTurret && metal >= 50) { metal -= 50; target.obj.lvl = 2; target.obj.setTexture('turretTex2'); playSFX('upgrade'); showFloatText(s, target.obj.x, target.obj.y - 25, 'ТУРЕЛЬ LVL 2!', '#ffee00'); }
    else if (target.type === 'spike' && target.obj.lvl === 1 && bpBuild && metal >= 20) { metal -= 20; target.obj.lvl = 2; target.obj.setTexture('spikeTex2'); playSFX('upgrade'); showFloatText(s, target.obj.x, target.obj.y - 25, 'ШИПЫ LVL 2!', '#ffbe0b'); }
    else if (target.type === 'lamp' && target.obj.lvl === 1 && bpBuild && metal >= 20 && vines >= 10) { metal -= 20; vines -= 10; target.obj.lvl = 2; target.obj.setTexture('lampTex2'); playSFX('upgrade'); showFloatText(s, target.obj.x, target.obj.y - 25, 'ПРОЖЕКТОР LVL 2!', '#00f0ff'); }
}
function decorateWorld(s) {
    const g = s.add.graphics().setDepth(1), topG = s.add.graphics().setDepth(2);
    topG.lineStyle(5, 0x94a3b8, 0.9).lineBetween(240, 480, 310, 280).lineBetween(400, 480, 330, 280).lineBetween(265, 410, 375, 410).lineBetween(290, 340, 350, 340);
    topG.lineStyle(4, 0xff0055, 0.9).lineBetween(320, 280, 320, 240);
    g.fillStyle(0x64748b, 1).fillRect(140, 960, 45, 110).fillRect(245, 960, 45, 110).fillRect(140, 940, 150, 30);
    for (let i = 0; i < 3; i++) { const cx = 480 + i * 52, cy = 655; topG.fillStyle(0x0f172a, 1).fillCircle(cx, cy, 17).fillStyle(0x00f0ff, 0.5).fillCircle(cx, cy, 13).fillStyle(0x52b788, 0.9).fillCircle(cx, cy, 6); }
    [{ x: 3500, y: 240 }, { x: 4500, y: 260 }, { x: 3520, y: 1020 }].forEach(h => { g.fillStyle(0x9b2226, 0.85).fillRoundedRect(h.x - 42, h.y + 12, 84, 44, 6).fillStyle(0x4a5568, 1).fillCircle(h.x - 130, h.y + 40, 16).fillStyle(0xff4d00, 0.9).fillCircle(h.x - 130, h.y + 40, 9); });
    for (let i = 0; i < 4; i++) topG.fillStyle(0x7f4f24, 1).fillRect(4380, 930 + i * 14, 65, 10);
    topG.fillStyle(0xcbd5e1, 1).fillCircle(4530, 980, 18);
    g.fillStyle(0x181a20, 1).fillRect(1650, 1760, 1500, 100).lineStyle(3, 0xffbe0b, 0.85).lineBetween(1650, 1810, 3150, 1810);
    topG.fillStyle(0xff0055, 1).fillRect(2043, 1470, 14, 38).fillRect(2031, 1482, 38, 14);
    for (let i = 0; i < 3; i++) topG.fillStyle(0xffffff, 1).fillRoundedRect(1950, 1480 + i * 55, 52, 28, 4).fillStyle(0x00b4d8, 0.85).fillRect(1966, 1483 + i * 55, 32, 22);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) topG.fillStyle(0x475569, 1).fillRect(2090 + c * 85, 2020 + r * 55, 58, 22).fillStyle(0xffbe0b, 1).fillRect(2096 + c * 85, 2024 + r * 55, 12, 14);
    topG.fillStyle(0xf59e0b, 1).fillRect(2720, 1380, 180, 12).fillStyle(0x94a3b8, 1).fillRect(2740, 1480, 70, 35);
    topG.fillStyle(0x3f6212, 1).fillRoundedRect(3650, 1550, 110, 64, 8).fillStyle(0x4d7c0f, 1).fillCircle(3700, 1582, 24).fillRect(3715, 1577, 65, 10);
    topG.lineStyle(3, 0x00f0ff, 0.8).strokeCircle(650, 1850, 48).strokeCircle(650, 1850, 22).lineBetween(650, 1850, 695, 1815);
[{ x: 420, y: 1520 }, { x: 1120, y: 1980 }].forEach(b => topG.fillStyle(0xca6702, 1).fillCircle(b.x, b.y, 13).fillStyle(0x70e000, 0.85).fillCircle(b.x + 12, b.y + 8, 9));
}
function spawnNatureResources(s, count) {
for (let i = 0; i < count; i++) {
const rx = 120 + Math.random() * (WORLD_W - 240), ry = 120 + Math.random() * (WORLD_H - 240);
if (Phaser.Math.Distance.Between(rx, ry, BASE_X, BASE_Y) < 220) continue;
const kind = Math.floor(Math.random() * 3), node = resNodes.create(rx, ry, kind === 0 ? 'treeTex' : (kind === 1 ? 'metalTex' : 'bushTex')).setDepth(2);
node.resType = kind === 0 ? 'wood' : (kind === 1 ? 'metal' : 'vines'); node.hp = kind === 2 ? 2 : 3;
}
}
let wbRows = [];
function createWorkbenchUI(s) {
wbContainer = s.add.container(0, 0).setDepth(30).setVisible(false);
const title = s.add.text(450, 125, 'ВЕРСТАК (УРОВЕНЬ 1)', { fontSize: '22px', fontStyle: 'bold', fill: '#ffbe0b' }).setOrigin(0.5).setScrollFactor(0);
wbContainer.add([s.add.rectangle(450, 340, 580, 490, 0x0c140e, 0.96).setScrollFactor(0).setStrokeStyle(3, 0xffbe0b), title, s.add.text(450, 565, '[ E ] или [ ESC ] — закрыть', { fontSize: '14px', fill: '#aaaaaa' }).setOrigin(0.5).setScrollFactor(0)]);
wbContainer.titleObj = title;
const items = [
{ y: 175, minLvl: 1, label: 'Скрафтить МИНИ-КАРТУ МИРА (Радар)', cost: '10 Дерева', act: () => { if (!hasMap && wood >= 10) { wood -= 10; hasMap = true; return true; } } },
{ y: 227, minLvl: 1, label: 'Улучшить Палку -> САБЛЯ (Урон 3)', cost: '20 Лиан + 10 Дерева', act: () => { if (vines >= 20 && wood >= 10 && weaponType === 'stick') { vines -= 20; wood -= 10; weaponType = 'saber'; return true; } } },
{ y: 279, minLvl: 1, label: 'Скрафтить ПИСТОЛЕТ (Дальний бой)', cost: '25 Металла + 15 Дерева', act: () => { if (metal >= 25 && wood >= 15 && weaponType !== 'pistol' && weaponType !== 'rifle') { metal -= 25; wood -= 15; weaponType = 'pistol'; return true; } } },
{ y: 331, minLvl: 2, label: 'Скрафтить ВИНТОВКУ (Нужен Верстак 2)', cost: '50 Металла + 20 Лиан', act: () => { if (wbLvl >= 2 && metal >= 50 && vines >= 20 && weaponType !== 'rifle') { metal -= 50; vines -= 20; weaponType = 'rifle'; return true; } } },
{ y: 383, minLvl: 3, label: 'Мастерская заточка (+2 Урон, Верстак 3)', cost: '35 Металла + 20 Лиан', act: () => { if (wbLvl >= 3 && metal >= 35 && vines >= 20) { metal -= 35; vines -= 20; weaponBonusDmg += 2; return true; } } },
{ y: 437, minLvl: 1, isWbUp: true, label: 'УЛУЧШИТЬ ВЕРСТАК -> LVL 2 (Шипы и Свет)', cost: '40Д + 30М + 15Л', act: () => {
if (wbLvl === 1 && wood >= 40 && metal >= 30 && vines >= 15) { wood -= 40; metal -= 30; vines -= 15; wbLvl = 2; workbench.setTexture('wbTex2'); return true; }
else if (wbLvl === 2 && metal >= 60 && vines >= 35) { metal -= 60; vines -= 35; wbLvl = 3; workbench.setTexture('wbTex3'); return true; }
}}
];
wbRows = [];
items.forEach(it => {
const btn = s.add.rectangle(450, it.y, 520, 42, 0x182b1d).setScrollFactor(0).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff88);
const t1 = s.add.text(205, it.y, it.label, { fontSize: '13px', fontStyle: 'bold', fill: '#ffffff' }).setOrigin(0, 0.5).setScrollFactor(0);
const t2 = s.add.text(695, it.y, it.cost, { fontSize: '12px', fontStyle: 'bold', fill: '#ffee00' }).setOrigin(1, 0.5).setScrollFactor(0);
btn.on('pointerdown', () => { if (it.act()) { playSFX('upgrade'); refreshWorkbenchUI(s); showFloatText(s, player.x, player.y - 30, 'ГОТОВО!', '#00ff88'); } else playSFX('hurt'); });
wbContainer.add([btn, t1, t2]); wbRows.push({ it, btn, t1, t2 });
});
const adBtn = s.add.rectangle(450, 502, 520, 42, 0x0f172a).setScrollFactor(0).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00f0ff);
const adTxt = s.add.text(450, 502, '[РЕКЛАМА] ГРУЗ С НЕБА: +50 ДЕР. +40 МЕТ. +2 АПТЕЧКИ', { fontSize: '13px', fontStyle: 'bold', fill: '#00f0ff' }).setOrigin(0.5).setScrollFactor(0);
adBtn.on('pointerdown', () => { showRewardedAd(() => { wood += 50; metal += 40; medkits += 2; playSFX('upgrade'); showFloatText(s, player.x, player.y - 35, 'ГРУЗ ДОСТАВЛЕН: +50Д +40М +2 АПТ!', '#00f0ff'); }); });
wbContainer.add([adBtn, adTxt]);
}
function refreshWorkbenchUI(s) {
wbContainer.titleObj.setText('ВЕРСТАК (УРОВЕНЬ ' + wbLvl + ')');
wbRows.forEach(row => {
if (row.it.isWbUp) {
row.t1.setText(wbLvl === 1 ? 'УЛУЧШИТЬ ВЕРСТАК -> LVL 2 (Шипы, Свет, Винтовка)' : (wbLvl === 2 ? 'УЛУЧШИТЬ ВЕРСТАК -> LVL 3 (Заточка +2)' : 'ВЕРСТАК МАКСИМАЛЬНОГО УРОВНЯ'));
row.t2.setText(wbLvl === 1 ? '40Д + 30М + 15Л' : (wbLvl === 2 ? '60М + 35Л' : 'МАКС.'));
} else { const locked = wbLvl < row.it.minLvl; row.btn.setStrokeStyle(2, locked ? 0x555555 : 0x00ff88); row.t1.setColor(locked ? '#777777' : '#ffffff'); }
});
}
const config = {
type: Phaser.AUTO,
width: 900,
height: 650,
backgroundColor: '#090d0a',
input: { activePointers: 3 },
scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
physics: { default: 'arcade', arcade: { debug: false } },
scene: [MenuScene, IntroScene, GameScene]
};
const game = new Phaser.Game(config);