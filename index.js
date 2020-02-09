const fs = require('fs');
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/launchyourownchinesemissle.space/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/launchyourownchinesemissle.space/cert.pem'),
};
const app = require('http').createServer(options);
const io = require('socket.io')(app);

app.listen(443);

const ROOM_LOBBY = '1@bby';
const games = [];

io.on('connection', function (socket) {
  socket.join(ROOM_LOBBY);
  socket.on('createGame', (gameId, game) => {
    socket.leave(ROOM_LOBBY);
    socket.join(gameId);
    games.push(game);
    socket.emit('joinGame', game);
  });
  socket.on('joinGame', gameId => {
    const game = games.find(game => game.id === gameId);
    if (!game) return;
    socket.leave(ROOM_LOBBY);
    socket.join(gameId);
    socket.emit('joinGame', game);
  });
  socket.on('leaveGame', gameId => {
    socket.leave(gameId);
    socket.join(ROOM_LOBBY);
  });
  socket.on('updateGame', updatedGame => {
    const game = games.find(game => game.id === updatedGame.id);
    if (!game) return;
    Object.assign(game, updatedGame);
    socket.broadcast.to(game.id).emit('updateGame', updatedGame);
  });
  socket.on('updateMap', (gameId, i, j, value) => {
    const game = games.find(game => game.id === gameId);
    if (!game) return;
    game.map.map[i][j] = value;
    socket.broadcast.to(gameId).emit('updateMap', i, j, value);
  });
  socket.on('updateUser', (gameId, updatedUser) => {
    const game = games.find(game => game.id === gameId);
    if (!game) return;
    const user = game.users.find(user => user.uuid === updatedUser.uuid);
    if (!user) return;
    Object.assign(user, updatedUser);
    socket.broadcast.to(gameId).emit('updateUser', updatedUser);
  });
  socket.on('updateTeam', (gameId, updatedTeam) => {
    const game = games.find(game => game.id === gameId);
    if (!game) return;
    const team = game.teams.find(team => team.id === updatedTeam.id);
    if (!team) return;
    Object.assign(team, updatedTeam);
    socket.broadcast.to(gameId).emit('updateTeam', updatedTeam);
  });
  setInterval(() => {
    const gameIds = games.map(game => game.id);
    io.to(ROOM_LOBBY).emit('listGames', gameIds);
  }, 1000);
});