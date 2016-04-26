function sendPlayerShipData (data){
    var socket = io.connect();
    //console.log(data);
    socket.emit('player_ship_data', data);
};

function sendPlayerFireData (data){
    var socket = io.connect();
    //console.log(data);
    socket.emit('player_fire_data', data);
};

function playerShipSunk(data) {
	var socket = io.connect();
	socket.emit('players_ship_sunk', data);
}

function defeatedSendToServer(data) {
	var socket = io.connect();
	socket.emit('defeatToServer', data);
}