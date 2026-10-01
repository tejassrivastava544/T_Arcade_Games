var canvas = document.getElementById("surfCanvas");
var ctx = canvas.getContext("2d");

// Game State
var frames = 0;
var score = 0;
var best = 0;
var currentPhase = 'start'; // 'start', 'playing', 'gameover'
var gameSpeed = 5;
var baseSpeed = 5;

// Audio Management with Instant Cutoff
var dieSound = new Audio('../getout.mp3');
dieSound.preload = 'auto';

var activeEatSounds = [];

function playEatSound() {
    var snd = new Audio('../eat.mp3');
    var p = snd.play();
    if (p !== undefined) {
        p.catch(function() {});
    }
    activeEatSounds.push(snd);
    snd.onended = function() {
        var idx = activeEatSounds.indexOf(snd);
        if (idx !== -1) {
            activeEatSounds.splice(idx, 1);
        }
    };
}

function stopAllEatSounds() {
    for (var i = 0; i < activeEatSounds.length; i++) {
        activeEatSounds[i].pause();
        activeEatSounds[i].currentTime = 0;
    }
    activeEatSounds = [];
}

function playDieSound() {
    stopAllEatSounds();
    dieSound.pause();
    dieSound.currentTime = 0;
    var p = dieSound.play();
    if (p !== undefined) {
        p.catch(function() {});
    }
}

// Player (Surfer) Object
var player = {
    x: 180,
    y: 120, // Surfer stays near the top, water moves up
    width: 24,
    height: 48,
    speed: 6,
    movingLeft: false,
    movingRight: false,
    jumpFrames: 0, // >0 means player is in the air (invincible)

    reset: function() {
        this.x = canvas.width / 2 - this.width / 2;
        this.movingLeft = false;
        this.movingRight = false;
        this.jumpFrames = 0;
    },

    update: function() {
        if (this.movingLeft && this.x > 5) {
            this.x -= this.speed;
        }
        if (this.movingRight && this.x + this.width < canvas.width - 5) {
            this.x += this.speed;
        }
        
        // Handle jump duration
        if (this.jumpFrames > 0) {
            this.jumpFrames--;
        }

        // Generate water wake behind board if grounded
        if (this.jumpFrames === 0 && frames % 3 === 0) {
            wakes.items.push({
                x: this.x + this.width / 2 - 4 + (Math.random() * 8 - 4),
                y: this.y + this.height,
                size: Math.random() * 6 + 4,
                life: 30
            });
        }
    },

    draw: function() {
        var drawY = this.y;
        var scale = 1;
        
        // Jump animation effect
        if (this.jumpFrames > 0) {
            // Shadow
            ctx.fillStyle = "rgba(0, 50, 100, 0.4)";
            ctx.fillRect(this.x + 4, this.y + 10, this.width, this.height);
            
            // Pop up into the air
            var jumpHeight = Math.sin((this.jumpFrames / 45) * Math.PI) * 25;
            drawY -= jumpHeight;
            scale = 1.2; 
        }

        ctx.save();
        ctx.translate(this.x + this.width/2, drawY + this.height/2);
        ctx.scale(scale, scale);
        
        // Surfboard
        ctx.fillStyle = "#f1c40f"; // Yellow board
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Red stripe on board
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(-2, -18, 4, 36);

        // Surfer Wetsuit
        ctx.fillStyle = "#2c3e50"; // Dark suit
        ctx.fillRect(-6, -8, 12, 16);
        // Head
        ctx.fillStyle = "#ffdbac";
        ctx.beginPath();
        ctx.arc(0, -10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
};

// Water Wake Particles
var wakes = {
    items: [],
    update: function() {
        for (var i = 0; i < this.items.length; i++) {
            var w = this.items[i];
            w.y += gameSpeed * 0.5; // Drift up slower than obstacles
            w.life--;
            w.size += 0.2;
            if (w.life <= 0) {
                this.items.splice(i, 1);
                i--;
            }
        }
    },
    draw: function() {
        for (var i = 0; i < this.items.length; i++) {
            var w = this.items[i];
            ctx.fillStyle = "rgba(255, 255, 255, " + (w.life / 30) + ")";
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Obstacles (Rocks, Kraken) and Ramps
var mapItems = {
    items: [],
    
    reset: function() {
        this.items = [];
    },

    update: function() {
        // Spawn items
        if (frames % 40 === 0) {
            var rand = Math.random();
            var type = 'rock';
            var w = 30 + Math.random() * 20;
            var h = 30 + Math.random() * 20;

            if (rand > 0.85) {
                type = 'ramp';
                w = 40; h = 20;
            } else if (rand > 0.70 && score > 200) {
                type = 'kraken'; // Wide obstacle
                w = 80 + Math.random() * 60;
                h = 25;
            }

            this.items.push({
                type: type,
                x: Math.random() * (canvas.width - w),
                y: canvas.height + 20, // Spawn below screen
                w: w,
                h: h
            });
        }

        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            item.y -= gameSpeed; // Move UP the screen

            // Remove off-screen items
            if (item.y + item.h < 0) {
                this.items.splice(i, 1);
                i--;
                continue;
            }

            // Hitbox Collision
            if (player.x < item.x + item.w && 
                player.x + player.width > item.x && 
                player.y < item.y + item.h && 
                player.y + player.height > item.y) {
                
                if (item.type === 'ramp') {
                    if (player.jumpFrames === 0) { // Can't jump while jumping
                        player.jumpFrames = 45; // 45 frames of air time
                        playEatSound();
                        score += 50; // Bonus score for sick jumps
                    }
                } else {
                    // It's a rock or kraken. If jumping, we fly over it safely.
                    if (player.jumpFrames === 0 && currentPhase !== 'gameover') {
                        playDieSound();
                        currentPhase = 'gameover';
                        return;
                    }
                }
            }
        }
    },

    draw: function() {
        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];

            if (item.type === 'rock') {
                ctx.fillStyle = "#7f8c8d";
                ctx.fillRect(item.x, item.y, item.w, item.h);
                // Simple 3D rock highlight
                ctx.fillStyle = "#95a5a6";
                ctx.fillRect(item.x + 2, item.y + 2, item.w - 8, item.h - 8);
            } 
            else if (item.type === 'kraken') {
                ctx.fillStyle = "#8e44ad"; // Purple tentacle
                ctx.beginPath();
                ctx.roundRect(item.x, item.y, item.w, item.h, 10);
                ctx.fill();
                // Suckers
                ctx.fillStyle = "#9b59b6";
                for (var s = 5; s < item.w - 10; s += 20) {
                    ctx.beginPath();
                    ctx.arc(item.x + s + 5, item.y + item.h/2, 4, 0, Math.PI*2);
                    ctx.fill();
                }
            } 
            else if (item.type === 'ramp') {
                ctx.fillStyle = "#2ecc71"; // Green ramp base
                ctx.fillRect(item.x, item.y, item.w, item.h);
                ctx.fillStyle = "#f39c12"; // Orange boost arrows
                ctx.beginPath();
                ctx.moveTo(item.x + item.w/2, item.y + 2);
                ctx.lineTo(item.x + item.w - 5, item.y + item.h - 2);
                ctx.lineTo(item.x + 5, item.y + item.h - 2);
                ctx.fill();
            }
        }
    }
};

// Input Controls (Keyboard)
window.addEventListener("keydown", function(e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        player.movingLeft = true;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
        player.movingRight = true;
    }
    if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleActionInput();
    }
});

