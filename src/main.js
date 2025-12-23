/**
 * Snake Breeder: Hognose Edition
 * Main Entry Point
 */

import { Game } from './core/Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🐍 Snake Breeder: Initializing...');

    try {
        // Initialize the game
        const game = new Game();
        await game.init();

        // Start the game loop
        game.start();

        console.log('🐍 Snake Breeder: Ready!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});
