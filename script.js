document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const powerUpDisplay = document.getElementById('power-ups');
    const startButton = document.getElementById('start-btn');
    const eatSound = document.getElementById('eat-sound');
    const crashSound = document.getElementById('crash-sound');

    // Dynamically set canvas size based on window
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        gridSize = canvas.width / tileCountX; // Recalculate grid size
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const tileCountX = 30; // Fixed number of tiles horizontally
    const tileCountY = canvas.height / (canvas.width / tileCountX); // Adjust vertically
    let gridSize = canvas.width / tileCountX;

    let snake = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
    ];
    let food = { x: 10, y: 10 };
    let obstacles = [];
    let powerUp = null;
    let score = 0;
    let powerUps = 0;
    let speed = 10;
    let dx = 1;
    let dy = 0;
    let gameActive = false;
    let gameLoop;

    const robotImage = new Image();
    robotImage.src = 'img/robot.png';

    // Start the game
    startButton.addEventListener('click', () => {
        if (!gameActive) {
            startGame();
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
                if (dy !== 1) { dx = 0; dy = -1; }
                break;
            case 'ArrowDown':
                if (dy !== -1) { dx = 0; dy = 1; }
                break;
            case 'ArrowLeft':
                if (dx !== 1) { dx = -1; dy = 0; }
                break;
            case 'ArrowRight':
                if (dx !== -1) { dx = 1; dy = 0; }
                break;
        }
    });

    // Touch controls for mobile
    let touchStartX = null;
    let touchStartY = null;
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0 && dx !== -1) { dx = 1; dy = 0; } // Right
            else if (deltaX < 0 && dx !== 1) { dx = -1; dy = 0; } // Left
        } else {
            if (deltaY > 0 && dy !== -1) { dx = 0; dy = 1; } // Down
            else if (deltaY < 0 && dy !== 1) { dx = 0; dy = -1; } // Up
        }

        touchStartX = null;
        touchStartY = null;
    });

    function startGame() {
        gameActive = true;
        score = 0;
        powerUps = 0;
        speed = 10;
        snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
        dx = 1;
        dy = 0;
        scoreDisplay.textContent = score;
        powerUpDisplay.textContent = powerUps;
        startButton.textContent = 'Game Started!';
        startButton.disabled = true;

        spawnFood();
        spawnObstacles();
        spawnPowerUp();

        gameLoop = setInterval(update, 1000 / speed);
    }

    function update() {
        if (!gameActive) return;

        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            eatSound.play();
            spawnFood();
            if (score % 50 === 0) spawnPowerUp();
        } else {
            snake.pop();
        }

        if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
            powerUps++;
            powerUpDisplay.textContent = powerUps;
            speed += 2;
            powerUp = null;
            setTimeout(spawnPowerUp, 5000);
        }

        if (checkCollision()) {
            crashSound.play();
            endGame();
            return;
        }

        draw();
        scoreDisplay.textContent = score;
        updateBackground();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        snake.forEach((segment, index) => {
            ctx.drawImage(robotImage, segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            if (index === 0) {
                ctx.strokeStyle = '#00bcd4';
                ctx.lineWidth = 2;
                ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            }
        });

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

        ctx.fillStyle = '#ff0000';
        obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize, gridSize);
        });

        if (powerUp) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(powerUp.x * gridSize, powerUp.y * gridSize, gridSize, gridSize);
        }
    }

    function spawnFood() {
        food = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        while (isOccupied(food.x, food.y)) {
            food.x = Math.floor(Math.random() * tileCountX);
            food.y = Math.floor(Math.random() * tileCountY);
        }
    }

    function spawnObstacles() {
        obstacles = [];
        for (let i = 0; i < 5; i++) {
            const obstacle = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };
            if (!isOccupied(obstacle.x, obstacle.y)) {
                obstacles.push(obstacle);
            }
        }
    }

    function spawnPowerUp() {
        powerUp = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        while (isOccupied(powerUp.x, powerUp.y)) {
            powerUp.x = Math.floor(Math.random() * tileCountX);
            powerUp.y = Math.floor(Math.random() * tileCountY);
        }
    }

    function isOccupied(x, y) {
        return snake.some(segment => segment.x === x && segment.y === y) ||
               obstacles.some(obstacle => obstacle.x === x && obstacle.y === y);
    }

    function checkCollision() {
        const head = snake[0];

        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            return true;
        }

        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }

        return obstacles.some(obstacle => head.x === obstacle.x && head.y === obstacle.y);
    }

    function updateBackground() {
        const hue = (score * 2) % 360;
        document.body.style.backgroundColor = `hsl(${hue}, 70%, 90%)`;
    }

    function endGame() {
        gameActive = false;
        clearInterval(gameLoop);
        startButton.textContent = 'Play Again';
        startButton.disabled = false;
        alert(`Game Over! Your score: ${score}\nPower-Ups Collected: ${powerUps}`);
    }
});