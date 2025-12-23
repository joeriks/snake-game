/**
 * World - 3D Environment
 * Creates and manages the game world terrain and objects
 */

import * as THREE from 'three';
import { SeededRandom, WORLD_SEED } from '../core/SeededRandom.js';
import { Home } from './Home.js';

export class World {
    constructor(scene, camera, onSnakeFound) {
        this.scene = scene;
        this.camera = camera;
        this.onSnakeFound = onSnakeFound; // Callback when player finds a snake

        this.terrain = null;
        this.decorations = [];
        this.home = null;

        // Snake spots with actual snake data
        this.snakeSpots = [];
        this.nearbySnake = null;
        this.detectionRadius = 10;
        this.interactionRadius = 3;

        // Coin collection system
        this.coins = [];
        this.onCoinCollected = null; // Callback when coin is collected
        this.coinRespawnTime = 60000; // 60 seconds to respawn
        this.coinCollectionRadius = 2;

        // Seeded random for deterministic world
        this.random = new SeededRandom(WORLD_SEED);

        // First-person camera controls - start at home
        this.playerPosition = new THREE.Vector3(0, 0, 5);
        this.playerAngle = 0;
        this.playerPitch = -0.1;
        this.eyeHeight = 1.7;

        // Walking animation
        this.walkTime = 0;
        this.isWalking = false;
        this.headBobAmount = 0.05;
        this.headBobSpeed = 10;

        // Smoothed terrain height for smooth camera movement
        this.smoothedTerrainHeight = 0;
        this.terrainSmoothingFactor = 0.15; // Higher = faster adaptation

        // Smoothed head bob to prevent abrupt stops
        this.smoothedHeadBob = 0;

        // Movement - slow walking pace
        this.moveSpeed = 0.05;
        this.turnSpeed = 0.025;
        this.keys = {};
        this.setupControls();
    }

    async init() {
        this.random.reset(); // Ensure deterministic generation
        this.createTerrain();
        this.createHome();
        this.createDecorations();
        this.createSnakeSpots();
        this.createCoins();
    }

    /**
     * Create the player's home base
     */
    createHome() {
        this.home = new Home(this.scene);
        this.home.init();
    }

    /**
     * Teleport player back to home
     */
    goHome() {
        this.playerPosition.copy(this.home.getSpawnPosition());
        this.playerAngle = 0;
        this.playerPitch = -0.1;
    }

    /**
     * Update home terrariums with player's snake collection
     */
    updateHomeTerrariums(collection) {
        if (this.home) {
            this.home.updateTerrariums(collection);
        }
    }

    /**
     * Get terrain height at a given world position
     * Uses the same formula as terrain generation (without random noise for consistency)
     */
    getTerrainHeight(x, z) {
        // The terrain plane is rotated -90 degrees on X, so the formula uses
        // the original x/y coordinates from the geometry (x, z in world space becomes x, y in plane space)
        return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2;
    }

    /**
     * Create the ground terrain
     */
    createTerrain() {
        // Ground plane with grass texture simulation
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);