window.addEventListener("keyup", function(e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        player.movingLeft = false;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
        player.movingRight = false;
    }
});

function handleActionInput() {
    if (currentPhase === 'start') {
        currentPhase = 'playing';
    } else if (currentPhase === 'gameover') {
        player.reset();
        mapItems.reset();
        wakes.items = [];
        score = 0;
        frames = 0;
        gameSpeed = baseSpeed;
        currentPhase = 'start';
    }
}

// Input Controls (Mobile Touch)
var btnLeft = document.getElementById("btnLeft");
var btnRight = document.getElementById("btnRight");

btnLeft.addEventListener("touchstart", function(e) { e.preventDefault(); player.movingLeft = true; }, {passive: false});
btnLeft.addEventListener("touchend", function(e) { e.preventDefault(); player.movingLeft = false; }, {passive: false});
btnLeft.addEventListener("mousedown", function() { player.movingLeft = true; });
btnLeft.addEventListener("mouseup", function() { player.movingLeft = false; });

btnRight.addEventListener("touchstart", function(e) { e.preventDefault(); player.movingRight = true; }, {passive: false});
btnRight.addEventListener("touchend", function(e) { e.preventDefault(); player.movingRight = false; }, {passive: false});
btnRight.addEventListener("mousedown", function() { player.movingRight = true; });
btnRight.addEventListener("mouseup", function() { player.movingRight = false; });

canvas.addEventListener("touchstart", function(e) {
    e.preventDefault();
    if (currentPhase !== 'playing') handleActionInput();
}, {passive: false});
canvas.addEventListener("mousedown", function() {
    if (currentPhase !== 'playing') handleActionInput();
});

// Game Loop
function loop() {
    // Clear & draw water
    ctx.fillStyle = "#0097e6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw order is important for depth
    wakes.draw();
    mapItems.draw();
    player.draw();

    if (currentPhase === 'playing') {
        player.update();
        wakes.update();
        mapItems.update();
        
        // Increase score and speed
        score++;
        best = Math.max(score, best);
        
        if (frames > 0 && frames % 500 === 0) {
            gameSpeed += 0.5;
        }
        frames++;
    }

    // UI Overlays
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    
    if (currentPhase === 'start') {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("EDGE SURF", canvas.width / 2, 220);
        ctx.font = "14px sans-serif";
        ctx.fillText("Hit Ramps. Dodge Rocks & Krakens.", canvas.width / 2, 260);
        ctx.fillText("Tap screen to Start", canvas.width / 2, 300);
        ctx.textAlign = "left";
    } else if (currentPhase === 'gameover') {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#e74c3c";
        ctx.textAlign = "center";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("WIPEOUT!", canvas.width / 2, 220);
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px sans-serif";
        ctx.fillText("Score: " + score, canvas.width / 2, 260);
        ctx.fillText("Best: " + best, canvas.width / 2, 290);
        ctx.fillText("Tap screen to Restart", canvas.width / 2, 340);
        ctx.textAlign = "left";
    } else {
        ctx.fillText("Distance: " + score + "m", 15, 30);
    }

    requestAnimationFrame(loop);
}

// Init
player.reset();
loop();
