const activeGameStates = new Map();

function handleGameState(io, socket, data) {
    const { gameId, type, payload } = data;
    
    // Get or create game state
    let gameState = activeGameStates.get(gameId);
    if (!gameState) {
        gameState = createInitialGameState();
        activeGameStates.set(gameId, gameState);
    }

    switch (type) {
        case 'UNIT_SPAWN':
            handleUnitSpawn(gameState, payload);
            break;
        case 'UNIT_MOVE':
            handleUnitMove(gameState, payload);
            break;
        case 'ARTILLERY_FIRE':
            handleArtilleryFire(gameState, payload);
            break;
        case 'UNIT_ATTACK':
            handleUnitAttack(gameState, payload);
            break;
        case 'RESOURCE_UPDATE':
            handleResourceUpdate(gameState, payload);
            break;
    }

    // Broadcast updated state to all players in the game
    io.to(gameId).emit('game_state_update', {
        type: type,
        state: gameState
    });

    // Check win conditions
    checkWinConditions(io, gameId, gameState);
}

function createInitialGameState() {
    return {
        units: [],
        resources: {
            player1: 500,
            player2: 500
        },
        bases: {
            player1: { health: 1000, position: { x: -400, z: 0 } },
            player2: { health: 1000, position: { x: 400, z: 0 } }
        },
        terrain: {
            // Terrain state will be synced from host player
            seed: Math.random()
        }
    };
}

function handleUnitSpawn(gameState, { playerId, unit }) {
    const cost = getUnitCost(unit.type);
    if (gameState.resources[playerId] >= cost) {
        gameState.resources[playerId] -= cost;
        gameState.units.push({
            id: `unit_${Date.now()}_${Math.random()}`,
            ...unit
        });
    }
}

function handleUnitMove(gameState, { unitId, position }) {
    const unit = gameState.units.find(u => u.id === unitId);
    if (unit) {
        unit.position = position;
    }
}

function handleArtilleryFire(gameState, { playerId, angle, power, position }) {
    // Artillery fire is mainly handled client-side for physics
    // Server just validates and syncs the event
    return true;
}

function handleUnitAttack(gameState, { attackerId, targetId }) {
    const attacker = gameState.units.find(u => u.id === attackerId);
    const target = gameState.units.find(u => u.id === targetId);
    
    if (attacker && target) {
        const damage = calculateCombatDamage(attacker, target);
        target.health -= damage;
        
        if (target.health <= 0) {
            gameState.units = gameState.units.filter(u => u.id !== targetId);
        }
    }
}

function handleResourceUpdate(gameState, { playerId, amount }) {
    if (gameState.resources[playerId] !== undefined) {
        gameState.resources[playerId] = amount;
    }
}

function checkWinConditions(io, gameId, gameState) {
    const { bases } = gameState;
    
    if (bases.player1.health <= 0) {
        io.to(gameId).emit('game_over', { winner: 'player2' });
        activeGameStates.delete(gameId);
    } else if (bases.player2.health <= 0) {
        io.to(gameId).emit('game_over', { winner: 'player1' });
        activeGameStates.delete(gameId);
    }
}

function getUnitCost(type) {
    const costs = {
        infantry: 50,
        tank: 150,
        helicopter: 200
    };
    return costs[type] || 0;
}

function calculateCombatDamage(attacker, target) {
    // Implement rock-paper-scissors advantages
    const advantages = {
        infantry: 'helicopter',
        tank: 'infantry',
        helicopter: 'tank'
    };

    const attackRoll = Math.floor(Math.random() * 6) + 1;
    const defenseRoll = Math.floor(Math.random() * 6) + 1;
    
    let damage = Math.max(0, (attackRoll - defenseRoll) * 20);
    
    // Apply advantage/disadvantage modifiers
    if (advantages[attacker.type] === target.type) {
        damage *= 1.5; // 50% bonus damage
    } else if (advantages[target.type] === attacker.type) {
        damage *= 0.7; // 30% reduced damage
    }
    
    return Math.floor(damage);
}

module.exports = {
    handleGameState
};