        // Add some height variation
        const positions = groundGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 2
                + Math.random() * 0.3;
            positions.setZ(i, z);
        }
        groundGeometry.computeVertexNormals();

        // Prairie grass material
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x7cb342,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: true
        });

        this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);

        // Add some dirt patches
        this.addDirtPatches();
    }

    /**
     * Add dirt/sand patches to terrain
     */
    addDirtPatches() {
        const patchMaterial = new THREE.MeshStandardMaterial({
            color: 0xc9a66b,
            roughness: 0.95
        });

        for (let i = 0; i < 15; i++) {
            const patchGeometry = new THREE.CircleGeometry(
                3 + Math.random() * 5,
                16
            );
            const patch = new THREE.Mesh(patchGeometry, patchMaterial);
            patch.rotation.x = -Math.PI / 2;
            patch.position.set(
                (Math.random() - 0.5) * 150,
                0.01,
                (Math.random() - 0.5) * 150
            );
            this.scene.add(patch);
            this.decorations.push(patch);
        }
    }

    /**
     * Create decorative elements (rocks, grass tufts)
     */
    createDecorations() {
        // Rocks
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            flatShading: true
        });

        for (let i = 0; i < 30; i++) {
            const size = 0.5 + Math.random() * 2;
            const rockGeometry = new THREE.DodecahedronGeometry(size, 0);
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);

            rock.position.set(
                (Math.random() - 0.5) * 180,
                size * 0.3,
                (Math.random() - 0.5) * 180
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            rock.receiveShadow = true;

            this.scene.add(rock);
            this.decorations.push(rock);
        }

        // Grass tufts (simple cones)
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x558b2f,
            flatShading: true
        });

        for (let i = 0; i < 100; i++) {
            const height = 0.5 + Math.random() * 1;
            const grassGeometry = new THREE.ConeGeometry(0.3, height, 4);
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);

            grass.position.set(
                (Math.random() - 0.5) * 180,
                height * 0.5,
                (Math.random() - 0.5) * 180
            );
            grass.castShadow = true;

            this.scene.add(grass);
            this.decorations.push(grass);
        }
    }

    /**
     * Create snake spots with seeded positions
     * Snakes are hidden until player gets close
     */
    createSnakeSpots() {
        // === STARTER SNAKES near home (easy to find) ===
        const starterPositions = [
            { x: 15, z: 10 },   // Right-front of home
            { x: -12, z: 15 },  // Left-front of home
            { x: 5, z: 20 },    // Straight ahead from home
        ];

        starterPositions.forEach((pos, i) => {
            this.addSnakeSpot(pos.x, pos.z, `starter_${i}`, true);
        });

        // === WILD SNAKES spread across the world ===
        const NUM_WILD_SNAKES = 22; // Remaining snakes

        for (let i = 0; i < NUM_WILD_SNAKES; i++) {
            // Seeded random position
            const x = this.random.float(-85, 85);
            const z = this.random.float(-85, 85);

            // Skip if too close to home area (avoid overlap with starters)
            if (Math.abs(x) < 20 && Math.abs(z) < 25) continue;

            this.addSnakeSpot(x, z, `wild_${i}`, false);
        }
    }

    /**
     * Add a snake spot at given position
     */
    addSnakeSpot(x, z, id, isStarter = false) {
        // Create spot marker (pulsing ring when close)
        const spotGeometry = new THREE.RingGeometry(0.3, 0.5, 16);
        const spotMaterial = new THREE.MeshStandardMaterial({
            color: isStarter ? 0x00ff00 : 0xffcc00, // Green for starters, gold for wild
            emissive: isStarter ? 0x00ff00 : 0xffcc00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set(x, 0.05, z);

        // Visual rustling grass indicator
        const rustleGeometry = new THREE.ConeGeometry(0.2, 0.5, 4);
        const rustleMaterial = new THREE.MeshStandardMaterial({
            color: 0x558b2f,
            transparent: true,
            opacity: isStarter ? 0.4 : 0 // Starters always slightly visible
        });
        const rustle = new THREE.Mesh(rustleGeometry, rustleMaterial);
        rustle.position.set(x, 0.25, z);

        // Snake data
        const snakeData = {
            id: id,
            position: new THREE.Vector3(x, 0, z),
            discovered: false,
            collected: false,
            isStarter: isStarter,
            spot: spot,
            rustle: rustle,
            seed: this.random.int(0, 1000000),
            rarity: isStarter ? this.random.float(0, 0.5) : this.random.float(0, 1), // Starters are common
            species: this.random.pick(['western', 'western', 'western', 'eastern'])
        };

        this.scene.add(spot);
        this.scene.add(rustle);
        this.snakeSpots.push(snakeData);
    }

    /**
     * Create collectible coins around the world
     */
    createCoins() {
        const NUM_COINS = 40;

        // Some coins near home for easy money
        const nearbyPositions = [
            { x: 8, z: 8 },
            { x: -8, z: 12 },
            { x: 12, z: 5 },
            { x: -5, z: 8 },
            { x: 3, z: 15 },
        ];

        nearbyPositions.forEach((pos, i) => {
            this.addCoin(pos.x, pos.z, `coin_near_${i}`, 10);
        });

        // Rest spread around the world
        for (let i = 0; i < NUM_COINS - nearbyPositions.length; i++) {
            const angle = this.random.float(0, Math.PI * 2);
            const distance = this.random.float(20, 90);
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            // Value based on distance (further = more valuable)
            const value = Math.floor(5 + distance * 0.3);
            this.addCoin(x, z, `coin_${i}`, value);
        }
    }

    /**
     * Add a single coin at position
     */
    addCoin(x, z, id, value = 10) {
        // Coin mesh (golden cylinder)
        const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
        const coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffa500,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });
        const coinMesh = new THREE.Mesh(coinGeometry, coinMaterial);
        coinMesh.rotation.x = Math.PI / 2;
        coinMesh.position.set(x, 0.5, z);
        coinMesh.castShadow = true;

        const coinData = {
            id: id,
            mesh: coinMesh,
            position: new THREE.Vector3(x, 0, z),
            value: value,
            collected: false,
            respawnAt: null
        };

        this.scene.add(coinMesh);
        this.coins.push(coinData);
    }

    /**
     * Check for nearby coins and collect them
     */
    checkNearbyCoins() {
        const now = Date.now();

        for (const coin of this.coins) {
            // Handle respawn
            if (coin.collected && coin.respawnAt && now >= coin.respawnAt) {
                coin.collected = false;
                coin.respawnAt = null;
                coin.mesh.visible = true;
            }

            if (coin.collected) continue;

            const dist = this.playerPosition.distanceTo(coin.position);

            // Auto-collect when close
            if (dist < this.coinCollectionRadius) {
                coin.collected = true;
                coin.respawnAt = now + this.coinRespawnTime;
                coin.mesh.visible = false;

                // Trigger callback
                if (this.onCoinCollected) {
                    this.onCoinCollected(coin.value);
                }
            } else {
                // Animate coin rotation and hover
                const time = now * 0.002;
                coin.mesh.rotation.z = time;
                coin.mesh.position.y = 0.5 + Math.sin(time * 2 + coin.position.x) * 0.1;
            }
        }
    }

    checkNearbySnakes() {
        let closest = null;
        let closestDist = Infinity;

        for (const snakeData of this.snakeSpots) {
            if (snakeData.collected) continue;

            const dist = this.playerPosition.distanceTo(snakeData.position);

            // Update visual indicators based on distance
            if (dist < this.detectionRadius) {
                // Show rustling grass
                const intensity = 1 - (dist / this.detectionRadius);
                snakeData.rustle.material.opacity = intensity * 0.8;

                // Animate rustling
                const time = Date.now() * 0.005;
                snakeData.rustle.position.y = 0.2 + Math.sin(time + snakeData.seed) * 0.1;
                snakeData.rustle.rotation.y = Math.sin(time * 2 + snakeData.seed) * 0.3;

                if (dist < closestDist) {
                    closestDist = dist;
                    closest = snakeData;
                }
            } else {
                snakeData.rustle.material.opacity = 0;
            }

            // Show spot ring only when very close
            if (dist < this.interactionRadius) {
                snakeData.spot.material.opacity = 0.8;

                // Pulse animation
                const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
                snakeData.spot.scale.set(pulse, pulse, pulse);
            } else {
                snakeData.spot.material.opacity = 0;
            }
        }

        this.nearbySnake = closestDist < this.interactionRadius ? closest : null;
        return this.nearbySnake;
    }

    /**
     * Interact with nearby snake
     */
    interactWithNearbySnake() {
        if (this.nearbySnake && !this.nearbySnake.collected && this.onSnakeFound) {
            this.nearbySnake.discovered = true;
            this.onSnakeFound(this.nearbySnake);
        }
    }

    /**
     * Setup keyboard, mouse, and touch controls
     */
    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Prevent default browser scrolling for arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse look (desktop with pointer lock)
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.playerAngle -= e.movementX * 0.002;
                this.playerPitch -= e.movementY * 0.002;
                this.playerPitch = Math.max(-1.2, Math.min(0.5, this.playerPitch));
            }
        });

        const canvas = document.getElementById('game-canvas');

        // Click to enable pointer lock (desktop)
        canvas.addEventListener('click', () => {
            if (!document.pointerLockElement && !this.isTouchDevice) {
                canvas.requestPointerLock();
            }
        });

        // === TOUCH CONTROLS (iPad/Mobile) ===
        this.isTouchDevice = 'ontouchstart' in window;
        this.touchState = {
            isDragging: false,
            isMoving: false,
            lastX: 0,
            lastY: 0,
            startX: 0,
            startY: 0,
            touchCount: 0
        };

        // Touch start
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchState.isDragging = true;
            this.touchState.startX = touch.clientX;
            this.touchState.startY = touch.clientY;
            this.touchState.lastX = touch.clientX;
            this.touchState.lastY = touch.clientY;
            this.touchState.touchCount = e.touches.length;

            // Single tap = start moving forward
            if (e.touches.length === 1) {
                this.touchState.isMoving = true;
            }
        }, { passive: false });

        // Touch move - drag to look around
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touchState.isDragging) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchState.lastX;
            const deltaY = touch.clientY - this.touchState.lastY;

            // If moved significantly, it's a drag not a tap
            const totalMoveX = Math.abs(touch.clientX - this.touchState.startX);
            const totalMoveY = Math.abs(touch.clientY - this.touchState.startY);

            if (totalMoveX > 10 || totalMoveY > 10) {
                this.touchState.isMoving = false; // Stop forward movement while looking

                // Look around with drag
                this.playerAngle -= deltaX * 0.005;
                this.playerPitch -= deltaY * 0.003;
                this.playerPitch = Math.max(-1.2, Math.min(0.5, this.playerPitch));
            }

            this.touchState.lastX = touch.clientX;
            this.touchState.lastY = touch.clientY;
        }, { passive: false });

        // Touch end
        canvas.addEventListener('touchend', (e) => {
            // Quick tap (minimal movement) = walk forward briefly handled in update
            this.touchState.isDragging = false;
            this.touchState.isMoving = false;
            this.touchState.touchCount = e.touches.length;
        });

        // Prevent default touch behaviors
        canvas.addEventListener('gesturestart', (e) => e.preventDefault());
        canvas.addEventListener('gesturechange', (e) => e.preventDefault());
    }

    /**
     * Update loop - First Person Walking
     */
    update() {
        this.isWalking = false;

        // Calculate movement direction
        const forward = new THREE.Vector3(
            -Math.sin(this.playerAngle),
            0,
            -Math.cos(this.playerAngle)
        );
        const right = new THREE.Vector3(
            -Math.cos(this.playerAngle),
            0,
            Math.sin(this.playerAngle)
        );

        // WASD movement
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.playerPosition.add(forward.clone().multiplyScalar(this.moveSpeed));
            this.isWalking = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.playerPosition.add(forward.clone().multiplyScalar(-this.moveSpeed));
            this.isWalking = true;
        }
        if (this.keys['KeyA']) {
            this.playerPosition.add(right.clone().multiplyScalar(-this.moveSpeed));
            this.isWalking = true;
        }
        if (this.keys['KeyD']) {
            this.playerPosition.add(right.clone().multiplyScalar(this.moveSpeed));
            this.isWalking = true;
        }

        // Touch movement - hold to walk forward
        if (this.touchState && this.touchState.isMoving) {
            this.playerPosition.add(forward.clone().multiplyScalar(this.moveSpeed));
            this.isWalking = true;
        }

        // Arrow keys for turning (alternative to mouse)
        if (this.keys['ArrowLeft']) {
            this.playerAngle += this.turnSpeed;
        }
        if (this.keys['ArrowRight']) {
            this.playerAngle -= this.turnSpeed;
        }

        // Clamp player position to world bounds
        this.playerPosition.x = Math.max(-90, Math.min(90, this.playerPosition.x));
        this.playerPosition.z = Math.max(-90, Math.min(90, this.playerPosition.z));

        // Head bob animation when walking
        if (this.isWalking) {
            this.walkTime += 0.16;
        }
        const targetHeadBob = this.isWalking
            ? Math.sin(this.walkTime * this.headBobSpeed) * this.headBobAmount
            : 0;
        // Smooth the head bob to prevent abrupt jumps when stopping
        this.smoothedHeadBob += (targetHeadBob - this.smoothedHeadBob) * 0.3;

        // Get terrain height at player position to stay on ground
        const terrainHeight = this.getTerrainHeight(this.playerPosition.x, this.playerPosition.z);
        this.playerPosition.y = terrainHeight; // Keep player on terrain

        // Smoothly interpolate camera height to avoid vibration
        this.smoothedTerrainHeight += (terrainHeight - this.smoothedTerrainHeight) * this.terrainSmoothingFactor;

        // Update camera position (first person)
        this.camera.position.x = this.playerPosition.x;
        this.camera.position.y = this.smoothedTerrainHeight + this.eyeHeight + this.smoothedHeadBob;
        this.camera.position.z = this.playerPosition.z;

        // Camera look direction
        const lookTarget = new THREE.Vector3(
            this.playerPosition.x - Math.sin(this.playerAngle),
            this.smoothedTerrainHeight + this.eyeHeight + this.playerPitch * 2 + this.smoothedHeadBob,
            this.playerPosition.z - Math.cos(this.playerAngle)
        );
        this.camera.lookAt(lookTarget);

        // Check for nearby snakes and update indicators
        this.checkNearbySnakes();

        // Check for nearby coins and collect them
        this.checkNearbyCoins();
    }

    /**
     * Change biome appearance
     */
    setBiome(biomeId) {
        const biomeColors = {
            prairie: { ground: 0x7cb342, sky: 0x87CEEB },
            badlands: { ground: 0xc9a66b, sky: 0xE6D5AC },
            rocky: { ground: 0x6b6b6b, sky: 0x9EB8C7 },
            desert: { ground: 0xe8c170, sky: 0xFFE4B5 },
            coastal: { ground: 0x8fbc8f, sky: 0x87CEEB }
        };

        const colors = biomeColors[biomeId] || biomeColors.prairie;

        if (this.terrain) {
            this.terrain.material.color.setHex(colors.ground);
        }

        this.scene.background = new THREE.Color(colors.sky);
        this.scene.fog = new THREE.Fog(colors.sky, 50, 200);
    }
}
