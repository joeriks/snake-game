/**
 * Home - Player's Home Base
 * A small house where the player starts and can view their snakes
 */

import * as THREE from 'three';

export class Home {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.terrariums = [];
        this.position = new THREE.Vector3(0, 0, 0);
    }

    /**
     * Initialize home and add to scene
     */
    init() {
        this.createHouse();
        this.createPorch();
        this.createTerrariumStands();
        this.createBreedingStation();
        this.createPathway();
        this.createFence();

        this.scene.add(this.group);
    }

    /**
     * Create the main house structure
     */
    createHouse() {
        const house = new THREE.Group();

        // Main walls - cozy wooden cabin
        const wallsGeometry = new THREE.BoxGeometry(8, 3.5, 6);
        const wallsMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B6914, // Warm wood color
            roughness: 0.9
        });
        const walls = new THREE.Mesh(wallsGeometry, wallsMaterial);
        walls.position.y = 1.75;
        walls.castShadow = true;
        walls.receiveShadow = true;

        // Roof - triangular prism
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-5, 0);
        roofShape.lineTo(0, 2.5);
        roofShape.lineTo(5, 0);
        roofShape.lineTo(-5, 0);

        const extrudeSettings = { depth: 7, bevelEnabled: false };
        const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A3728, // Dark brown roof
            roughness: 0.8
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.rotation.x = Math.PI / 2;
        roof.position.set(0, 3.5, 3.5);
        roof.castShadow = true;

        // Door
        const doorGeometry = new THREE.BoxGeometry(1.2, 2.2, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x5D3A1A, // Dark wood door
            roughness: 0.7
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1.1, 3.05);

        // Windows
        const windowGeometry = new THREE.BoxGeometry(1.2, 1, 0.1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.6,
            emissive: 0xFFE4B5,
            emissiveIntensity: 0.3
        });

        const windowLeft = new THREE.Mesh(windowGeometry, windowMaterial);
        windowLeft.position.set(-2.5, 2, 3.05);

        const windowRight = new THREE.Mesh(windowGeometry, windowMaterial);
        windowRight.position.set(2.5, 2, 3.05);

        // Chimney
        const chimneyGeometry = new THREE.BoxGeometry(1, 2, 1);
        const chimneyMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(3, 5, -1);
        chimney.castShadow = true;

        house.add(walls, roof, door, windowLeft, windowRight, chimney);
        house.position.set(0, 0, -8);
        this.group.add(house);
    }

    /**
     * Create a wooden porch in front of the house
     */
    createPorch() {
        // Porch floor
        const porchGeometry = new THREE.BoxGeometry(10, 0.3, 5);
        const porchMaterial = new THREE.MeshStandardMaterial({
            color: 0xA0826D,
            roughness: 0.9
        });
        const porch = new THREE.Mesh(porchGeometry, porchMaterial);
        porch.position.set(0, 0.15, -3);
        porch.receiveShadow = true;

        // Porch steps
        const stepGeometry = new THREE.BoxGeometry(3, 0.2, 0.5);
        for (let i = 0; i < 2; i++) {
            const step = new THREE.Mesh(stepGeometry, porchMaterial);
            step.position.set(0, 0.1 - i * 0.1, -0.5 + i * 0.5);
            step.receiveShadow = true;
            this.group.add(step);
        }

        this.group.add(porch);
    }

    /**
     * Create terrarium display stands around the porch
     */
    createTerrariumStands() {
        const terrariumPositions = [
            { x: -4, z: -2 },
            { x: -4, z: -4 },
            { x: 4, z: -2 },
            { x: 4, z: -4 }
        ];

        terrariumPositions.forEach((pos, index) => {
            const terrarium = this.createTerrarium(index);
            terrarium.position.set(pos.x, 0, pos.z);
            this.group.add(terrarium);
            this.terrariums.push({
                mesh: terrarium,
                index: index,
                snake: null
            });
        });
    }

    /**
     * Create a single terrarium display
     */
    createTerrarium(index) {
        const terrarium = new THREE.Group();

        // Stand/table
        const standGeometry = new THREE.BoxGeometry(1.5, 0.8, 1);
        const standMaterial = new THREE.MeshStandardMaterial({
            color: 0x5D4E3A,
            roughness: 0.8
        });
        const stand = new THREE.Mesh(standGeometry, standMaterial);
        stand.position.y = 0.4;
        stand.castShadow = true;
        stand.receiveShadow = true;

        // Glass tank
        const tankGeometry = new THREE.BoxGeometry(1.3, 0.6, 0.8);
        const tankMaterial = new THREE.MeshStandardMaterial({
            color: 0x88CCBB,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1
        });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.y = 1.1;

        // Substrate (sand/bedding inside)
        const substrateGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.7);
        const substrateMaterial = new THREE.MeshStandardMaterial({
            color: 0xC4A76C,
            roughness: 1
        });
        const substrate = new THREE.Mesh(substrateGeometry, substrateMaterial);
        substrate.position.y = 0.85;

        // Small hide (decoration inside terrarium)
        const hideGeometry = new THREE.SphereGeometry(0.15, 8, 6, 0, Math.PI);
        const hideMaterial = new THREE.MeshStandardMaterial({
            color: 0x6B4423,
            roughness: 0.9
        });
        const hide = new THREE.Mesh(hideGeometry, hideMaterial);
        hide.rotation.x = Math.PI;
        hide.position.set(0.3, 0.9, 0);

        terrarium.add(stand, tank, substrate, hide);
        return terrarium;
    }

    /**
     * Create breeding station area
     */
    createBreedingStation() {
        const station = new THREE.Group();

        // Breeding table
        const tableGeometry = new THREE.BoxGeometry(3, 0.1, 2);
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.7
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.y = 1;
        table.receiveShadow = true;

        // Table legs
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4E3A });

        const legPositions = [
            { x: -1.3, z: -0.8 },
            { x: 1.3, z: -0.8 },
            { x: -1.3, z: 0.8 },
            { x: 1.3, z: 0.8 }
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos.x, 0.5, pos.z);
            station.add(leg);
        });

        // Incubator box
        const incubatorGeometry = new THREE.BoxGeometry(1, 0.4, 0.8);
        const incubatorMaterial = new THREE.MeshStandardMaterial({
            color: 0xE8E8E8,
            roughness: 0.3
        });
        const incubator = new THREE.Mesh(incubatorGeometry, incubatorMaterial);
        incubator.position.set(0, 1.3, 0);

        // Heat lamp
        const lampGeometry = new THREE.ConeGeometry(0.3, 0.4, 8);
        const lampMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            emissive: 0xFF4500,
            emissiveIntensity: 0.3
        });
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.position.set(0.8, 1.6, 0);
        lamp.rotation.z = Math.PI;

        // Small light for heat lamp effect
        const heatLight = new THREE.PointLight(0xFF6B35, 0.5, 3);
        heatLight.position.set(0.8, 1.3, 0);

        station.add(table, incubator, lamp, heatLight);
        station.position.set(6, 0, -6);
        this.group.add(station);
    }

    /**
     * Create a stone pathway from house
     */
    createPathway() {
        const stoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9
        });

        // Path stones leading from porch
        const pathPositions = [
            { x: 0, z: 1 },
            { x: 0.3, z: 2.5 },
            { x: -0.2, z: 4 },
            { x: 0.1, z: 5.5 },
            { x: -0.1, z: 7 },
            { x: 0.2, z: 8.5 }
        ];

        pathPositions.forEach(pos => {
            const stoneGeometry = new THREE.CylinderGeometry(
                0.4 + Math.random() * 0.2,
                0.5 + Math.random() * 0.2,
                0.1,
                8
            );
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            stone.position.set(pos.x, 0.05, pos.z);
            stone.rotation.y = Math.random() * Math.PI;
            stone.receiveShadow = true;
            this.group.add(stone);
        });
    }

    /**
     * Create a simple fence around the property
     */
    createFence() {
        const fenceMaterial = new THREE.MeshStandardMaterial({
            color: 0xA08060,
            roughness: 0.9
        });

        // Fence posts and rails on left and right
        const createFenceSection = (startX, startZ, endX, endZ, posts) => {
            const postGeometry = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6);
            const railGeometry = new THREE.BoxGeometry(0.05, 0.1, 2);

            for (let i = 0; i <= posts; i++) {
                const t = i / posts;
                const x = startX + (endX - startX) * t;
                const z = startZ + (endZ - startZ) * t;

                const post = new THREE.Mesh(postGeometry, fenceMaterial);
                post.position.set(x, 0.6, z);
                post.castShadow = true;
                this.group.add(post);
            }
        };

        // Left fence
        createFenceSection(-8, -10, -8, 5, 7);
        // Right fence
        createFenceSection(8, -10, 8, 5, 7);
        // Back fence
        createFenceSection(-8, -10, 8, -10, 8);
    }

    /**
     * Update terrariums with player's snakes
     */
    updateTerrariums(collection) {
        this.terrariums.forEach((terrarium, index) => {
            if (collection[index]) {
                terrarium.snake = collection[index];
                // Add visual indicator that terrarium has a snake
                this.addSnakeToTerrarium(terrarium, collection[index]);
            }
        });
    }

    /**
     * Add snake visualization to terrarium
     */
    addSnakeToTerrarium(terrarium, snake) {
        // Remove existing snake mesh if any
        const existing = terrarium.mesh.getObjectByName('snake');
        if (existing) {
            terrarium.mesh.remove(existing);
        }

        // Simple snake representation (coiled shape)
        const snakeGroup = new THREE.Group();
        snakeGroup.name = 'snake';

        const coilGeometry = new THREE.TorusGeometry(0.15, 0.05, 8, 16);
        const snakeMaterial = new THREE.MeshStandardMaterial({
            color: this.getSnakeColor(snake),
            roughness: 0.6
        });

        const coil1 = new THREE.Mesh(coilGeometry, snakeMaterial);
        coil1.rotation.x = Math.PI / 2;
        coil1.position.set(-0.2, 0.95, 0);

        const coil2 = new THREE.Mesh(coilGeometry, snakeMaterial);
        coil2.rotation.x = Math.PI / 2;
        coil2.position.set(-0.1, 0.95, 0.05);
        coil2.scale.set(0.8, 0.8, 0.8);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const head = new THREE.Mesh(headGeometry, snakeMaterial);
        head.position.set(0.05, 0.95, 0);
        head.scale.set(1.3, 1, 1);

        snakeGroup.add(coil1, coil2, head);
        terrarium.mesh.add(snakeGroup);
    }

    /**
     * Get color based on snake morphs
     */
    getSnakeColor(snake) {
        const visualGenes = snake.getVisualGenes ? snake.getVisualGenes() : [];

        if (visualGenes.includes('Albino')) return 0xFFE4B5;
        if (visualGenes.includes('Lavender')) return 0xE6E6FA;
        if (visualGenes.includes('Axanthic')) return 0x808080;
        if (visualGenes.includes('Snow')) return 0xFFFAFA;
        if (visualGenes.includes('Caramel')) return 0xD2691E;

        // Default hognose coloring
        return 0x8B7355;
    }

    /**
     * Check if player is near home
     */
    isPlayerNearHome(playerPosition) {
        const distance = playerPosition.distanceTo(this.position);
        return distance < 15;
    }

    /**
     * Get home position for teleporting
     */
    getSpawnPosition() {
        return new THREE.Vector3(0, 0, 5);
    }
}
