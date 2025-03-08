import { io } from 'socket.io-client';

export function initSocket() {
    const socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    // Game state handlers
    socket.on('game_state_update', (data) => {
        // Handle game state updates
    });

    socket.on('unit_moved', (data) => {
        // Handle unit movement from other players
    });

    socket.on('artillery_fired', (data) => {
        // Handle artillery fire from other players
    });

    socket.on('unit_spawned', (data) => {
        // Handle unit spawning from other players
    });

    return socket;
}
