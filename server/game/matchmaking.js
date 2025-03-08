const activeGames = new Map();
const waitingPlayers = new Set();

function initializeMatchmaking(socket, data) {
    const playerId = socket.id;
    
    // Add player to waiting queue
    waitingPlayers.add({
        id: playerId,
        socket: socket,
        data: data
    });

    // Check for available match
    tryCreateMatch();
}

function tryCreateMatch() {
    if (waitingPlayers.size >= 2) {
        const players = Array.from(waitingPlayers).slice(0, 2);
        const gameId = `game_${Date.now()}`;

        // Create game session
        const game = {
            id: gameId,
            players: players,
            state: {
                units: [],
                resources: {
                    [players[0].id]: 500,
                    [players[1].id]: 500
                }
            }
        };

        // Remove players from waiting queue
        players.forEach(player => {
            waitingPlayers.delete(player);
            player.socket.join(gameId);
        });

        // Store game session
        activeGames.set(gameId, game);

        // Notify players
        players.forEach((player, index) => {
            player.socket.emit('game_start', {
                gameId: gameId,
                playerIndex: index,
                opponent: players[1 - index].data.username
            });
        });
    }
}

function endGame(gameId, winnerId) {
    const game = activeGames.get(gameId);
    if (game) {
        game.players.forEach(player => {
            player.socket.emit('game_end', {
                winner: winnerId === player.id
            });
            player.socket.leave(gameId);
        });
        activeGames.delete(gameId);
    }
}

module.exports = {
    initializeMatchmaking,
    endGame
};
