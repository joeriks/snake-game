/**
 * Main Game Class
 * Coordinates all game systems
 */

import * as THREE from 'three';
import { World } from '../world/World.js';
import { SaveManager } from './SaveManager.js';
import { Snake } from './Snake.js';
import { Genetics } from './Genetics.js';
import { audioManager } from './AudioManager.js';
import morphData from '../../data/morphs.json';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.getElementById('loading-progress');

        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Game systems
        this.world = null;
        this.saveManager = new SaveManager();
        this.genetics = new Genetics(morphData);

        // Game state
        this.state = {
            money: 500,
            collection: [],
            discoveredMorphs: new Set(),
            currentBiome: 'prairie',
            unlockedBiomes: ['prairie'],
            maxTerrariums: 4
        };

        // UI elements
        this.moneyDisplay = document.getElementById('money-display');
        this.discoveredCount = document.getElementById('discovered-count');
        this.currentBiomeDisplay = document.getElementById('current-biome');

        // Bind methods
        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
    }

    async init() {
        this.updateLoadingProgress(10);

        // Load saved game
        const savedState = this.saveManager.load();
        if (savedState) {
            this.state = { ...this.state, ...savedState };
            this.state.discoveredMorphs = new Set(savedState.discoveredMorphs || []);
        }

        this.updateLoadingProgress(20);

        // Initialize Three.js
        this.initThreeJS();
        this.updateLoadingProgress(40);

        // Initialize world with snake encounter callback
        this.world = new World(this.scene, this.camera, (snakeData) => {
            this.handleSnakeDiscovery(snakeData);
        });
        await this.world.init();

        // Set up coin collection callback
        this.world.onCoinCollected = (value) => {
            this.state.money += value;
            this.updateUI();
            audioManager.playCoinCollect();
            console.log(`💰 Collected coin worth $${value}!`);
        };

        this.updateLoadingProgress(70);

        // Setup UI
        this.setupUI();
        this.updateLoadingProgress(90);

        // Update displays
        this.updateUI();
        this.updateLoadingProgress(100);

        // Hide loading screen after a short delay
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
        }, 500);
    }

    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 120); // Closer fog for ground-level view

        // Camera - First person settings
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500); // Wider FOV for immersion
        this.camera.position.set(0, 1.7, 0); // Eye height
        this.camera.lookAt(0, 1.7, -1);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Window resize handler
        window.addEventListener('resize', this.onWindowResize);
    }

    setupUI() {
        // Initialize audio on first user interaction
        const initAudio = () => {
            audioManager.init();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('touchstart', initAudio);
        };
        // Use capture phase or specialized event to catch interaction early
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });

        // Tab switching for Market Panel
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                if (tab === 'sell') {
                    this.populateMarketSell();
                } else {
                    this.populateMarketBuy();
                }
                audioManager.playUIClick();
            });
        });

        // Navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                audioManager.playUIClick();
                this.handleNavClick(btn);
            });
        });

        // Close panel buttons
        const closeButtons = document.querySelectorAll('.close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                audioManager.playUIClick();
                this.closeAllPanels();
            });
        });

        // Breeding buttons
        document.getElementById('breed-btn')?.addEventListener('click', () => this.breedSnakes());

        // Parent slot clicks
        ['parent1', 'parent2'].forEach(slot => {
            document.getElementById(`${slot}-slot`).addEventListener('click', () => {
                this.handleParentSlotClick(slot);
            });
        });

        // Encounter modal buttons
        document.getElementById('capture-btn')?.addEventListener('click', () => this.captureSnake());
        document.getElementById('release-btn')?.addEventListener('click', () => {
            audioManager.playUIClick();
            this.releaseSnake();
        });

        // Go Home button
        document.getElementById('go-home-btn')?.addEventListener('click', () => this.goHome());

        // Sound toggle button
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle?.addEventListener('click', () => {
            const enabled = audioManager.toggle();
            soundToggle.textContent = enabled ? '🔊' : '🔇';
            soundToggle.classList.toggle('muted', !enabled);
            audioManager.playUIClick(); // Play click if just enabled
        });

        // Click on canvas to explore
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    handleNavClick(btn) {
        const panel = btn.dataset.panel;

        // Update nav button states
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (panel === 'explore') {
            this.closeAllPanels();
        } else {
            this.openPanel(panel);
        }
    }

    openPanel(panelName) {
        const container = document.getElementById('panel-container');
        container.classList.remove('hidden');
        audioManager.playPanelOpen();

        // Hide all panels
        document.querySelectorAll('.panel').forEach(p => {
            p.classList.remove('active');
            p.classList.add('hidden');
        });

        // Show selected panel
        const panel = document.getElementById(`${panelName}-panel`);
        if (panel) {
            panel.classList.remove('hidden');
            setTimeout(() => panel.classList.add('active'), 10);

            // Populate panel content
        } else if (panelName === 'market') {
            this.populateMarket();
        } else if (panelName === 'home') {
            this.populateHome();
        } else if (panelName === 'breed') {
            this.populateBreeding();
        }
    }

    closeAllPanels() {
        const container = document.getElementById('panel-container');
        document.querySelectorAll('.panel').forEach(p => {
            p.classList.remove('active');
        });
        audioManager.playPanelClose();
        setTimeout(() => container.classList.add('hidden'), 250);
    }

    handleCanvasClick(event) {
        // Try to interact with nearby snake
        if (this.world && this.world.nearbySnake) {
            this.world.interactWithNearbySnake();
        }
    }

    /**
     * Called when player discovers a snake in the world
     */
    handleSnakeDiscovery(snakeData) {
        // Generate snake using seeded data for consistency
        const snake = this.genetics.generateWildSnakeFromSeed(
            snakeData.seed,
            snakeData.species,
            snakeData.rarity
        );
        this.currentEncounter = snake;
        this.currentEncounterData = snakeData; // Store world data for marking collected

        // Show encounter modal
        this.showEncounterModal(snake);
    }

    /**
     * Show the encounter modal with snake info
     */
    showEncounterModal(snake) {
        audioManager.playSnakeDiscovery();

        // Release pointer lock
        if (this.world) this.world.enableUI();

        const modal = document.getElementById('encounter-modal');
        document.getElementById('encounter-name').textContent = snake.getDisplayName();
        document.getElementById('encounter-species').textContent = snake.getSpeciesName();
        document.getElementById('encounter-value').textContent = `Est. Value: $${snake.calculatePrice()}`;

        // Show morph image
        const previewContainer = document.getElementById('encounter-snake-preview');
        const morphImage = snake.getMorphImage();
        if (morphImage) {
            previewContainer.innerHTML = `<img src="${morphImage}" alt="${snake.getDisplayName()}" class="morph-photo" onerror="this.style.display='none'; this.parentElement.innerHTML='🐍';">`;
        } else {
            previewContainer.innerHTML = '🐍';
        }

        // Populate genetics
        const geneticsContainer = document.getElementById('encounter-genetics');
        geneticsContainer.innerHTML = '';

        snake.getVisualGenes().forEach(gene => {
            const tag = document.createElement('span');
            tag.className = 'gene-tag visual';
            tag.textContent = gene;
            geneticsContainer.appendChild(tag);
        });

        snake.getHetGenes().forEach(gene => {
            const tag = document.createElement('span');
            tag.className = 'gene-tag het';
            tag.textContent = `Het ${gene}`;
            geneticsContainer.appendChild(tag);
        });

        modal.classList.remove('hidden');
    }

    captureSnake() {
        if (this.currentEncounter) {
            audioManager.playSnakeCapture();
            this.state.collection.push(this.currentEncounter);

            // Track discovered morphs
            this.currentEncounter.getVisualGenes().forEach(gene => {
                this.state.discoveredMorphs.add(gene);
            });

            // Mark the world snake as collected so it disappears
            if (this.currentEncounterData) {
                this.currentEncounterData.collected = true;
                // Hide the visual elements
                this.currentEncounterData.spot.visible = false;
                this.currentEncounterData.rustle.visible = false;
            }

            this.updateUI();
            this.saveManager.save(this.getSerializableState());
            this.closeEncounterModal();

            console.log('🐍 Captured:', this.currentEncounter.getDisplayName());
        }
    }

    releaseSnake() {
        this.closeEncounterModal();
    }

    closeEncounterModal() {
        document.getElementById('encounter-modal').classList.add('hidden');
        this.currentEncounter = null;

        // Allow playing again
        if (this.world) this.world.disableUI();
    }

    populateCollection() {
        const grid = document.getElementById('snake-grid');
        grid.innerHTML = '';

        if (this.state.collection.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">No snakes yet. Go explore!</p>';
            return;
        }

        this.state.collection.forEach((snake, index) => {
            const card = this.createSnakeCard(snake, index);
            grid.appendChild(card);
        });
    }

    createSnakeCard(snake, index) {
        const card = document.createElement('div');
        card.className = 'snake-card';
        card.dataset.rarity = snake.getRarityTier();
        card.dataset.index = index;

        card.innerHTML = `
      <div class="preview">🐍</div>
      <div class="info">
        <div class="name">${snake.getDisplayName()}</div>
        <div class="species">${snake.getSpeciesName()}</div>
        <div class="price">$${snake.calculatePrice()}</div>
      </div>
    `;

        return card;
    }

    populateMarket() {
        // Default to sell tab
        this.populateMarketSell();
    }

    populateMarketSell() {
        const listings = document.getElementById('market-listings');
        listings.innerHTML = '';

        if (this.state.collection.length === 0) {
            listings.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">You have no snakes to sell.</p>';
            return;
        }

        this.state.collection.forEach((snake, index) => {
            const card = document.createElement('div');
            card.className = 'snake-card';
            card.innerHTML = `
                <div class="preview">🐍</div>
                <div class="info">
                    <div class="name">${snake.getDisplayName()}</div>
                    <div class="species">${snake.getSpeciesName()}</div>
                    <div class="price">Sell for $${snake.calculatePrice()}</div>
                </div>
                <button class="action-btn small" data-index="${index}">Sell</button>
            `;

            card.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                this.sellSnake(index);
            });

            listings.appendChild(card);
        });
    }

    populateMarketBuy() {
        const listings = document.getElementById('market-listings');
        listings.innerHTML = '';

        // Generate some random listings if not already cached (could be added to state later)
        // For now, generate on fly for demo
        const speciesAvailable = ['western', 'eastern'];

        for (let i = 0; i < 3; i++) {
            // Mock data generation using seeded random logic ideally, but here simplified
            const species = speciesAvailable[Math.floor(Math.random() * speciesAvailable.length)];
            const price = 150 + Math.floor(Math.random() * 300);

            const card = document.createElement('div');
            card.className = 'snake-card market-item';
            card.innerHTML = `
                <div class="preview">🐍</div>
                <div class="info">
                    <div class="name">Mystery ${species}</div>
                    <div class="species">Captive Bred</div>
                    <div class="price">Buy $${price}</div>
                </div>
                <button class="action-btn small primary">Buy</button>
            `;

            card.querySelector('button').addEventListener('click', () => {
                this.buySnake({ species, price });
            });

            listings.appendChild(card);
        }
    }


    sellSnake(index) {
        const snake = this.state.collection[index];
        const price = snake.calculatePrice();

        this.state.money += price;
        this.state.collection.splice(index, 1);

        audioManager.playCoinCollect();
        this.updateUI();
        this.populateMarketSell(); // Refresh list
        this.populateHome(); // Refresh home incase it was shown
    }

    buySnake(listing) {
        if (this.state.money >= listing.price) {
            this.state.money -= listing.price;

            // Generate a captive bred snake (clean genetics usually, or random simple morphs)
            const snake = this.genetics.generateWildSnake('prairie'); // Reuse generation for now
            snake.origin = 'purchased';

            this.state.collection.push(snake);

            audioManager.playCoinCollect();
            this.updateUI();
            alert(`You bought a ${snake.getDisplayName()}!`);
        } else {
            audioManager.playError();
            alert("Not enough money!");
        }
    }

    // === BREEDING SYSTEM ===

    populateBreeding() {
        this.breedingParents = { p1: null, p2: null };
        this.updateBreedingUI();
    }

    handleParentSlotClick(slot) {
        const indexStr = prompt("Enter inventory index of snake (0 to " + (this.state.collection.length - 1) + "):");
        if (indexStr === null) return;

        const index = parseInt(indexStr);
        if (!isNaN(index) && this.state.collection[index]) {
            if (slot === 'parent1') this.breedingParents.p1 = this.state.collection[index];
            else this.breedingParents.p2 = this.state.collection[index];

            this.updateBreedingUI();
        }
    }

    updateBreedingUI() {
        const p1Name = this.breedingParents.p1 ? this.breedingParents.p1.getDisplayName() : 'Select Female';
        const p2Name = this.breedingParents.p2 ? this.breedingParents.p2.getDisplayName() : 'Select Male';

        document.querySelector('#parent1-slot .placeholder').textContent = p1Name;
        document.querySelector('#parent2-slot .placeholder').textContent = p2Name;

        const breedBtn = document.getElementById('breed-btn');
        const canBreed = this.breedingParents.p1 && this.breedingParents.p2;
        if (breedBtn) breedBtn.disabled = !canBreed;

        if (canBreed) {
            this.updateBreedingPreview();
        } else {
            document.getElementById('offspring-preview').classList.add('hidden');
        }
    }

    updateBreedingPreview() {
        const preview = document.getElementById('offspring-preview');
        preview.classList.remove('hidden');

        const predictions = this.genetics.predictOffspring(this.breedingParents.p1, this.breedingParents.p2);
        const container = document.getElementById('punnett-results');

        if (predictions.length === 0) {
            container.textContent = "Offspring will likely be Normal (Wild Type)";
            return;
        }

        container.innerHTML = predictions.map(p => {
            const outcomes = Object.entries(p.outcomes).map(([genotype, prob]) => {
                return `<div>${genotype}: ${prob * 100}%</div>`;
            }).join('');
            return `<div class="prediction-group"><strong>${p.gene}</strong>${outcomes}</div>`;
        }).join('');
    }

    breedSnakes() {
        try {
            const offspring = this.genetics.breed(this.breedingParents.p1, this.breedingParents.p2);

            // Add first offspring to collection
            if (offspring.length > 0) {
                const baby = offspring[0];
                this.state.collection.push(baby);

                // Track discovered morphs
                baby.getVisualGenes().forEach(gene => {
                    this.state.discoveredMorphs.add(gene);
                });

                audioManager.playSnakeCapture(); // Victory sound
                alert(`Breeding Successful! You got a ${baby.getDisplayName()}! (Clutch size: ${offspring.length})`);
                this.updateUI();
                this.closeAllPanels();

                // Reset breeding
                this.breedingParents = { p1: null, p2: null };
                this.updateBreedingUI();
            }
        } catch (e) {
            audioManager.playError();
            alert(e.message);
        }
    }


    /**
     * Populate the home panel with terrariums and breeding info
     */
    populateHome() {
        const terrariumGrid = document.getElementById('home-terrariums');
        terrariumGrid.innerHTML = '';

        // Show up to maxTerrariums
        for (let i = 0; i < this.state.maxTerrariums; i++) {
            const snake = this.state.collection[i];
            const card = document.createElement('div');
            card.className = `terrarium-card${snake ? '' : ' empty'}`;

            if (snake) {
                const morphs = snake.getVisualGenes ? snake.getVisualGenes() : [];
                card.innerHTML = `
                    <div class="snake-icon">🐍</div>
                    <div class="snake-name">${snake.getDisplayName()}</div>
                    <div class="snake-morph">${morphs.length > 0 ? morphs.join(', ') : 'Normal'}</div>
                `;
            } else {
                card.innerHTML = `
                    <div class="snake-icon">📦</div>
                    <div class="snake-name">Tomt terrarium</div>
                    <div class="snake-morph">Fånga en orm!</div>
                `;
            }

            terrariumGrid.appendChild(card);
        }

        // Buy Slot Card
        if (this.state.maxTerrariums < 12) {
            const cost = this.state.maxTerrariums * 500;
            const buyCard = document.createElement('div');
            buyCard.className = 'terrarium-card buy-slot';
            buyCard.innerHTML = `
                <div class="snake-icon">➕</div>
                <div class="snake-name">Buy Slot</div>
                <div class="snake-morph">$${cost}</div>
            `;
            buyCard.addEventListener('click', () => this.buyTerrarium());
            terrariumGrid.appendChild(buyCard);
        }


        // Update world terrariums when home panel is opened
        if (this.world) {
            this.world.updateHomeTerrariums(this.state.collection);
        }
    }

    /**
     * Teleport player to home
     */
    goHome() {
        if (this.world) {
            audioManager.playTeleport();
            this.world.goHome();
            this.closeAllPanels();

            // Reset nav button states
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-panel="explore"]')?.classList.add('active');
        }
    }

    buyTerrarium() {
        const cost = this.state.maxTerrariums * 500;
        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.maxTerrariums++;
            audioManager.playCoinCollect();
            this.updateUI();
            this.populateHome();
        } else {
            audioManager.playError();
            alert("Not enough money!");
        }
    }

    updateUI() {
        this.moneyDisplay.textContent = this.state.money.toLocaleString();
        this.discoveredCount.textContent = this.state.discoveredMorphs.size;

        const biomeData = morphData.biomes?.[this.state.currentBiome];
        this.currentBiomeDisplay.textContent = biomeData?.name || 'Prairie Grasslands';
    }

    updateLoadingProgress(percent) {
        if (this.loadingProgress) {
            this.loadingProgress.style.width = `${percent}%`;
        }
    }

    getSerializableState() {
        return {
            ...this.state,
            discoveredMorphs: Array.from(this.state.discoveredMorphs),
            collection: this.state.collection.map(s => s.serialize())
        };
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate);

        // Update world
        if (this.world) {
            this.world.update();
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        this.animate();
    }
}
