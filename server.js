var express = require('express'),
    http    = require('http'),
    game    = express(),
    server  = http.createServer(game),
    port    = 8080;

server.listen(port);

game.use('/static', express.static('static'));

//Set up index
game.get('/', function(req, res)
{
    res.sendFile(__dirname + '/index.html');
    //console.log(__dirname);
});

// Log that the servers running
console.log("Server running with port number:" + port);

var counter = 0; //counter for number of socket connections made
//to ensure compareData is called at the appropriate time

var player1ShipData = new Array();
var player2ShipData = new Array();

var player1FireData = [];
var player2FireData = [];

var blockSize;

var turnCounter = 0;

var user1 = {
    username: ' ',
    socketID: ' ',
    wins: 3,
    losses: 1,
    available: true,    //player 1 is available
    ready: false        //client is ready for next turn
};

var user2 = {
    username: ' ',
    socketID: ' ',
    wins: 2,
    losses: 4,
    available: true,    //player 2 is available
    ready: false        //client is ready for next turn
};

var io = require('socket.io').listen(server);

// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// RECEIVE FROM CLIENT
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

io.sockets.on('connection', function(socket)
{

    //when client logs in, server assigns the user player 1 or 2
    socket.on('add player', function(data)
    { //receives message from client to add a new user
        //data is username

        if (data==user1.username)       //user1 is starting another game
        {
            user1.available = false;
            user1.ready = false;
            console.log("added player 1: " + user1.username + "\n");
        }
        else if (data==user2.username)  //user2 is starting another game
        {
            user2.available = false;
            user2.ready = false;
            console.log("added player 2: " + user2.username + "\n");
        }
        else if (user1.available)       //user1 is available, give this user to the requesting client
        {
            user1.available = false;
            user1.username = data;
            user1.socketID = socket.id;

            console.log("added player 1: " + user1.username + "\n");
        }
        else if (user2.available)       //user2 is available, give this user to the requesting client
        {
            user2.available = false;
            user2.username = data;
            user2.socketID = socket.id;

            console.log("added player 2: " + user2.username + "\n");
        }
        else 
        {
            console.log("USER1 AND USER2 ARE NOT AVAILABLE");
        }
        
        if(!user1.available && !user2.available)    //two clients are connected, start the game
        {
            var usernames = {
                user1: user1.username,
                user2: user2.username
            }

            io.sockets.emit('usernames', usernames);
        }
    });

    socket.on('client_data', function(data)
    {
        process.stdout.write(data.letter);
    });

    socket.on('player_ship_data', function(data)
    {
        if (data.username == user1.username)
        {
            turnCounter++;
            var temp = [];
            for (var i = 0; i < data.ships.length; i++)
            {
                var obj = [];
                obj = JSON.parse(data.ships[i]);
                temp.push(obj);
            }
            player1ShipData = consolidateArray(temp);

            counter++;
            checkCounter();
        }
        else if (data.username == user2.username)
        {
            turnCounter++;
            var temp = [];
            for (var i = 0; i < data.ships.length; i++)
            {
                var obj = [];
                obj = JSON.parse(data.ships[i]);
                temp.push(obj);
            }
            player2ShipData = consolidateArray(temp);

            counter++;
            checkCounter();
        }
    });

    //server receives player fire data from the client
    socket.on('player_fire_data', function(data)
    {
        if (data.username == user1.username)
        {
            for (var i = 0; i < data.aims.length; i++)
            {
                var obj = [];
                obj = JSON.parse(data.aims[i]);
                player1FireData.push(obj);
            }

            counter++;
            checkCounter();
        }
        else if (data.username == user2.username)
        {
            for (var i = 0; i < data.aims.length; i++)
            {
                var obj = [];
                obj = JSON.parse(data.aims[i]);
                player2FireData.push(obj);
            }
            counter++;
            checkCounter();
        }

    });

    //when client clicks "Ready" button after placing their ships or when
    //client sends this message after it has received and computed results of the previous turn
    socket.on('client ready next turn', function(data)
    {
        //set user.ready for data
        if (data == user1.username)
        {
            user1.ready = true;
        }
        else if (data == user2.username)
        {
            user2.ready = true;
        }
        else
        {
            console.log("ERROR: INVALID USERNAME - " + data + " - client ready next turn");
        }

        //check if both users are ready
        if (user1.ready == true && user2.ready == true)
        {
            user1.ready = false;
            user2.ready = false;

            io.sockets.emit('start timer', ''); //restart timer
        }
    });

    //when client clicks "End Turn" button, set the player to "Ready"
    socket.on('client ready stop timer', function(data)
    {
        //set user.ready for data
        if (data == user1.username)
        {
            user1.ready = true;
            io.sockets.emit('user is ready', user1.username);
        }
        else if (data == user2.username)
        {
            user2.ready = true;
            io.sockets.emit('user is ready', user2.username);
        }
        else
        {
            console.log("ERROR: INVALID USERNAME - client ready stop timer");
        }

        //check if both users are ready
        if (user1.ready == true && user2.ready == true)
        {
            user1.ready = false;
            user2.ready = false;

            io.sockets.emit('stop timer', ''); //restart timer
        }
    });

    socket.on('timer ends', function(data)
    {
        user1.ready = false;
        user2.ready = false;
    });

    //when a client sends a message in the chat box server sends message to all clients
    socket.on('send message', function(data)
    {
        io.sockets.emit('new message', data);
    });

    socket.on('players_ship_sunk', function(data)
    {
        /*
        	format of data
        	message: message,
        	sendFrom: username
        */
        io.sockets.emit('ship_sunk', data);
    });

    socket.on('defeatToServer', function(data)
    {
        /* 
        	format of data
        	winner : username 
        */
        
        io.sockets.emit('defeat', data);
    });
    
    socket.on('game over main menu', function(data)
    {
        /*
            format of data
            username : username
        */
        
        if(data == user1.username)
        {
            user1.available = true;
            user1.username = ' ';
        }
        else if(data == user2.username)
        {
            user2.available = true;
            user2.username = ' ';
        }
    });
    
    socket.on('disconnect', function() 
    {
        if(socket.id == user1.socketID) 
        {
            user1.available = true;
            console.log("user1 is disconnecting: " + socket.id);
        }
        else if(socket.id == user2.socketID)
        {
            user2.available = true;
            console.log("user2 is disconnecting: " + socket.id);
        }
    });
});

