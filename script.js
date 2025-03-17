const gameArea = document.getElementById('game-area');
const tree = document.getElementById('tree');
const trunk = document.getElementById('trunk');
const leaves = document.getElementById('leaves');
const scoreDisplay = document.getElementById('score');
const comboDisplay = document.getElementById('combo');

let height = 50; // Trunk starting height
let leafSize = 60; // Leaves starting size
let score = 0;
let combo = 1;
let lastTap = 0;
let obstacles = [];
let gameOver = false;

// Tap to grow tree
tree.addEventListener('click', () => {
    if (gameOver) return;

    const now = Date.now();
    const tapGap = now - lastTap;

    // Combo logic: tap within 500ms to increase combo
    if (tapGap < 500 && combo < 5) combo++;
    else if (tapGap > 500) combo = 1;
    lastTap = now;

    height += 10; // Grow trunk by 10px
    leafSize += 2; // Grow leaves slightly
    trunk.style.height = `${height}px`;
    leaves.style.height = `${leafSize}px`;
    leaves.style.width = `${leafSize}px`;
    leaves.style.top = `-${leafSize}px`; // Keep leaves on top

    score += combo;
    scoreDisplay.textContent = `Height: ${score}m`;
    comboDisplay.textContent = `Growth Streak: x${combo}`;
});

// Spawn obstacles (birds)
function spawnObstacle() {
    if (gameOver) return;

    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    obstacle.style.left = `${Math.random() * (600 - 30)}px`;
    obstacle.style.top = `${Math.random() * (400 - 100)}px`; // Avoid ground
    gameArea.appendChild(obstacle);

    let speedX = (Math.random() - 0.5) * 5; // -2.5 to 2.5
    let speedY = (Math.random() - 0.5) * 2;

    obstacles.push({ element: obstacle, x: parseFloat(obstacle.style.left), y: parseFloat(obstacle.style.top), speedX, speedY });

    if (obstacles.length > 4) {
        gameArea.removeChild(obstacles[0].element);
        obstacles.shift();
    }
}

// Move obstacles and check collisions
function update() {
    if (gameOver) return;

    obstacles.forEach(ob => {
        ob.x += ob.speedX;
        ob.y += ob.speedY;

        // Bounce off walls
        if (ob.x <= 0 || ob.x >= 570) ob.speedX *= -1; // 600 - 30
        if (ob.y <= 0 || ob.y >= 370) ob.speedY *= -1; // 400 - 30

        ob.element.style.left = `${ob.x}px`;
        ob.element.style.top = `${ob.y}px`;

        // Collision with leaves
        const leavesRect = leaves.getBoundingClientRect();
        const obRect = ob.element.getBoundingClientRect();
        if (
            leavesRect.left < obRect.right &&
            leavesRect.right > obRect.left &&
            leavesRect.top < obRect.bottom &&
            leavesRect.bottom > obRect.top
        ) {
            gameOver = true;
            alert(`Tree Toppled! Height: ${score}m`);
            resetGame();
        }
    });

    requestAnimationFrame(update);
}

// Reset game
function resetGame() {
    height = 50;
    leafSize = 60;
    score = 0;
    combo = 1;
    trunk.style.height = `${height}px`;
    leaves.style.height = `${leafSize}px`;
    leaves.style.width = `${leafSize}px`;
    leaves.style.top = `-${leafSize}px`;
    scoreDisplay.textContent = `Height: ${score}m`;
    comboDisplay.textContent = `Growth Streak: x${combo}`;
    obstacles.forEach(ob => gameArea.removeChild(ob.element));
    obstacles = [];
    gameOver = false;
    spawnObstacles();
}

// Start game
function spawnObstacles() {
    spawnObstacle();
    setInterval(spawnObstacle, 2500); // New bird every 2.5s
}

spawnObstacles();
requestAnimationFrame(update);