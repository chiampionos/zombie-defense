var menuCanvas = document.getElementById('menu-canvas');
var menuCtx = menuCanvas.getContext('2d');
var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext('2d');

var TILE = 40, MAP_W = 24, MAP_H = 18;
var PLAYER_SPEED = 3, CAR_SPEED = 7, CAR_DAMAGE = 150;
var ROAD = 0, WALL = 1, GRASS = 2, DOOR = 3;

var mapNames = ['Downtown','Industrial Zone','Suburb','Hospital District','Military Base','Shopping Center','Harbor','Old Town','Tech Park','Airport','Stadium','Underground','Rooftop','Fire Station','Police Station','School','Mall','Warehouse','City Hall','Park Avenue'];

var map = [], buildings = [];

// ===== PERSISTENT DATA =====
var playerData = {
    gold: 0, totalWins: 0, totalLosses: 0,
    ownedArmor: ['none'], ownedVehicles: ['car'], ownedWeapons: ['pistol'], ownedShirts: ['black_hoodie'], ownedUpgrades: [],
    equippedArmor: 'none', equippedVehicle: 'car', equippedWeapon: 'pistol', equippedShirt: 'black_hoodie'
};

var shopData = {
    armor: [
        { id: 'none', name: 'No Armor', desc: 'Default - 100 HP', price: 0 },
        { id: 'wooden', name: 'Wooden Armor', desc: '+20 HP', price: 10 },
        { id: 'swat', name: 'SWAT Armor', desc: '+50 HP', price: 40 },
        { id: 'military', name: 'Military Armor', desc: '+100 HP', price: 67 }
    ],
    vehicles: [
        { id: 'car', name: 'Armored Car', desc: 'Basic', price: 10 },
        { id: 'jeep', name: 'Military Jeep', desc: 'Fast', price: 20 },
        { id: 'humvee', name: 'Humvee', desc: 'Tough', price: 40 },
        { id: 'tank', name: 'Tank', desc: 'Slow but strong', price: 30 },
        { id: 'ifv', name: 'IFV', desc: 'Fast combat', price: 50 },
        { id: 'howitzer', name: 'Howitzer', desc: 'Long range', price: 53 },
        { id: 'rocket_truck', name: 'Rocket Truck', desc: 'Devastating', price: 67 }
    ],
    weapons: [
        { id: 'pistol', name: 'Pistol Set', desc: 'Pistol + Knife + Shotgun', price: 0 },
        { id: 'swat_set', name: 'SWAT Set', desc: 'SMG + Knife + 4 Grenades', price: 10 },
        { id: 'riot_set', name: 'Riot Set', desc: 'AK-147 + Dagger + 6 Grenades', price: 67 }
    ],
    shirts: [
        { id: 'black_hoodie', name: 'Black Hoodie', desc: 'Default', price: 0 },
        { id: 'white_shirt', name: 'White Shirt', desc: 'Clean look', price: 10 }
    ],
    upgrades: [
        { id: 'stone_wall', name: 'Stone Wall', desc: 'Harder to break', price: 30 },
        { id: 'stone_gate', name: 'Stone Gate', desc: 'Same as stone wall', price: 30 },
        { id: 'carl_upgrade', name: 'Carl HP Boost', desc: 'Carls have 400 HP', price: 50 },
        { id: 'unlock_flame', name: 'Unlock Flame Tower', desc: 'Burn nearby zombies', price: 40 },
        { id: 'unlock_sniper', name: 'Unlock Sniper Tower', desc: 'Long range shots', price: 60 },
        { id: 'unlock_tesla', name: 'Unlock Tesla Tower', desc: 'Chain lightning', price: 80 },
        { id: 'unlock_watch', name: 'Unlock Watchtower', desc: 'Powerful long range', price: 100 }
    ]
};

var guns = [
    { name: 'Pistol', fireRate: 18, damage: 25, spread: 0, bullets: 1, ammo: 15, reloadTime: 45, bulletSpeed: 12 },
    { name: 'Shotgun', fireRate: 36, damage: 18, spread: 0.4, bullets: 5, ammo: 8, reloadTime: 70, bulletSpeed: 10 },
    { name: 'SMG', fireRate: 6, damage: 12, spread: 0.12, bullets: 1, ammo: 40, reloadTime: 55, bulletSpeed: 11 },
    { name: 'Rifle', fireRate: 40, damage: 80, spread: 0, bullets: 1, ammo: 5, reloadTime: 90, bulletSpeed: 16 }
];

var weaponSets = {
    pistol:   { guns: [0, 1],          grenades: 0 },
    swat_set: { guns: [2, 1],          grenades: 4 },
    riot_set: { guns: [3, 2, 0],       grenades: 6 }
};

var playerGuns = [0, 1];

function getGun() { return guns[playerGuns[gameState.currentGun]]; }

var towerTypes = {
    turret: { cost: 50, range: 160, damage: 15, fireRate: 30, health: 200, color: '#9b59b6' },
    flame: { cost: 80, range: 80, damage: 5, fireRate: 4, health: 150, color: '#e74c3c', aoe: 50 },
    sniper: { cost: 100, range: 300, damage: 60, fireRate: 60, health: 120, color: '#3498db' },
    tesla: { cost: 120, range: 120, damage: 20, fireRate: 20, health: 160, color: '#f1c40f', chain: 3 },
    watch: { cost: 150, range: 280, damage: 45, fireRate: 40, health: 250, color: '#e67e22' }
};

var zombieTypes = {
    normal: { color: '#1e8449', inner: '#145a32', size: 12, speedMul: 1.0, hpMul: 1.0, damage: 8, reward: 10 },
    fast: { color: '#2980b9', inner: '#1a5276', size: 10, speedMul: 1.8, hpMul: 0.6, damage: 5, reward: 15 },
    tank: { color: '#8e44ad', inner: '#6c3483', size: 16, speedMul: 0.6, hpMul: 2.5, damage: 15, reward: 25 },
    exploder: { color: '#e67e22', inner: '#d35400', size: 13, speedMul: 1.2, hpMul: 0.8, damage: 10, reward: 20 },
    spitter: { color: '#27ae60', inner: '#1e8449', size: 11, speedMul: 1.0, hpMul: 0.9, damage: 6, reward: 15, ranged: true, range: 150 },
    screamer: { color: '#e74c3c', inner: '#c0392b', size: 13, speedMul: 0.8, hpMul: 1.2, damage: 8, reward: 20, buff: true },
    brute: { color: '#7f8c8d', inner: '#566573', size: 18, speedMul: 0.4, hpMul: 3.5, damage: 25, reward: 35, smashes: true },
    leaper: { color: '#1abc9c', inner: '#16a085', size: 11, speedMul: 1.5, hpMul: 0.7, damage: 8, reward: 20, leaps: true },
    swarm: { color: '#f39c12', inner: '#d68910', size: 7, speedMul: 2.0, hpMul: 0.2, damage: 3, reward: 5 }
};

var waveData = [];
for (var w = 0; w < 20; w++) {
    var types = ['normal'];
    if (w >= 1) types.push('fast');
    if (w >= 2) types.push('swarm');
    if (w >= 3) types.push('tank');
    if (w >= 4) types.push('spitter');
    if (w >= 5) types.push('exploder');
    if (w >= 6) types.push('screamer');
    if (w >= 8) types.push('brute');
    if (w >= 10) types.push('leaper');
    waveData.push({ count: 76, speed: 1.0 + w * 0.08, hp: 50 * (1.0 + w * 0.12), types: types });
}

var gameState = {
    running: false, wave: 1, maxWaves: 16, kills: 0, money: 0,
    zombiesInWave: 0, zombiesKilledInWave: 0, waveDelay: 0,
    waveActive: false, spawnQueue: 0, spawnTimer: 0,
    gameOver: false, won: false, currentGun: 0, fireTimer: 0,
    paused: false, buildMode: 0, openBackpack: false, inMenu: true
};