// compares the ships with the opponent's fires
function compareData()
{
    //Compare Player 1's ships with Player 2's fires
    var player2Fires = [];

    var player2Fire = new Object();
    player2Fire.xCoordinate = 0;
    player2Fire.yCoordinate = 0;
    player2Fire.result = user2.username;

    player2Fires.push(player2Fire);

    for (var i = 0; i < player2FireData.length; i++) //iterate through player1's fires
    {
        var fireResultHit = false; //keeps track of if the fire was a hit
        var fireResultOneAway = false;

        var fire = new Object();
        fire.xCoordinate = player2FireData[i].xCoordinate;
        fire.yCoordinate = player2FireData[i].yCoordinate;
        fire.result = '';

        for (var j = 0; j < player1ShipData.length; j++) //iterate through player2's ships
        {
            //checks if fire is a hit with current ship
            if (player1ShipData[j].xCoordinate == player2FireData[i].xCoordinate && player1ShipData[j].yCoordinate == player2FireData[i].yCoordinate)
            {
                fireResultHit = true;
                fire.result = 'hit';

                break; //break from loop once hit was found
            }
            else
            {
                for (var a = -1; a < 2; a++)
                {
                    for (var b = -1; b < 2; b++)
                    {
                        if ((player1ShipData[j].xCoordinate + a) == player2FireData[i].xCoordinate && (player1ShipData[j].yCoordinate + b) == player2FireData[i].yCoordinate)
                        {
                            fireResultOneAway = true;
                            fire.result = 'oneAway';

                            break; //break from loop once one away was found
                        }
                    }
                }
            }
        }

        if (!fireResultHit && !fireResultOneAway) //if false, fire was a miss
        {
            fire.result = 'miss';
        }

        player2Fires.push(fire);
    }

    // -----------------------------------------------------

    //Compare Player 2's ships with Player 1's fires
    var player1Fires = [];

    var player1Fire = new Object();
    player1Fire.xCoordinate = 0;
    player1Fire.yCoordinate = 0;
    player1Fire.result = user1.username;

    player1Fires.push(player1Fire);

    for (var i = 0; i < player1FireData.length; i++) //iterate through player1's fires
    {
        var fireResultHit = false; //keeps track of if the fire was a hit
        var fireResultOneAway = false;

        var fire = new Object();
        fire.xCoordinate = player1FireData[i].xCoordinate;
        fire.yCoordinate = player1FireData[i].yCoordinate;
        fire.result = '';

        for (var j = 0; j < player2ShipData.length; j++) //iterate through player2's ships
        {
            //checks if fire is a hit with current ship
            if (player2ShipData[j].xCoordinate == player1FireData[i].xCoordinate && player2ShipData[j].yCoordinate == player1FireData[i].yCoordinate)
            {
                fireResultHit = true;
                fire.result = 'hit'

                break; //break from loop once hit was found
            }
            else
            {
                for (var a = -1; a < 2; a++)
                {
                    for (var b = -1; b < 2; b++)
                    {
                        if ((player2ShipData[j].xCoordinate + a) == player1FireData[i].xCoordinate && (player2ShipData[j].yCoordinate + b) == player1FireData[i].yCoordinate)
                        {
                            fireResultOneAway = true;
                            fire.result = 'oneAway';

                            break; //break from loop once hit was found
                        }
                    }
                }
            }
        }

        if (!fireResultHit && !fireResultOneAway) //if false, fire was a miss
        {
            fire.result = 'miss';
        }

        player1Fires.push(fire);

    }

    // -----------------------------------------------------

    io.sockets.emit('fire data', JSON.stringify(player1Fires)); //sends player 1's fires to player 1 and 2 clients
    io.sockets.emit('fire data', JSON.stringify(player2Fires)); //sends player 2's fires to player 1 and 2 clients
}

function checkCounter()
{
    if (counter == 4)
    {
        compareData();
        player1FireData = [];
        player2FireData = [];
        counter = 0;
    }
}

function consolidateArray(arr)
{
    var temp = [];
    for (var i = 0; i < arr.length; i++)
    {
        for (var j = 0; j < arr[i].length; j++)
        {
            temp.push(arr[i][j]);
        }
    }
    return temp;

}