var player = { x: 0, y: 0, size: 14, health: 100, maxHealth: 100, angle: 0, ammo: 15, maxAmmo: 15, reloading: false, reloadTimer: 0, inCar: false, armor: 0 };
var car = { x: 0, y: 0, angle: 0, active: true, occupied: false, speed: CAR_SPEED, health: 300, maxHealth: 300, damage: CAR_DAMAGE, isTank: false };
var carls = [];
var bullets = [], zombies = [], pickups = [], towers = [], walls = [], gates = [], explosions = [], acidBalls = [];
var backpack = { medkits: 0, ammoPacks: 0, grenades: 0 };
var keys = {};
var mouse = { x: 480, y: 360, down: false };

// ===== MENU STATE =====
var menuZombies = [];
var menuTime = 0;

function initMenu() {
    menuZombies = [];
    for (var i = 0; i < 15; i++) {
        menuZombies.push({
            x: Math.random() * 960,
            y: 350 + Math.random() * 300,
            size: 8 + Math.random() * 8,
            speed: 0.3 + Math.random() * 0.5,
            color: ['#1e8449','#2980b9','#8e44ad','#e67e22'][Math.floor(Math.random()*4)]
        });
    }
}

function drawMenu() {
    menuTime++;
    var c = menuCtx;
    // Sky
    var grad = c.createLinearGradient(0, 0, 0, 720);
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(0.4, '#1a1a3e');
    grad.addColorStop(0.6, '#2c3e50');
    grad.addColorStop(1, '#1a1a2e');
    c.fillStyle = grad;
    c.fillRect(0, 0, 960, 720);

    // Stars
    c.fillStyle = '#fff';
    for (var i = 0; i < 30; i++) {
        var sx = (i * 137 + 50) % 960;
        var sy = (i * 89 + 20) % 200;
        c.globalAlpha = 0.3 + Math.sin(menuTime * 0.02 + i) * 0.3;
        c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;

    // Moon
    c.fillStyle = '#f5f5dc';
    c.beginPath(); c.arc(800, 80, 35, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#0a0a2e';
    c.beginPath(); c.arc(812, 75, 30, 0, Math.PI * 2); c.fill();

    // Buildings background
    var bColors = ['#1a1a2e','#16213e','#0f3460','#1a1a3e','#2c3e50'];
    for (var i = 0; i < 18; i++) {
        var bx = i * 56 - 10;
        var bh = 120 + (i * 37 % 100);
        var bw = 40 + (i * 23 % 20);
        c.fillStyle = bColors[i % bColors.length];
        c.fillRect(bx, 400 - bh, bw, bh + 50);
        // Windows
        c.fillStyle = 'rgba(241,196,15,0.3)';
        for (var wy = 400 - bh + 10; wy < 400; wy += 18) {
            for (var wx = bx + 5; wx < bx + bw - 5; wx += 12) {
                if (Math.random() > 0.3) c.fillRect(wx, wy, 6, 8);
            }
        }
    }

    // Ground
    c.fillStyle = '#2c3e50';
    c.fillRect(0, 400, 960, 320);
    c.fillStyle = '#34495e';
    c.fillRect(0, 400, 960, 3);

    // Road
    c.fillStyle = '#4a4a4a';
    c.fillRect(0, 450, 960, 200);
    c.fillStyle = '#f1c40f';
    for (var i = 0; i < 20; i++) { c.fillRect(i * 55 + 10, 545, 30, 4); }

    // Menu zombies
    for (var i = 0; i < menuZombies.length; i++) {
        var z = menuZombies[i];
        z.x += z.speed;
        if (z.x > 980) z.x = -20;
        c.fillStyle = z.color;
        c.beginPath(); c.arc(z.x, z.y, z.size, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#000';
        c.beginPath(); c.arc(z.x, z.y, z.size - 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#e74c3c';
        c.fillRect(z.x - 4, z.y - 3, 3, 3);
        c.fillRect(z.x + 1, z.y - 3, 3, 3);
    }

    // Player character (center)
    drawMenuCharacter(c, 480, 540, '#1a1a1a', '#f5cba7', true);

    // Carl 1 (left)
    drawMenuCharacter(c, 380, 540, '#2980b9', '#f5cba7', false);

    // Carl 2 (right)
    drawMenuCharacter(c, 580, 540, '#2980b9', '#f5cba7', false);

    // Money display
    c.fillStyle = 'rgba(0,0,0,0.7)';
    c.beginPath(); c.arc(890, 35, 25, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f1c40f';
    c.beginPath(); c.arc(890, 35, 22, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#000';
    c.font = 'bold 16px Courier New';
    c.textAlign = 'center';
    c.fillText('$', 890, 41);
    c.fillStyle = '#f1c40f';
    c.font = 'bold 18px Courier New';
    c.fillText('' + playerData.gold, 890, 70);

    // Shop buttons - Carl 1 side (left)
    drawMenuButton(c, 80, 480, 140, 40, 'ARMOR', '#8B6914', '#A07818');
    drawMenuButton(c, 80, 530, 140, 40, 'VEHICLES', '#555', '#777');
    drawMenuButton(c, 80, 580, 140, 40, 'WEAPONS', '#c0392b', '#e74c3c');

    // Shop buttons - Carl 2 side (right)
    drawMenuButton(c, 740, 480, 140, 40, 'SETTINGS', '#555', '#777');
    drawMenuButton(c, 740, 530, 140, 40, 'SHIRT', '#1a1a1a', '#444');
    drawMenuButton(c, 740, 580, 140, 40, 'UPGRADES', '#8e44ad', '#9b59b6');

    // Play button
    var pulse = Math.sin(menuTime * 0.05) * 10;
    c.shadowColor = '#3498db';
    c.shadowBlur = 30 + pulse;
    c.fillStyle = '#2980b9';
    c.beginPath();
    c.roundRect(380, 630, 200, 60, 15);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#fff';
    c.font = 'bold 32px Courier New';
    c.textAlign = 'center';
    c.fillText('PLAY', 480, 670);
    c.textAlign = 'left';

    // Title
    c.fillStyle = '#feca57';
    c.font = 'bold 36px Courier New';
    c.textAlign = 'center';
    c.fillText('ZOMBIE DEFENSE', 480, 40);
    c.fillStyle = '#e74c3c';
    c.font = 'bold 20px Courier New';
    c.fillText('V4', 480, 65);
    c.textAlign = 'left';
}

function drawMenuCharacter(c, x, y, bodyColor, skinColor, isPlayer) {
    // Body
    c.fillStyle = bodyColor;
    c.beginPath();
    c.roundRect(x - 14, y - 30, 28, 40, 5);
    c.fill();

    // Hoodie detail
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.fillRect(x - 10, y - 25, 20, 3);

    // Head
    c.fillStyle = skinColor;
    c.beginPath();
    c.arc(x, y - 38, 12, 0, Math.PI * 2);
    c.fill();

    // Eyes
    c.fillStyle = '#333';
    c.fillRect(x - 6, y - 40, 3, 3);
    c.fillRect(x + 3, y - 40, 3, 3);

    // Hair (for player)
    if (isPlayer) {
        c.fillStyle = '#1a1a1a';
        c.beginPath();
        c.arc(x, y - 42, 12, Math.PI, 0);
        c.fill();
    }

    // Legs
    c.fillStyle = '#333';
    c.fillRect(x - 10, y + 10, 8, 15);
    c.fillRect(x + 2, y + 10, 8, 15);

    // Gun (for player)
    if (isPlayer) {
        c.fillStyle = '#7f8c8d';
        c.fillRect(x + 14, y - 20, 18, 4);
    }

    // Arms
    c.fillStyle = bodyColor;
    c.fillRect(x - 18, y - 20, 6, 20);
    c.fillRect(x + 12, y - 20, 6, 20);
}

function drawMenuButton(c, x, y, w, h, text, color1, color2) {
    c.fillStyle = color1;
    c.beginPath(); c.roundRect(x, y, w, h, 8); c.fill();
    c.fillStyle = color2;
    c.beginPath(); c.roundRect(x + 2, y + 2, w - 4, h - 4, 6); c.fill();
    c.fillStyle = '#fff';
    c.font = 'bold 14px Courier New';
    c.textAlign = 'center';
    c.fillText(text, x + w / 2, y + h / 2 + 5);
    c.textAlign = 'left';
}

menuCanvas.addEventListener('click', function(e) {
    if (!gameState.inMenu) return;
    var r = menuCanvas.getBoundingClientRect();
    var mx = e.clientX - r.left;
    var my = e.clientY - r.top;

    // Play button
    if (mx > 380 && mx < 580 && my > 630 && my < 690) { startGameFromMenu(); return; }

    // Shop buttons
    if (mx > 80 && mx < 220) {
        if (my > 480 && my < 520) { openShop('armor'); return; }
        if (my > 530 && my < 570) { openShop('vehicles'); return; }
        if (my > 580 && my < 620) { openShop('weapons'); return; }
    }
    if (mx > 740 && mx < 880) {
        if (my > 480 && my < 520) { openShop('settings'); return; }
        if (my > 530 && my < 570) { openShop('shirts'); return; }
        if (my > 580 && my < 620) { openShop('upgrades'); return; }
    }
});

function menuLoop() {
    if (gameState.inMenu) {
        drawMenu();
        requestAnimationFrame(menuLoop);
    }
}

// ===== SHOP =====
function openShop(type) {
    if (type === 'settings') { document.getElementById('settings-panel').style.display = 'block'; return; }
    var panel = document.getElementById('shop-panel');
    document.getElementById('shop-title').textContent = type.toUpperCase() + ' SHOP';
    var data = shopData[type];
    var html = '';
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var ownedList = playerData['owned' + type.charAt(0).toUpperCase() + type.slice(1)] || [];
        var equipKey = 'equipped' + type.charAt(0).toUpperCase() + type.slice(1);
        var owned = ownedList.indexOf(item.id) >= 0;
        var equipped = playerData[equipKey] === item.id;

        html += '<div class="shop-item' + (owned ? ' owned' : '') + '">';
        html += '<div><div class="item-name">' + item.name + '</div><div class="item-desc">' + item.desc + '</div></div>';
        if (owned) {
            html += '<button class="shop-buy' + (equipped ? ' equipped' : '') + '" onclick="equipItem(\'' + type + '\',\'' + item.id + '\')">' + (equipped ? 'EQUIPPED' : 'EQUIP') + '</button>';
        } else {
            html += '<button class="shop-buy" onclick="buyItem(\'' + type + '\',\'' + item.id + '\',' + item.price + ')" ' + (playerData.gold < item.price ? 'disabled' : '') + '>$' + item.price + '</button>';
        }
        html += '</div>';
    }
    document.getElementById('shop-items').innerHTML = html;
    panel.style.display = 'block';
}

function buyItem(type, id, price) {
    if (playerData.gold < price) return;
    playerData.gold -= price;
    var key = 'owned' + type.charAt(0).toUpperCase() + type.slice(1);
    if (!playerData[key]) playerData[key] = [];
    playerData[key].push(id);
    openShop(type);
}

function equipItem(type, id) {
    var key = 'equipped' + type.charAt(0).toUpperCase() + type.slice(1);
    playerData[key] = id;
    openShop(type);
}

function closeShop() {
    document.getElementById('shop-panel').style.display = 'none';
    document.getElementById('settings-panel').style.display = 'none';
}

function toggleMusic() { /* no music */ }

// ===== MAP =====
function generateMap() {
    var m = []; buildings = [];
    for (var y = 0; y < MAP_H; y++) { m[y] = []; for (var x = 0; x < MAP_W; x++) { m[y][x] = (y === 0 || y === MAP_H - 1 || x === 0 || x === MAP_W - 1) ? WALL : ROAD; } }
    var numB = 8 + Math.floor(Math.random() * 5);
    for (var b = 0; b < numB; b++) {
        var bw = 2 + Math.floor(Math.random() * 3), bh = 2 + Math.floor(Math.random() * 2);
        var bx = 2 + Math.floor(Math.random() * (MAP_W - bw - 3)), by = 2 + Math.floor(Math.random() * (MAP_H - bh - 3));
        var ok = true;
        for (var i = 0; i < buildings.length; i++) { var ob = buildings[i]; if (bx < ob.x + ob.w + 2 && bx + bw + 2 > ob.x && by < ob.y + ob.h + 2 && by + bh + 2 > ob.y) { ok = false; break; } }
        if (!ok) continue;
        for (var dy = 0; dy < bh; dy++) for (var dx = 0; dx < bw; dx++) m[by + dy][bx + dx] = WALL;
        var ds = Math.floor(Math.random() * 4);
        var dx2, dy2;
        if (ds === 0) { dx2 = bx + Math.floor(bw / 2); dy2 = by - 1; }
        else if (ds === 1) { dx2 = bx + bw; dy2 = by + Math.floor(bh / 2); }
        else if (ds === 2) { dx2 = bx + Math.floor(bw / 2); dy2 = by + bh; }
        else { dx2 = bx - 1; dy2 = by + Math.floor(bh / 2); }
        if (dx2 > 0 && dx2 < MAP_W - 1 && dy2 > 0 && dy2 < MAP_H - 1) m[dy2][dx2] = DOOR;
        buildings.push({ x: bx, y: by, w: bw, h: bh });
    }
    for (var i = 0; i < 4; i++) { var gx = 2 + Math.floor(Math.random() * (MAP_W - 4)), gy = 2 + Math.floor(Math.random() * (MAP_H - 4)); if (m[gy][gx] === ROAD) m[gy][gx] = GRASS; }
    for (var i = 0; i < 4; i++) { var side = Math.floor(Math.random() * 4); if (side === 0) m[0][2 + Math.floor(Math.random() * (MAP_W - 4))] = ROAD; else if (side === 1) m[2 + Math.floor(Math.random() * (MAP_H - 4))][MAP_W - 1] = ROAD; else if (side === 2) m[MAP_H - 1][2 + Math.floor(Math.random() * (MAP_W - 4))] = ROAD; else m[2 + Math.floor(Math.random() * (MAP_H - 4))][0] = ROAD; }
    m[0][Math.floor(MAP_W / 2)] = ROAD; m[MAP_H - 1][Math.floor(MAP_W / 2)] = ROAD;
    m[Math.floor(MAP_H / 2)][0] = ROAD; m[Math.floor(MAP_H / 2)][MAP_W - 1] = ROAD;
    return m;
}

function isWalkableTile(tx, ty) { if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false; var t = map[ty][tx]; return t === ROAD || t === GRASS || t === DOOR; }

function findSafeSpawn(preferX, preferY) {
    var cx = preferX || Math.floor(MAP_W / 2), cy = preferY || Math.floor(MAP_H / 2);
    for (var r = 0; r < Math.max(MAP_W, MAP_H); r++) {
        for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
            var tx = cx + dx, ty = cy + dy;
            if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H && isWalkableTile(tx, ty)) return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
        }
    }
    return { x: Math.floor(MAP_W / 2) * TILE + TILE / 2, y: Math.floor(MAP_H / 2) * TILE + TILE / 2 };
}

function canWalk(x, y, size) {
    var h = size || 10;
    var pts = [{x:x-h,y:y-h},{x:x+h,y:y-h},{x:x-h,y:y+h},{x:x+h,y:y+h}];
    for (var i = 0; i < pts.length; i++) { var tx = Math.floor(pts[i].x / TILE), ty = Math.floor(pts[i].y / TILE); if (!isWalkableTile(tx, ty)) return false; }
    for (var i = 0; i < walls.length; i++) { if (dist({x:x,y:y}, walls[i]) < 18) return false; }
    for (var i = 0; i < gates.length; i++) { if (!gates[i].open && dist({x:x,y:y}, gates[i]) < 18) return false; }
    return true;
}

function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

// ===== INPUT =====
document.addEventListener('keydown', function(e) {
    keys[e.key.toLowerCase()] = true;
    if (gameState.inMenu) return;
    var k = e.key;
    if (k >= '1' && k <= '4') switchGun(parseInt(k) - 1);
    if (k.toLowerCase() === 'q') switchBuild(1);
    if (k.toLowerCase() === 'e') { if (gameState.buildMode === 2) switchBuild(0); else switchBuild(2); }
    if (k.toLowerCase() === 't') switchBuild(3);
    if (k.toLowerCase() === 'y') switchBuild(4);
    if (k.toLowerCase() === 'u') switchBuild(5);
    if (k.toLowerCase() === 'i') switchBuild(6);
    if (k.toLowerCase() === 'o') switchBuild(7);
    if (k.toLowerCase() === 'r') startReload();
    if (k.toLowerCase() === 'p' || k === 'Escape') togglePause();
    if (k.toLowerCase() === 'b') toggleBackpack();
    if (k.toLowerCase() === 'g') useGrenade();
    if (k.toLowerCase() === 'h') useMedkit();
    if (k.toLowerCase() === 'j') useAmmoPack();
    if (k.toLowerCase() === 'x') toggleCar();
});
document.addEventListener('keyup', function(e) { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', function(e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
canvas.addEventListener('mousedown', function(e) { e.preventDefault(); mouse.down = true; if (gameState.running && !gameState.gameOver && !gameState.paused && !gameState.inMenu) { if (gameState.buildMode > 0) placeBuildable(); else if (e.shiftKey) breakStructure(); else shoot(); } });
canvas.addEventListener('mouseup', function() { mouse.down = false; });
canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

function switchGun(idx) { if (idx < 0 || idx >= playerGuns.length || idx === gameState.currentGun || gameState.buildMode > 0) return; gameState.currentGun = idx; var g = getGun(); player.ammo = g.ammo; player.maxAmmo = g.ammo; player.reloading = false; player.reloadTimer = 0; document.querySelectorAll('.gun-slot').forEach(function(el, i) { el.className = i === idx ? 'gun-slot active' : 'gun-slot'; }); document.getElementById('reload-bar').style.display = 'none'; updateUI(); }
function switchBuild(idx) {
    if (idx >= 4 && idx <= 7) {
        var unlockIds = { 4: 'unlock_flame', 5: 'unlock_sniper', 6: 'unlock_tesla', 7: 'unlock_watch' };
        if (playerData.ownedUpgrades.indexOf(unlockIds[idx]) < 0) return;
    }
    gameState.buildMode = gameState.buildMode === idx ? 0 : idx;
    document.querySelectorAll('.build-slot').forEach(function(el) { var dk = el.getAttribute('data-key'); var active = false; if (dk === 'Q' && gameState.buildMode === 1) active = true; if (dk === 'E' && gameState.buildMode === 2) active = true; if (dk === 'T' && gameState.buildMode === 3) active = true; if (dk === 'Y' && gameState.buildMode === 4) active = true; if (dk === 'U' && gameState.buildMode === 5) active = true; if (dk === 'I' && gameState.buildMode === 6) active = true; if (dk === 'O' && gameState.buildMode === 7) active = true; el.className = active ? 'build-slot active' : 'build-slot'; });
}
function togglePause() { if (!gameState.running || gameState.gameOver) return; gameState.paused = !gameState.paused; }
function toggleBackpack() { if (!gameState.running || gameState.gameOver || gameState.paused) return; gameState.openBackpack = !gameState.openBackpack; document.getElementById('backpack-panel').style.display = gameState.openBackpack ? 'block' : 'none'; if (gameState.openBackpack) updateBackpackUI(); }
function updateBackpackUI() { var items = document.getElementById('backpack-items'); var html = ''; if (backpack.medkits > 0) html += '<div class="bp-item"><span class="bp-name">Medkit (H)</span><span class="bp-count">x' + backpack.medkits + '</span></div>'; if (backpack.ammoPacks > 0) html += '<div class="bp-item"><span class="bp-name">Ammo (J)</span><span class="bp-count">x' + backpack.ammoPacks + '</span></div>'; if (backpack.grenades > 0) html += '<div class="bp-item"><span class="bp-name">Grenade (G)</span><span class="bp-count">x' + backpack.grenades + '</span></div>'; if (!html) html = '<div style="color:#888;text-align:center;padding:15px">Empty</div>'; items.innerHTML = html; }
function useMedkit() { if (backpack.medkits <= 0 || player.health >= player.maxHealth) return; backpack.medkits--; player.health = Math.min(player.health + 40, player.maxHealth); updateUI(); }
function useAmmoPack() { if (backpack.ammoPacks <= 0) return; backpack.ammoPacks--; player.ammo = getGun().ammo; player.reloading = false; player.reloadTimer = 0; document.getElementById('reload-bar').style.display = 'none'; updateUI(); }
function useGrenade() { if (backpack.grenades <= 0) return; backpack.grenades--; var a = Math.atan2(mouse.y - player.y, mouse.x - player.x); addExplosion(player.x + Math.cos(a) * 100, player.y + Math.sin(a) * 100, 120, 100); updateUI(); }
function breakStructure() { var mx = mouse.x, my = mouse.y; for (var i = walls.length - 1; i >= 0; i--) { if (dist({x:mx,y:my}, walls[i]) < 25 && dist(player, walls[i]) < 80) { gameState.money += 10; walls.splice(i, 1); updateUI(); return; } } for (var i = gates.length - 1; i >= 0; i--) { if (dist({x:mx,y:my}, gates[i]) < 25 && dist(player, gates[i]) < 80) { gameState.money += 15; gates.splice(i, 1); updateUI(); return; } } }

function shoot() {
    if (player.reloading || gameState.fireTimer > 0) return;
    var g = getGun();
    if (player.ammo <= 0) { startReload(); return; }
    player.ammo--; gameState.fireTimer = g.fireRate; updateUI();
    var baseAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    for (var i = 0; i < g.bullets; i++) { var a = baseAngle + (Math.random() - 0.5) * g.spread; bullets.push({ x: player.x + Math.cos(a) * 16, y: player.y + Math.sin(a) * 16, vx: Math.cos(a) * g.bulletSpeed, vy: Math.sin(a) * g.bulletSpeed, damage: g.damage, life: 80 }); }
    if (mouse.down && g.fireRate < 12) setTimeout(function() { if (mouse.down && gameState.running && !gameState.paused) shoot(); }, g.fireRate * 16);
}

function startReload() { if (player.reloading) return; var g = getGun(); if (player.ammo === g.ammo) return; player.reloading = true; player.reloadTimer = g.reloadTime; document.getElementById('reload-bar').style.display = 'block'; }

function placeBuildable() {
    var tx = Math.floor(mouse.x / TILE), ty = Math.floor(mouse.y / TILE);
    if (tx < 1 || tx >= MAP_W - 1 || ty < 1 || ty >= MAP_H - 1) return;
    if (!isWalkableTile(tx, ty)) return;
    var cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
    if (dist(player, {x:cx,y:cy}) > 120) return;
    var bm = gameState.buildMode;
    var hasStone = playerData.ownedUpgrades.indexOf('stone_wall') >= 0;
    var wallHp = hasStone ? 400 : 150, gateHp = hasStone ? 300 : 100;
    if (bm === 1) { if (gameState.money < 20) return; for (var i = 0; i < walls.length; i++) if (walls[i].tx === tx && walls[i].ty === ty) return; gameState.money -= 20; walls.push({ tx:tx, ty:ty, x:cx, y:cy, health:wallHp, maxHealth:wallHp, stone: hasStone }); }
    else if (bm === 2) { if (gameState.money < 30) return; for (var i = 0; i < gates.length; i++) if (gates[i].tx === tx && gates[i].ty === ty) return; gameState.money -= 30; gates.push({ tx:tx, ty:ty, x:cx, y:cy, health:gateHp, maxHealth:gateHp, open:false, stone: hasStone }); }
    else if (bm >= 3 && bm <= 7) { var ttypes = ['turret','flame','sniper','tesla','watch']; var tt = towerTypes[ttypes[bm - 3]]; if (gameState.money < tt.cost) return; for (var i = 0; i < towers.length; i++) if (towers[i].tx === tx && towers[i].ty === ty) return; gameState.money -= tt.cost; towers.push({ tx:tx, ty:ty, x:cx, y:cy, type:ttypes[bm-3], range:tt.range, damage:tt.damage, fireRate:tt.fireRate, fireTimer:0, angle:0, health:tt.health, maxHealth:tt.health }); }
    updateUI();
}

function toggleCar() { if (!gameState.running || gameState.gameOver || gameState.paused) return; if (car.occupied) { car.occupied = false; player.inCar = false; player.x = car.x + 30; player.y = car.y; } else if (car.active && dist(player, car) < 50) { car.occupied = true; player.inCar = true; } }

function getSpawnPoint() { var spawns = []; for (var x = 0; x < MAP_W; x++) { if (map[0][x] === ROAD) spawns.push({x:x*TILE+20, y:20}); if (map[MAP_H-1][x] === ROAD) spawns.push({x:x*TILE+20, y:(MAP_H-1)*TILE+20}); } for (var y = 1; y < MAP_H-1; y++) { if (map[y][0] === ROAD) spawns.push({x:20, y:y*TILE+20}); if (map[y][MAP_W-1] === ROAD) spawns.push({x:(MAP_W-1)*TILE+20, y:y*TILE+20}); } if (!spawns.length) spawns.push({x:12*TILE+20, y:20}); return spawns[Math.floor(Math.random() * spawns.length)]; }

function spawnZombie() { var s = getSpawnPoint(); var wd = waveData[gameState.wave - 1]; var typeName = wd.types[Math.floor(Math.random() * wd.types.length)]; var zt = zombieTypes[typeName]; var count = typeName === 'swarm' ? 3 : 1; for (var i = 0; i < count; i++) { zombies.push({ x: s.x + (Math.random() - 0.5) * 20, y: s.y + (Math.random() - 0.5) * 20, type: typeName, size: zt.size, speed: wd.speed * zt.speedMul * (0.85 + Math.random() * 0.3), health: wd.hp * zt.hpMul, maxHealth: wd.hp * zt.hpMul, damage: zt.damage, reward: zt.reward, attackTimer: 0, ranged: zt.ranged || false, range: zt.range || 0, buff: zt.buff || false, smashes: zt.smashes || false, leaps: zt.leaps || false, leapCooldown: 0, spitCooldown: 0 }); } }

function startWave() {
    var wd = waveData[gameState.wave - 1];
    gameState.zombiesInWave = wd.count; gameState.zombiesKilledInWave = 0; gameState.spawnQueue = wd.count; gameState.spawnTimer = 0; gameState.waveActive = true;
    document.getElementById('wave-num').textContent = gameState.wave;
    document.getElementById('map-name').textContent = mapNames[(gameState.wave - 1) % mapNames.length];
    spawnPickups();
    if (gameState.wave === 4 && carls.length === 0) {
        var carlHp = playerData.ownedUpgrades.indexOf('carl_upgrade') >= 0 ? 400 : 300;
        var ptx = Math.floor(player.x / TILE), pty = Math.floor(player.y / TILE);
        for (var i = 0; i < 2; i++) {
            var sp = findSafeSpawn(ptx + (i === 0 ? -2 : 2), pty + 1);
            carls.push({ x: sp.x, y: sp.y, health: carlHp, maxHealth: carlHp, angle: 0, fireTimer: 0, healTimer: 0 });
        }
        document.getElementById('carl-status').style.display = 'block';
    }
}

function spawnPickups() { pickups = []; var spots = []; for (var y = 1; y < MAP_H - 1; y++) for (var x = 1; x < MAP_W - 1; x++) if (map[y][x] === ROAD || map[y][x] === GRASS) spots.push({x:x, y:y}); for (var i = spots.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = spots[i]; spots[i] = spots[j]; spots[j] = tmp; } for (var i = 0; i < 8 && i < spots.length; i++) { var s = spots[i]; pickups.push({ x: s.x*TILE+20, y: s.y*TILE+20, type: ['health','ammo','money'][Math.floor(Math.random()*3)] }); } }

function addExplosion(x, y, radius, damage) { explosions.push({ x:x, y:y, radius:radius, maxRadius:radius, life:20 }); for (var i = walls.length - 1; i >= 0; i--) { if (dist({x:x,y:y}, walls[i]) < radius + 20) { walls[i].health -= damage; if (walls[i].health <= 0) walls.splice(i, 1); } } for (var i = towers.length - 1; i >= 0; i--) { if (dist({x:x,y:y}, towers[i]) < radius + 20) { towers[i].health -= damage; if (towers[i].health <= 0) towers.splice(i, 1); } } if (dist({x:x,y:y}, player) < radius + 10 && !player.inCar) { player.health -= Math.floor(damage * 0.4); updateUI(); if (player.health <= 0) endGame(false); } }

// ===== UPDATE =====
function update() {
    if (!gameState.running || gameState.gameOver || gameState.paused || gameState.inMenu) return;
    if (gameState.fireTimer > 0) gameState.fireTimer--;
    if (player.reloading) { player.reloadTimer--; var g = getGun(); document.getElementById('reload-fill').style.width = ((1 - player.reloadTimer / g.reloadTime) * 100) + '%'; if (player.reloadTimer <= 0) { player.ammo = g.ammo; player.maxAmmo = g.ammo; player.reloading = false; document.getElementById('reload-bar').style.display = 'none'; updateUI(); } }

    if (!player.inCar) {
        var dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= PLAYER_SPEED;
        if (keys['s'] || keys['arrowdown']) dy += PLAYER_SPEED;
        if (keys['a'] || keys['arrowleft']) dx -= PLAYER_SPEED;
        if (keys['d'] || keys['arrowright']) dx += PLAYER_SPEED;
        if (dx !== 0 || dy !== 0) { var len = Math.sqrt(dx * dx + dy * dy); dx = dx / len * PLAYER_SPEED; dy = dy / len * PLAYER_SPEED; if (canWalk(player.x + dx, player.y, player.size)) player.x += dx; if (canWalk(player.x, player.y + dy, player.size)) player.y += dy; }
        player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    } else {
        car.x = player.x; car.y = player.y; car.angle = Math.atan2(mouse.y - car.y, mouse.x - car.x);
        if (keys['a'] || keys['arrowleft']) car.angle -= 0.06;
        if (keys['d'] || keys['arrowright']) car.angle += 0.06;
        if (keys['w'] || keys['arrowup']) { var nx = car.x + Math.cos(car.angle) * car.speed, ny = car.y + Math.sin(car.angle) * car.speed; if (canWalk(nx, ny, 18)) { car.x = nx; car.y = ny; } }
        if (keys['s'] || keys['arrowdown']) { var nx = car.x - Math.cos(car.angle) * car.speed * 0.5, ny = car.y - Math.sin(car.angle) * car.speed * 0.5; if (canWalk(nx, ny, 18)) { car.x = nx; car.y = ny; } }
        player.x = car.x; player.y = car.y;
    }

    for (var i = 0; i < gates.length; i++) { if (dist(player, gates[i]) < 30 && !gates[i].open) gates[i].open = true; else if (dist(player, gates[i]) > 50) gates[i].open = false; }
    document.getElementById('car-hint').style.display = (!car.occupied && car.active && dist(player, car) < 50) ? 'block' : 'none';

    // Bullets
    for (var i = bullets.length - 1; i >= 0; i--) {
        var b = bullets[i]; b.x += b.vx; b.y += b.vy; b.life--;
        var tx = Math.floor(b.x / TILE), ty = Math.floor(b.y / TILE);
        if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H || map[ty][tx] === WALL || b.life <= 0) { bullets.splice(i, 1); continue; }
        for (var j = 0; j < walls.length; j++) { if (dist(b, walls[j]) < 15) { bullets.splice(i, 1); break; } }
        for (var j = zombies.length - 1; j >= 0; j--) { if (dist(b, zombies[j]) < zombies[j].size + 5) { zombies[j].health -= b.damage; if (zombies[j].health <= 0) { if (zombies[j].type === 'exploder') addExplosion(zombies[j].x, zombies[j].y, 80, 60); gameState.money += zombies[j].reward; zombies.splice(j, 1); gameState.kills++; gameState.zombiesKilledInWave++; updateUI(); } bullets.splice(i, 1); break; } }
    }

    // Towers
    for (var i = 0; i < towers.length; i++) {
        var t = towers[i], tt = towerTypes[t.type];
        if (t.fireTimer > 0) { t.fireTimer--; continue; }
        var targets = [];
        for (var j = 0; j < zombies.length; j++) { var d = dist(t, zombies[j]); if (d < t.range) targets.push({ z: zombies[j], d: d }); }
        targets.sort(function(a, b) { return a.d - b.d; });
        if (targets.length > 0) {
            var target = targets[0].z; t.angle = Math.atan2(target.y - t.y, target.x - t.x); t.fireTimer = t.fireRate;
            if (t.type === 'flame') { for (var j = zombies.length - 1; j >= 0; j--) { if (dist(t, zombies[j]) < (tt.aoe || 50) + t.range * 0.3) { zombies[j].health -= tt.damage; if (zombies[j].health <= 0) { gameState.money += zombies[j].reward; zombies.splice(j, 1); gameState.kills++; gameState.zombiesKilledInWave++; } } } }
            else if (t.type === 'tesla') { var chain = [target]; for (var c = 1; c < (tt.chain || 3); c++) { var last = chain[chain.length - 1], nearest = null, nd = 100; for (var j = 0; j < zombies.length; j++) { if (chain.indexOf(zombies[j]) >= 0) continue; var d2 = dist(last, zombies[j]); if (d2 < nd) { nd = d2; nearest = zombies[j]; } } if (nearest && nd < 100) chain.push(nearest); else break; } for (var c = 0; c < chain.length; c++) { chain[c].health -= tt.damage; if (chain[c].health <= 0) { gameState.money += chain[c].reward; var idx = zombies.indexOf(chain[c]); if (idx >= 0) zombies.splice(idx, 1); gameState.kills++; gameState.zombiesKilledInWave++; } } }
            else { bullets.push({ x: t.x, y: t.y, vx: Math.cos(t.angle) * (t.type === 'sniper' ? 16 : 10), vy: Math.sin(t.angle) * (t.type === 'sniper' ? 16 : 10), damage: tt.damage, life: t.type === 'sniper' ? 120 : 60 }); }
        }
    }

    // Zombies
    for (var i = zombies.length - 1; i >= 0; i--) {
        var z = zombies[i], target = car.occupied ? car : player;
        if (z.smashes) { for (var j = walls.length - 1; j >= 0; j--) { if (dist(z, walls[j]) < 30) { z.attackTimer++; if (z.attackTimer >= 20) { walls[j].health -= z.damage; z.attackTimer = 0; if (walls[j].health <= 0) walls.splice(j, 1); } break; } } }
        if (z.leaps && z.leapCooldown <= 0) { for (var j = 0; j < walls.length; j++) { if (dist(z, walls[j]) < 40) { var la = Math.atan2(target.y - z.y, target.x - z.x); z.x += Math.cos(la) * 80; z.y += Math.sin(la) * 80; z.leapCooldown = 120; break; } } }
        if (z.leapCooldown > 0) z.leapCooldown--;
        if (z.buff) { for (var j = 0; j < zombies.length; j++) { if (i !== j && dist(z, zombies[j]) < 100) zombies[j].speed = zombieTypes[zombies[j].type].speedMul * waveData[gameState.wave-1].speed * 1.3; } }
        if (z.ranged) { var dToT = dist(z, target); if (dToT < z.range && dToT > 40) { z.spitCooldown--; if (z.spitCooldown <= 0) { var sa = Math.atan2(target.y - z.y, target.x - z.x); acidBalls.push({ x: z.x, y: z.y, vx: Math.cos(sa)*5, vy: Math.sin(sa)*5, life: 60 }); z.spitCooldown = 80; } } }

        var angle = Math.atan2(target.y - z.y, target.x - z.x);
        var nx = z.x + Math.cos(angle) * z.speed, ny = z.y + Math.sin(angle) * z.speed;
        var moved = false;
        if (canWalk(nx, ny, z.size)) { z.x = nx; z.y = ny; moved = true; }
        if (!moved && canWalk(nx, z.y, z.size)) { z.x = nx; moved = true; }
        if (!moved && canWalk(z.x, ny, z.size)) { z.y = ny; moved = true; }
        if (!moved) { var ea = angle + (Math.random() > 0.5 ? 0.5 : -0.5); var ex = z.x + Math.cos(ea) * z.speed, ey = z.y + Math.sin(ea) * z.speed; if (canWalk(ex, ey, z.size)) { z.x = ex; z.y = ey; } }

        if (car.active && dist(z, car) < 25) {
            if (car.occupied) { z.health -= car.damage; }
            car.health -= z.damage * 0.5;
            if (z.health <= 0) { if (z.type === 'exploder') addExplosion(z.x, z.y, 80, 60); gameState.money += z.reward; zombies.splice(i, 1); gameState.kills++; gameState.zombiesKilledInWave++; updateUI(); }
            if (car.health <= 0) { car.health = 0; car.active = false; if (car.occupied) { car.occupied = false; player.inCar = false; player.x = car.x + 30; player.y = car.y; } addExplosion(car.x, car.y, 100, 50); }
            updateUI(); continue;
        }
        if (dist(z, player) < z.size + player.size) { z.attackTimer++; if (z.attackTimer >= 30) { var dmg = player.inCar ? Math.floor(z.damage * 0.3) : z.damage; if (player.armor > 0) { var ab = Math.floor(dmg * 0.5); player.armor -= ab; dmg -= ab; if (player.armor < 0) player.armor = 0; } player.health -= dmg; z.attackTimer = 0; updateUI(); if (player.health <= 0) { endGame(false); return; } } } else { z.attackTimer = 0; }
    }

    // Carls heal
    for (var c = 0; c < carls.length; c++) {
        var carl = carls[c]; if (carl.health <= 0) continue;
        carl.healTimer++; if (carl.healTimer >= 120 && carl.health < carl.maxHealth) { carl.health = Math.min(carl.health + 5, carl.maxHealth); carl.healTimer = 0; }
        var nearestZ = null, nzDist = 250;
        for (var j = 0; j < zombies.length; j++) { var d = dist(carl, zombies[j]); if (d < nzDist) { nzDist = d; nearestZ = zombies[j]; } }
        if (nearestZ) { carl.angle = Math.atan2(nearestZ.y - carl.y, nearestZ.x - carl.x); carl.fireTimer--; if (carl.fireTimer <= 0) { carl.fireTimer = 25; bullets.push({ x: carl.x + Math.cos(carl.angle) * 12, y: carl.y + Math.sin(carl.angle) * 12, vx: Math.cos(carl.angle) * 10, vy: Math.sin(carl.angle) * 10, damage: 20, life: 60 }); } if (nzDist > 80) { var ca = carl.angle, cs = 1.5; var cnx = carl.x + Math.cos(ca) * cs, cny = carl.y + Math.sin(ca) * cs; if (canWalk(cnx, cny, 10)) { carl.x = cnx; carl.y = cny; } else if (canWalk(cnx, carl.y, 10)) { carl.x = cnx; } else if (canWalk(carl.x, cny, 10)) { carl.y = cny; } } }
        else { if (dist(carl, player) > 100) { var pa = Math.atan2(player.y - carl.y, player.x - carl.x); var cnx = carl.x + Math.cos(pa) * 1.2, cny = carl.y + Math.sin(pa) * 1.2; if (canWalk(cnx, cny, 10)) { carl.x = cnx; carl.y = cny; } else if (canWalk(cnx, carl.y, 10)) { carl.x = cnx; } else if (canWalk(carl.x, cny, 10)) { carl.y = cny; } } }
        for (var j = zombies.length - 1; j >= 0; j--) { if (dist(carl, zombies[j]) < 20) { carl.health -= zombies[j].damage * 0.5; if (carl.health <= 0) carl.health = 0; updateUI(); } }
    }
    carls = carls.filter(function(c) { return c.health > 0; });
    if (carls.length === 0) document.getElementById('carl-status').style.display = 'none';

    for (var i = explosions.length - 1; i >= 0; i--) { explosions[i].life--; explosions[i].radius += 3; if (explosions[i].life <= 0) explosions.splice(i, 1); }
    for (var i = pickups.length - 1; i >= 0; i--) { if (dist(player, pickups[i]) < 20) { if (pickups[i].type === 'health') player.health = Math.min(player.health + 25, player.maxHealth); else if (pickups[i].type === 'ammo') player.ammo = Math.min(player.ammo + 10, getGun().ammo); else gameState.money += 15; pickups.splice(i, 1); updateUI(); } }

    // Acid
    for (var i = acidBalls.length - 1; i >= 0; i--) { var a = acidBalls[i]; a.x += a.vx; a.y += a.vy; a.life--; if (a.life <= 0) { acidBalls.splice(i, 1); continue; } if (dist(a, player) < 15 && !player.inCar) { player.health -= 12; acidBalls.splice(i, 1); updateUI(); if (player.health <= 0) { endGame(false); return; } } }

    if (gameState.waveActive) { if (gameState.spawnQueue > 0) { gameState.spawnTimer++; if (gameState.spawnTimer >= 15) { gameState.spawnTimer = 0; gameState.spawnQueue--; spawnZombie(); } } if (gameState.zombiesKilledInWave >= gameState.zombiesInWave && zombies.length === 0 && gameState.spawnQueue <= 0) { gameState.waveActive = false; gameState.waveDelay = 0; } }
    else if (!gameState.gameOver) { gameState.waveDelay++; if (gameState.waveDelay >= 180) { if (gameState.wave >= gameState.maxWaves) endGame(true); else { gameState.wave++; startWave(); } } }
}

// ===== DRAW =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var y = 0; y < MAP_H; y++) for (var x = 0; x < MAP_W; x++) { var tile = map[y][x]; ctx.fillStyle = tile === ROAD ? '#4a4a4a' : tile === WALL ? '#1a1a2e' : tile === DOOR ? '#8B4513' : '#1a472a'; ctx.fillRect(x * TILE, y * TILE, TILE, TILE); if (tile === WALL) { ctx.fillStyle = '#16213e'; ctx.fillRect(x*TILE+3,y*TILE+3,TILE-6,TILE-6); } if (tile === GRASS) { ctx.fillStyle = '#216a3a'; ctx.fillRect(x*TILE+8,y*TILE+8,3,3); } }

    for (var i = 0; i < walls.length; i++) { var w = walls[i]; ctx.fillStyle = w.stone ? '#666' : '#8B6914'; ctx.fillRect(w.x-16,w.y-16,32,32); ctx.fillStyle = w.stone ? '#777' : '#A07818'; ctx.fillRect(w.x-13,w.y-13,26,26); if (w.health < w.maxHealth) { ctx.fillStyle = '#222'; ctx.fillRect(w.x-12,w.y-22,24,4); ctx.fillStyle = w.health/w.maxHealth > 0.5 ? '#2ecc71' : '#e74c3c'; ctx.fillRect(w.x-12,w.y-22,24*(w.health/w.maxHealth),4); } }
    for (var i = 0; i < gates.length; i++) { var g2 = gates[i]; ctx.fillStyle = g2.stone ? '#555' : (g2.open ? '#5D4E1A' : '#8B7D3C'); ctx.fillRect(g2.x-16,g2.y-16,32,32); ctx.strokeStyle = g2.stone ? '#888' : '#FFD700'; ctx.lineWidth = 1; ctx.strokeRect(g2.x-16,g2.y-16,32,32); }
    for (var i = 0; i < towers.length; i++) { var t = towers[i], tt = towerTypes[t.type]; ctx.fillStyle = '#444'; ctx.fillRect(t.x-14,t.y-14,28,28); ctx.fillStyle = '#666'; ctx.fillRect(t.x-10,t.y-10,20,20); ctx.fillStyle = tt.color; ctx.beginPath(); ctx.arc(t.x,t.y,8,0,Math.PI*2); ctx.fill(); ctx.save(); ctx.translate(t.x,t.y); ctx.rotate(t.angle); ctx.fillStyle = tt.color; ctx.globalAlpha = 0.7; ctx.fillRect(0,-3,16,6); ctx.globalAlpha = 1; ctx.restore(); }

    if (gameState.buildMode > 0) { var ptx = Math.floor(mouse.x / TILE), pty = Math.floor(mouse.y / TILE); var canP = isWalkableTile(ptx,pty) && dist(player,{x:ptx*TILE+20,y:pty*TILE+20}) < 120; ctx.globalAlpha = 0.3; ctx.fillStyle = canP ? '#2ecc71' : '#e74c3c'; ctx.fillRect(ptx*TILE+4,pty*TILE+4,TILE-8,TILE-8); ctx.globalAlpha = 1; }

    for (var i = 0; i < pickups.length; i++) { var p = pickups[i], bob = Math.sin(Date.now()/300+i)*3; if (p.type === 'health') { ctx.fillStyle = '#e74c3c'; ctx.fillRect(p.x-7,p.y-7+bob,14,14); ctx.fillStyle = 'white'; ctx.fillRect(p.x-1,p.y-4+bob,2,8); ctx.fillRect(p.x-4,p.y-1+bob,8,2); } else if (p.type === 'ammo') { ctx.fillStyle = '#f39c12'; ctx.fillRect(p.x-7,p.y-7+bob,14,14); } else { ctx.fillStyle = '#2ecc71'; ctx.fillRect(p.x-7,p.y-7+bob,14,14); } }

    if (car.active) { ctx.save(); ctx.translate(car.x,car.y); ctx.rotate(car.angle); if (car.isTank) { ctx.fillStyle = '#555'; ctx.fillRect(-22,-14,44,28); ctx.fillStyle = '#666'; ctx.fillRect(-18,-12,36,24); ctx.fillStyle = '#f1c40f'; ctx.fillRect(16,-4,10,8); } else { ctx.fillStyle = '#c0392b'; ctx.fillRect(-18,-10,36,20); ctx.fillStyle = '#e74c3c'; ctx.fillRect(-14,-8,28,16); } ctx.restore(); if (car.health < car.maxHealth) { ctx.fillStyle = '#222'; ctx.fillRect(car.x-15,car.y-24,30,4); ctx.fillStyle = car.health/car.maxHealth > 0.5 ? '#2ecc71' : car.health/car.maxHealth > 0.25 ? '#f39c12' : '#e74c3c'; ctx.fillRect(car.x-15,car.y-24,30*(car.health/car.maxHealth),4); } }

    for (var i = 0; i < zombies.length; i++) { var z = zombies[i], zt = zombieTypes[z.type]; ctx.fillStyle = zt.color; ctx.beginPath(); ctx.arc(z.x,z.y,z.size,0,Math.PI*2); ctx.fill(); ctx.fillStyle = zt.inner; ctx.beginPath(); ctx.arc(z.x,z.y,z.size-3,0,Math.PI*2); ctx.fill(); ctx.fillStyle = '#e74c3c'; ctx.fillRect(z.x-5,z.y-4,3,3); ctx.fillRect(z.x+2,z.y-4,3,3); if (z.health < z.maxHealth) { ctx.fillStyle = '#222'; ctx.fillRect(z.x-12,z.y-z.size-8,24,4); ctx.fillStyle = '#e74c3c'; ctx.fillRect(z.x-12,z.y-z.size-8,24*(z.health/z.maxHealth),4); } }

    for (var i = 0; i < acidBalls.length; i++) { ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.arc(acidBalls[i].x,acidBalls[i].y,5,0,Math.PI*2); ctx.fill(); }
    for (var i = 0; i < explosions.length; i++) { var ex = explosions[i], alpha = ex.life/20; ctx.fillStyle = 'rgba(255,100,0,'+(alpha*0.5)+')'; ctx.beginPath(); ctx.arc(ex.x,ex.y,ex.radius,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle = '#f1c40f'; for (var i = 0; i < bullets.length; i++) { ctx.beginPath(); ctx.arc(bullets[i].x,bullets[i].y,3,0,Math.PI*2); ctx.fill(); }

    for (var c = 0; c < carls.length; c++) { var carl = carls[c]; ctx.save(); ctx.translate(carl.x,carl.y); ctx.rotate(carl.angle); ctx.fillStyle = '#2980b9'; ctx.fillRect(-7,-7,14,14); ctx.fillStyle = '#7f8c8d'; ctx.fillRect(5,-2,12,4); ctx.restore(); ctx.fillStyle = '#f5cba7'; ctx.beginPath(); ctx.arc(carl.x,carl.y,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(carl.x-10,carl.y-18,20,3); ctx.fillStyle = '#3498db'; ctx.fillRect(carl.x-10,carl.y-18,20*(carl.health/carl.maxHealth),3); }

    if (!player.inCar) { ctx.save(); ctx.translate(player.x,player.y); ctx.rotate(player.angle); ctx.fillStyle = playerData.equippedShirt === 'white_shirt' ? '#ecf0f1' : '#1a1a1a'; ctx.fillRect(-8,-8,16,16); ctx.fillStyle = '#7f8c8d'; ctx.fillRect(6,-2,14,4); ctx.restore(); ctx.fillStyle = '#f5cba7'; ctx.beginPath(); ctx.arc(player.x,player.y,7,0,Math.PI*2); ctx.fill(); }

    if (gameState.waveDelay > 0 && !gameState.gameOver && !gameState.waveActive) { var nw = (gameState.wave === 1) ? 1 : gameState.wave + 1; ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(canvas.width/2-160,canvas.height/2-40,320,80); ctx.fillStyle = '#feca57'; ctx.font = 'bold 24px Courier New'; ctx.textAlign = 'center'; ctx.fillText('Wave '+nw, canvas.width/2, canvas.height/2+5); ctx.textAlign = 'left'; }
    if (gameState.paused && !gameState.gameOver) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#feca57'; ctx.font = 'bold 48px Courier New'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', canvas.width/2, canvas.height/2); ctx.textAlign = 'left'; }
}

function updateUI() {
    var hp = (player.health / player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = hp + '%';
    document.getElementById('health-text').textContent = Math.max(0, player.health);
    if (player.armor > 0) { document.getElementById('armor-bar').style.display = 'block'; document.getElementById('armor-fill').style.width = (player.armor / 100 * 100) + '%'; document.getElementById('armor-text').textContent = player.armor; } else document.getElementById('armor-bar').style.display = 'none';
    document.getElementById('ammo-count').textContent = player.ammo;
    document.getElementById('ammo-max').textContent = getGun().ammo;
    document.getElementById('kill-count').textContent = gameState.kills;
    document.getElementById('money-count').textContent = gameState.money;
    var tc = document.getElementById('tower-count'); if (tc) tc.textContent = towers.length;
    var wc = document.getElementById('wall-count'); if (wc) wc.textContent = walls.length + gates.length;
    for (var c = 0; c < 2; c++) { var el = document.getElementById('carl' + (c+1) + '-hp'); if (el) el.textContent = c < carls.length ? carls[c].health : '--'; }
    var chEl = document.getElementById('car-health');
    if (car.active && car.health < car.maxHealth) {
        chEl.style.display = 'block';
        document.getElementById('car-health-fill').style.width = (car.health / car.maxHealth * 100) + '%';
        document.getElementById('car-health-fill').style.background = car.health / car.maxHealth > 0.5 ? '#2ecc71' : car.health / car.maxHealth > 0.25 ? '#f39c12' : '#e74c3c';
        document.getElementById('car-health-text').textContent = 'Car: ' + Math.ceil(car.health) + '/' + car.maxHealth;
    } else { chEl.style.display = 'none'; }
}

function endGame(won) {
    gameState.gameOver = true;
    if (won) { playerData.gold += 200; playerData.totalWins++; } else { playerData.gold += 30; playerData.totalLosses++; }
    var msg = document.getElementById('message');
    if (won) { msg.textContent = 'YOU WIN!\n+200 Gold\nKills: ' + gameState.kills; msg.className = 'win'; }
    else { msg.textContent = 'GAME OVER\nWave ' + gameState.wave + '\n+30 Gold\nKills: ' + gameState.kills; msg.className = 'lose'; }
    setTimeout(function() {
        msg.style.display = 'none'; msg.className = '';
        document.getElementById('game-ui').style.display = 'none';
        canvas.style.display = 'none';
        menuCanvas.style.display = 'block';
        gameState.inMenu = true; gameState.running = false;
        initMenu(); menuLoop();
    }, 3000);
}

function startGameFromMenu() {
    menuCanvas.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('game-ui').style.display = 'block';
    gameState.inMenu = false;

    var armorHp = 0;
    if (playerData.equippedArmor === 'wooden') armorHp = 20;
    else if (playerData.equippedArmor === 'swat') armorHp = 50;
    else if (playerData.equippedArmor === 'military') armorHp = 100;

    var vs = { car: { speed: CAR_SPEED, health: 300, damage: CAR_DAMAGE, isTank: false }, jeep: { speed: CAR_SPEED*1.3, health: 350, damage: CAR_DAMAGE, isTank: false }, humvee: { speed: CAR_SPEED*0.9, health: 500, damage: CAR_DAMAGE*1.2, isTank: false }, tank: { speed: CAR_SPEED*0.4, health: 800, damage: CAR_DAMAGE*2, isTank: true }, ifv: { speed: CAR_SPEED*1.2, health: 600, damage: CAR_DAMAGE*1.5, isTank: false }, howitzer: { speed: CAR_SPEED*0.5, health: 700, damage: CAR_DAMAGE*3, isTank: true }, rocket_truck: { speed: CAR_SPEED*0.7, health: 500, damage: CAR_DAMAGE*4, isTank: false } }[playerData.equippedVehicle] || { speed: CAR_SPEED, health: 300, damage: CAR_DAMAGE, isTank: false };

    var ws = weaponSets[playerData.equippedWeapon] || weaponSets.pistol;
    playerGuns = ws.guns.slice();

    gameState.running = true; gameState.wave = 1; gameState.kills = 0; gameState.money = 0;
    gameState.gameOver = false; gameState.won = false; gameState.currentGun = 0; gameState.fireTimer = 0;
    gameState.waveActive = false; gameState.waveDelay = 60; gameState.buildMode = 0; gameState.paused = false;

    player.health = 100 + armorHp; player.maxHealth = 100 + armorHp; player.armor = armorHp;
    player.ammo = getGun().ammo; player.maxAmmo = getGun().ammo; player.inCar = false; player.reloading = false;
    car.active = true; car.occupied = false;
    car.speed = vs.speed; car.health = vs.health; car.maxHealth = vs.health; car.damage = vs.damage; car.isTank = vs.isTank;

    carls = []; backpack = { medkits: 0, ammoPacks: 0, grenades: ws.grenades };
    bullets = []; zombies = []; pickups = []; towers = []; walls = []; gates = []; explosions = []; acidBalls = [];
    map = generateMap();

    var spawnPos = findSafeSpawn(12, 9);
    player.x = spawnPos.x; player.y = spawnPos.y;
    var carSpawn = findSafeSpawn(5, 5);
    car.x = carSpawn.x; car.y = carSpawn.y;

    var gunHtml = '';
    for (var gi = 0; gi < playerGuns.length; gi++) {
        var gg = guns[playerGuns[gi]];
        gunHtml += '<span class="gun-slot' + (gi === 0 ? ' active' : '') + '">' + (gi + 1) + ':' + gg.name + '</span>';
    }
    document.getElementById('gun-row').innerHTML = gunHtml;
    document.querySelectorAll('.build-slot').forEach(function(el) {
        var dk = el.getAttribute('data-key');
        var locked = (dk === 'Y' && playerData.ownedUpgrades.indexOf('unlock_flame') < 0) ||
                     (dk === 'U' && playerData.ownedUpgrades.indexOf('unlock_sniper') < 0) ||
                     (dk === 'I' && playerData.ownedUpgrades.indexOf('unlock_tesla') < 0) ||
                     (dk === 'O' && playerData.ownedUpgrades.indexOf('unlock_watch') < 0);
        el.className = locked ? 'build-slot locked' : 'build-slot';
    });
    document.getElementById('reload-bar').style.display = 'none';
    document.getElementById('backpack-panel').style.display = 'none';
    document.getElementById('carl-status').style.display = 'none';
    document.getElementById('map-name').textContent = mapNames[0];
    updateUI();
    gameLoop();
}

function gameLoop() { update(); draw(); if (!gameState.gameOver) requestAnimationFrame(gameLoop); else draw(); }

// INIT
initMenu();
menuLoop();
