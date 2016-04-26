var blockSize;

window.onload = function()
{
    var socket = io.connect(); //socket to send/recieve messages with server

    var username;

    //----MENU SCREEN----------------------------------------------------------------------	
    //menu is opened when web page is opened

    //show menu screen; rules, login, and game screens and hidden by default in the css.  they are made visible as we go through the screens
	$('#menuScreen').show();
	$('#loginScreen').hide();
	$('#rulesScreen').hide();
	$('#gameScreen').hide();
    var startButton = document.getElementById("startButton");
    var rulesButton = document.getElementById("rulesButton");

    //"Start" button clicked event listener
    if (startButton.addEventListener)
    {
        startButton.addEventListener("click", openLogin, false);
    }

    //"Rules" button clicked event listener
    if (rulesButton.addEventListener)
    {
        rulesButton.addEventListener("click", openRules, false);
    }

    //when "Start" button is clicked Login screen is opened, Menu screen is hidden
    function openLogin()
    {
        //hides menu screen, shows login screen
		$('#menuScreen').hide();
		$('#loginScreen').show();
    }

    //when "Rules" button is clicked Rules screen is opened, Menu screen is hidden
    function openRules()
    {
        //hides menu screen, shows rules screen
		$('#menuScreen').hide();
		$('#rulesScreen').show();
    }

    //----LOGIN SCREEN----------------------------------------------------------------------	
    //login screen is opened from the menu screen when the "Start" button is clicked

    var loginButton = document.getElementById("loginButton");
    var loginBackButton = document.getElementById("loginBackButton");

    //"Login" button clicked event listener
    if (loginButton.addEventListener)
    {
        loginButton.addEventListener("click", addPlayer, false);
    }

    //"Back" button clicked event listener
    if (loginBackButton.addEventListener)
    {
        loginBackButton.addEventListener("click", openMenu, false);
    }

    //when "Login" button is clicked player is added to the game
    function addPlayer()
    {
        username = $('#usernameInput').val().trim();
		
		if(!username) //username == null || username == '')
		{
			alert("You must declare a username.  Try again");
			return;
		}

        socket.emit('add player', username);

        document.getElementById("playerUserName").innerHTML = username;
        document.getElementById("opponentUserName").innerHTML = "waiting...";

        //hides Login screen, shows Game screen
		$('#loginScreen').hide();
		$('#gameScreen').show();
		game();
    }

    //----RULES SCREEN----------------------------------------------------------------------
    //rules screen is opened from menu screen when the "Rules" button is clicked

    var rulesBackButton = document.getElementById("rulesBackButton");

    $('#rulesText').load("/static/RulesoftheGame.txt");
	$('#rulesTextDiv').height($(window).height() - $('#rulesHeader').height());

    //"Back" button clicked event listener
    if (rulesBackButton.addEventListener)
    {
        rulesBackButton.addEventListener("click", openMenu, false);
    }

    //when "Back" button is clicked Menu screen is opened, login/rules screen is hidden
    function openMenu()
    {
        //hides login/rules screen, shows menu screen
		$('#loginScreen').hide();
		$('#rulesScreen').hide();
		$('#menuScreen').show();
    }

    //----GAME SCREEN------------------------------------------------------------------------
    //game screen is opened after player has entered a username
	
	function game()
	{
		var marginFix = 16;

		var windowSize = playerBoard.clientWidth;

		var PlayerGame = new Phaser.Game(windowSize, windowSize, Phaser.AUTO, 'playerBoard',
		{
			preload: preloadPlayerBoard,
			create: createPlayerBoard
		});

		var OpponentGame = new Phaser.Game(windowSize, windowSize, Phaser.AUTO, 'opponentBoard',
		{
			preload: preloadOpponentBoard,
			create: createOpponentBoard
		});

		blockSize = windowSize / 16;  //relative size of the grid
		var spriteWidth = 16;         //number of spaces from left to right
		var spriteHeight = 16;        //number of spaces from top to bottom

		var gridSize = 16 * blockSize;
		var spriteSize = blockSize / 201;

		var bounds;

		var canvasZoom = 16; //??????? need this for the firing on click atm, not sure why

		var spriteCoordArray = [];    //array of coordinates for the selected boat
        
        //the sprite that it currently clicked (selected) for moves
		var selectedSprite = {
			sprite: selectedSprite,
			size: 0,
			coordArray: spriteCoordArray
		}; 
        
        //the five boat sprites
		var ptBoatSprite;
		var submarineSprite;
		var destroyerSprite;
		var battleshipSprite;
		var aircraftCarrierSprite;
        
		var groupOfBoats;             //a group of all 5 boat sprites
		var arrayOfBoats = [];        //array of 5 boat functions (objects)
        
		var playerMatrix;
		var opponentMatrix;

		//need to check if an opponent hit overlaps with a ship sprite on return. If so, remove that sprite's ability to move.
		var ptBoatIsHit = false;
		var destroyerIsHit = false;
		var submarineIsHit = false;
		var battleshipIsHit = false;
		var aircraftCarrierIsHit = false;
		var arrayIsHit = [ptBoatIsHit, destroyerIsHit, submarineIsHit, battleshipIsHit, aircraftCarrierIsHit];

		var aimSprite = [];       //array of "aims" at the opponent for the current turn

		//array of "one away" sprites on the opponent's/player's board
		opponentOneAwaySprite = [];
		playerOneAwaySprite = [];

		//array of "hit" sprites on the opponent's/player's board
		opponentHitSprite = [];
		opponentMissSprite = [];

		var shipArray = [];           //JSON data of 5 ships (length, coordinates, key)
		var boatSpriteArray = [];     //array of 5 ship sprites
		var arrayOfHits = [];         //array of board coordinates that have been "hit"
		var arrayOfMisses = [];       //array of board coordinates that have been "miss"

		var isDown = false;

		var turnNumber = 1;
		var interval;     //the timer interval

		var actionCounter;       //number of actions available on the current turn
		var totalActions;        //number of actions allocated for the current turn

		var numShipsSunk = 0;

		var indexShipSunk = [];
        
        //audio variables
        var opponentBattleShipMovementAmbient;
        var opponentExplosionMetal;
        var opponentExplosionMetalGverb;
        var opponentGunShot;
        var opponentGunShotGverb;
        var opponentSplash;
        var opponentSplashGverb;
        var opponentWaterSurfaceExplosion01;
        var opponentWaterSurfaceExplosion02;
        var opponentWaterSurfaceExplosion03;
        var opponentWaterSurfaceExplosion04;
        var opponentWaterSurfaceExplosion05;
        var opponentWaterSurfaceExplosion06;
        var opponentWaterSurfaceExplosion07;
        var opponentWaterSurfaceExplosion08;
        var opponentMissAudio;
        var opponentAimAudio;
        var opponentHitAudio;

		//----CHAT BOX--------------------------------------------
		//functions for chat box and message input field

		var sendMessageButton = document.getElementById("chatButton");

		//"Send Message" button clicked event listener
		if (sendMessageButton.addEventListener)
		{
			sendMessageButton.addEventListener("click", sendMessage, false);
		}

		//sends message to the server when client clicks "Send Message" button
		function sendMessage()
		{
			var messageInput = $('#messageInput').val().trim();
			$('#messageInput').val("");
			
			if(!messageInput)
			{
				return;
			}

			var message = username + ": " + messageInput;
			socket.emit('send message', message);
		}

		//receives message from the server and displays it in the chat box
		socket.on('new message', function(data)
		{
			// if chat box is empty or contains only white-space
			if (!$.trim($("#chatBox").val()))
			{
				$("#chatBox").val(data);
			}
			else
			{
				$('#chatBox').val($('#chatBox').val() + "\n" + data);
			}
		});
		//----END CHAT BOX-----------------------------------------

		//----CLIENT READY BUTTON--------------------------------------------
		//functions for "End Turn" and "Start Game" button

		var clientReadyButton = document.getElementById("readyButton");

		//"Start Game" and "End Turn" button clicked event listener
		if (clientReadyButton.addEventListener)
		{
			clientReadyButton.addEventListener("click", clientReady, false);
		}

		//when "Start Game" and "End Turn" button are clicked, notify server
		function clientReady()
		{
			//first turn, start next turn
			if (turnNumber == 1)
			{
				socket.emit('client ready next turn', username);
			}
			//every other turn, stop timer and start next turn
			else
			{
				socket.emit('client ready stop timer', username);
			}
		}
		//----END CLIENT READY BUTTON-----------------------------------------

		//----TIMER--------------------------------------------------------
		//starting and stopping timer

		//server sends message to client to start timer
		socket.on('start timer', function(data)
		{
			//on first turn, change button label to "End Turn"
			if (turnNumber == 1)
			{
				$("#readyButton").val("End Turn");
				clearNotificationBox(); //clear out 'set your ships'
			}

			//start timer
			startTimer();
		});

		//server sends message to client to stop timer
		socket.on('stop timer', function(data)
		{
			//stop timer
			stopTimer();
		});

		//starts timer and displays remaining time on screen
		function startTimer()
		{
			var setTimer;
			calculateActionNumber();

			//modifies timer on screen
			$(document).ready(function()
			{
				setTimer = 60;
				display = document.querySelector('#time');
			});

			var timer = setTimer,
				minutes, seconds;

			if (turnNumber == 1)
			{
				updateShipLocationToMatrix();
			}
			turnNumber++;

			//sets interval of timer
			interval = setInterval(function()
			{
				minutes = parseInt(timer / 60, 10);
				seconds = parseInt(timer % 60, 10);

				minutes = minutes < 10 ? "0" + minutes : minutes;
				seconds = seconds < 10 ? "0" + seconds : seconds;

				display.textContent = minutes + ":" + seconds;

				//stop timer when it reaches 0
				if (--timer < 0)
				{
					stopTimer();
				}
			}, 1000);
		}

		//stops timer when time runs out or when both clients are ready
		function stopTimer()
		{
			clearInterval(interval);

			//update boards with new data
			updatePlayerBoard();
			updateOpponentBoard();

			//notify server timer ends
			socket.emit('timer ends', '');
		}
		//----END TIMER--------------------------------------------------------

		// ----SERVER TO CLIENT MESSAGES---------------------------------------------

		//server sends client the usernames of the two players after the second player has connected
		socket.on('usernames', function(data)
		{
			/*
			format of data
				user1: player 1's username
				user2: player 2's username
			*/

			if (data.user1 == username)
			{
				document.getElementById("opponentUserName").innerHTML = data.user2;
			}
			else if (data.user2 == username)
			{
				document.getElementById("opponentUserName").innerHTML = data.user1;
			}
		});

		socket.on('user is ready', function(data)
		{
			if (data != username)
			{
				//OpponentGame.debug.text("Opponent is Ready!", 100, 100);
				//ADD THIS TO THE NOTIFICATION BOX LATER
			}
		});

		socket.on('ship_sunk', function(data)
		{
			/*
				format of data
				message: message,
				sendFrom: username
			*/

			if (data.sendFrom != username)
			{
				//console.log('ship sunk; trying to send to notification box');
				updateNotificationBox(data.message);

				numShipsSunk++; //use this to then know who won!!!
				if (numShipsSunk == 5)
				{
					//console.log('you won!!!');
					$("#victor-defeat-text").text("VICTORY");
					$(".endOfGame").show();

					clearInterval(interval);	//stop the clock
                    socket.emit('timer ends', '');
                    
					disablePlayerEventListeners();	//lock player board
					disableOpponentEventListeners();	//lock opponent board

					//need to send message to other player that they lost
					var data;

					data = {
						winner: username
					};

					defeatedSendToServer(data);

					//also need to stop timer and freeze player boards
				}
			}
		});

		socket.on('defeat', function(data)
		{
			/* 
				format of data
				winner : username 
			*/

			totalActions = 0;

			if (data.winner != username)
			{
				$("#victor-defeat-text").text("DEFEAT");
				$(".endOfGame").show();

				clearInterval(interval);	//stop the clock
				disablePlayerEventListeners();	//lock player board
				disableOpponentEventListeners();	//lock opponent board
			}
		});
        //----END SERVER TO CLIENT MESSAGES---------------------------------------------
        
        //----ACTIONS---------------------------------------------------------------
		function calculateActionNumber()
		{ //new function for calculating number of actions per turn

			enablePlayerEventListeners();
			if (turnNumber != 1)
			{
				enableOpponentEventListeners();
			}
			if (turnNumber >= 14)
			{
				actionCounter = 10;
			}
			else
			{
				actionCounter = Math.floor(((turnNumber - 1) / 2) + 4); //will work with Math.floor handling var's like ints
			}

			totalActions = actionCounter;
			updateActionCircles(actionCounter, totalActions);
		}

		function isActionValid(value)
		{ //check this in an if condition before using updateActionCounter()

			if (actionCounter - value < 0)
			{
				return false;
			}
			return true;
		}

		function updateActionCounter(value)
		{
			actionCounter -= value;

			if (turnNumber > 1)
			{
				updateActionCircles(actionCounter, totalActions);
			}

			if (actionCounter == 0)
			{
				disablePlayerEventListeners();
				disableOpponentEventListeners();
			}
		}
        //----END ACTIONS---------------------------------------------------------------

        //----SPRITE FUNCTIONS (THESE SHOULD BE MOVED ELSEWHERE------------------------------
		function onDragStart(sprite)
		{
			dragStartCoordinates = new Boardcoordinates(sprite.x, sprite.y);
			PlayerGame.debug.text("", 10, 20);
		}

		function onDragStop(sprite)
		{

			for (var i = 0; i < boatSpriteArray.length; i++)
			{
				if (sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
				{
					if (Phaser.Rectangle.intersects(sprite.getBounds(), boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
					{
						//Set the selected sprite back to it's origial position before moving it
						sprite.x = dragStartCoordinates.xCoordinate;
						sprite.y = dragStartCoordinates.yCoordinate;
						//PlayerGame.debug.text("Cannot overlap ships!", 10,20);
						updateNotificationBox("Cannot overlap ships!");
						return;
					}
				}
			}

			for (var i = 0; i < arrayOfMisses.length; i++)
			{
				if (Phaser.Rectangle.intersects(sprite.getBounds(), arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other missed sprite
				{
					//Set the selected sprite back to it's origial position before moving it
					sprite.x = dragStartCoordinates.xCoordinate;
					sprite.y = dragStartCoordinates.yCoordinate;
					//PlayerGame.debug.text("Invalid Move!", 10,20);
					updateNotificationBox("Invalid Move!");
					return;
				}
			}

			for (var i = 0; i < playerOneAwaySprite.length; i++)
			{
				if (Phaser.Rectangle.intersects(sprite.getBounds(), playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other missed sprite
				{
					//Set the selected sprite back to it's origial position before moving it
					sprite.x = dragStartCoordinates.xCoordinate;
					sprite.y = dragStartCoordinates.yCoordinate;
					//PlayerGame.debug.text("Invalid Move!", 10,20);
					updateNotificationBox("Invalid Move!");
					return;
				}
			}
			//spriteToBoatUpdate(sprite);
			moveBoat(sprite);
			updateShipLocationToMatrix();
		}

		function spriteToBoatUpdate(sprite)
		{
			var spriteLength;
			var spriteBC = new Boardcoordinates(sprite.x, sprite.y);
			var spriteKey = sprite.key;
			var firstTwoChar = spriteKey.charAt(0).concat(spriteKey.charAt(1));
			if (firstTwoChar == 'pa')
			{
				spriteLength = 2;
				ptBoat = new Boat(spriteLength, spriteBC, spriteKey);
			}
			else if (firstTwoChar == 'de')
			{
				spriteLength = 3;
				destroyerBoat = new Boat(spriteLength, spriteBC, spriteKey);
			}
			else if (firstTwoChar == 'su')
			{
				spriteLength = 3;
				submarineBoat = new Boat(spriteLength, spriteBC, spriteKey);
			}
			else if (firstTwoChar == 'ba')
			{
				spriteLength = 4;
				battleshipBoat = new Boat(spriteLength, spriteBC, spriteKey);
			}
			else if (firstTwoChar == 'ai')
			{
				spriteLength = 5;
				aircraftCarrierBoat = new Boat(spriteLength, spriteBC, spriteKey);
			}
			else
			{
				console.log('SpriteToBoatUpdate failed');
			}
		}
        //----END SPRITE FUNCTIONS (THESE SHOULD BE MOVED ELSEWHERE------------------------------

        //----FIRING------------------------------------------------------------------

		//checking if boat was sunk
		function checkBoatSunk()
		{
			var tempShipArray = []; //local copy of shipArray

			for (var x = 0; x < shipArray.length; x++) //un-JSON shipArray and add to tempShipArray
			{
				var obj = [];
				obj = JSON.parse(shipArray[x]);
				tempShipArray.push(obj);
			}

			//console.log('before searching for sinks' + JSON.stringify(tempShipArray));

			for (var y = 0; y < indexShipSunk.length; y++)
			{
				var indexAlreadySunk = indexShipSunk[y];
				tempShipArray[indexAlreadySunk] = "sunk";
				console.log('index ' + y + ' has ' + indexShipSunk[y] + ' in it');
			}

			//console.log('after removing sunk ships' + JSON.stringify(tempShipArray));

			for (var i = 0; i < tempShipArray.length; i++) //number of ships that haven't been sunk yet
			{
				if(tempShipArray[i] == "sunk")
				{
					continue;	//skipping sunk ships data
				}
				var shipSize = tempShipArray[i].length;
				var counter = 0;
				for (var j = 0; j < tempShipArray[i].length; j++) //size of each individual ship
				{
					var xc = tempShipArray[i][j].xCoordinate;
					var yc = tempShipArray[i][j].yCoordinate;

					if (playerMatrix[xc][yc] == 3)
					{
						counter++;
						if (counter == shipSize)
						{
							var message = "Ship of size " + shipSize + " sunk!!!";

							indexShipSunk.push(i);

							var dataToSend = {
								message: message,
								sendFrom: username
							};
							playerShipSunk(dataToSend);

						}
					}
				}
			}
		}

        function onDown(pointer)
		{
			isDown = true;
			if (turnNumber != 1)
			{
				fireOpponentBoard(pointer);
			}
		}

		function onUp()
		{
			isDown = false;
		}
        
		function fireOpponentBoard(pointer)
		{
			var x = OpponentGame.math.snapToFloor(pointer.x - canvasSprite.x, blockSize) / blockSize;
			var y = OpponentGame.math.snapToFloor(pointer.y - canvasSprite.y, blockSize) / blockSize;

			if (x < 0 || x >= spriteWidth || y < 0 || y >= spriteHeight)
			{
				return;
			}

			if (!isDown)
			{
				return;
			}

			var isFreeSpace = true;
			for (i = 0; i < opponentHitSprite.length; i++) //check list of Hit Sprites
			{
				if (opponentHitSprite[i].x / blockSize == x && opponentHitSprite[i].y / blockSize == y)
				{
					return;
				}
			}

			for (i = 0; i < opponentMissSprite.length; i++) //check list of Miss Sprites
			{
				if (opponentMissSprite[i].x / blockSize == x && opponentMissSprite[i].y / blockSize == y)
				{
					return;
				}
			}

			for (i = 0; i < opponentOneAwaySprite.length; i++) //check list of One Away Sprites
			{
				if (opponentOneAwaySprite[i].x / blockSize == x && opponentOneAwaySprite[i].y / blockSize == y)
				{
					return;
				}
			}

			for (i = 0; i < aimSprite.length; i++) //check list of One Away Sprites
			{
				if (aimSprite[i].x / blockSize == x && aimSprite[i].y / blockSize == y)
				{
					return;
				}
			}

			if (isActionValid(1)) //check to see if the move is even valid
			{
				updateActionCounter(1);
				addOpponentAim(x, y);
			}
		}
        //----END FIRING--------------------------------------------------------------
        
        //----MOVE BOAT------------------------------------------------------------
		function moveBoat(sprite)
		{ //arguments not guaranteed, just creating the function

			var movementCost = calculateMovementCost(sprite);
			
			if (isActionValid(movementCost)) //check to see if the move is even valid
			{
				updateActionCounter(movementCost);
				updateShipLocationToMatrix(); //TESTING IF THIS SHOULD BE HERE AAAAAAAAAAAAAAA
			}
			else
			{
				sprite.x = dragStartCoordinates.xCoordinate;
				sprite.y = dragStartCoordinates.yCoordinate;
				//should probably pass a notifcation to the notification box here ******************
			}
		}

		//this will be our algorithm for calculating the cost of moving a ship
		function calculateMovementCost(sprite)
		{ //arguments not guaranteed, just creating the function

			var convertedMatrix = convertMatrixForLeesAlgorithm(sprite);

			if (convertedMatrix == 0)
			{ //if the person places the boat right back down, return 0
				return 0;
			}

			return setUpSD(convertedMatrix); //this function calls lee's algorithm inside of it
		}
        //----END MOVE BOAT---------------------------------------------------------

        //----ROTATE BOAT------------------------------------------------------------
        
		//deals with rotation calculations of boats, determining their coordinates once rotated
		function rotateBoat(key)
		{
			var ptBoatName = 'patrolBoat-';
			var destroyerName = 'destroyer-';
			var submarineName = 'submarine-';
			var battleshipName = 'battleship-';
			var aircraftCarrierName = 'aircraftCarrier-';
			var firstHalfOfSpriteKey;
			var concatanatedKey;
			if (selectedSprite.sprite.key.charAt(0) == 'p')
			{
				firstHalfOfSpriteKey = ptBoatName;
				selectedSprite.size = 2;
			}
			else if (selectedSprite.sprite.key.charAt(0) == 'd')
			{
				firstHalfOfSpriteKey = destroyerName;
				selectedSprite.size = 3;
			}
			else if (selectedSprite.sprite.key.charAt(0) == 's')
			{
				firstHalfOfSpriteKey = submarineName;
				selectedSprite.size = 3;
			}
			else if (selectedSprite.sprite.key.charAt(0) == 'b')
			{
				firstHalfOfSpriteKey = battleshipName;
				selectedSprite.size = 4;
			}
			else if (selectedSprite.sprite.key.charAt(0) == 'a')
			{
				firstHalfOfSpriteKey = aircraftCarrierName;
				selectedSprite.size = 5;
			}

			var lastStringIndex = selectedSprite.sprite.key.length - 1;
			var lastTwoChar = selectedSprite.sprite.key.charAt(lastStringIndex - 1).concat(selectedSprite.sprite.key.charAt(lastStringIndex));

			if (isActionValid(selectedSprite.size)) //check to see if the move is even valid
			{
				if (selectedSprite.sprite != undefined)
				{
					if (key.event.code == "ArrowRight" && lastTwoChar == 'Up')
					{
						updateActionCounter(selectedSprite.size);
						concatanatedKey = firstHalfOfSpriteKey.concat('Right');
						selectedSprite.sprite.loadTexture(concatanatedKey);
						selectedSprite.sprite.y += blockSize * selectedSprite.size;
						selectedSprite.sprite.y -= blockSize;
						selectedSprite.previousRotationIdentifier = 'Up';

						if (!bounds.contains(selectedSprite.sprite.x + blockSize * selectedSprite.size - blockSize, selectedSprite.sprite.y))
						{
							concatanatedKey = firstHalfOfSpriteKey.concat('Up');
							selectedSprite.sprite.loadTexture(concatanatedKey);
							selectedSprite.sprite.y -= (blockSize * selectedSprite.size);
							selectedSprite.sprite.y += blockSize;
							//selectedSprite.sprite.y = selectedSprite.previousYCoordinate;
						}

						var rotatedBoundaries = new Phaser.Rectangle(selectedSprite.sprite.x, selectedSprite.sprite.y, selectedSprite.sprite.width, selectedSprite.sprite.height);

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(rotatedBoundaries, boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{ //console.log("hello");
									concatanatedKey = firstHalfOfSpriteKey.concat('Up');
									selectedSprite.sprite.loadTexture(concatanatedKey);
									selectedSprite.sprite.y -= blockSize * selectedSprite.size;
									selectedSprite.sprite.y += blockSize;

								}
							}
						}

						for (var i = 0; i < arrayOfMisses.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Up');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.y -= blockSize * selectedSprite.size;
								selectedSprite.sprite.y += blockSize;

							}
						}

						for (var i = 0; i < playerOneAwaySprite.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Up');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.y -= blockSize * selectedSprite.size;
								selectedSprite.sprite.y += blockSize;

							}
						}

					}
					else if (key.event.code == "ArrowRight" && lastTwoChar == 'wn')
					{
						updateActionCounter(selectedSprite.size);
						concatanatedKey = firstHalfOfSpriteKey.concat('Right');
						selectedSprite.sprite.loadTexture(concatanatedKey);
						selectedSprite.previousRotationIdentifier = 'Down';

						if (!bounds.contains(selectedSprite.sprite.x + blockSize * selectedSprite.size - blockSize, selectedSprite.sprite.y))
						{
							concatanatedKey = firstHalfOfSpriteKey.concat('Down');
							selectedSprite.sprite.loadTexture(concatanatedKey);
						}

						var rotatedBoundaries = new Phaser.Rectangle(selectedSprite.sprite.x, selectedSprite.sprite.y, selectedSprite.sprite.width, selectedSprite.sprite.height);

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(rotatedBoundaries, boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{
									concatanatedKey = firstHalfOfSpriteKey.concat('Down');
									selectedSprite.sprite.loadTexture(concatanatedKey);
								}
							}
						}

						for (var i = 0; i < arrayOfMisses.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Down');
								selectedSprite.sprite.loadTexture(concatanatedKey);
							}
						}

						for (var i = 0; i < playerOneAwaySprite.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Down');
								selectedSprite.sprite.loadTexture(concatanatedKey);
							}
						}
					}
					else if (key.event.code == "ArrowLeft" && lastTwoChar == 'Up')
					{
						updateActionCounter(selectedSprite.size);
						concatanatedKey = firstHalfOfSpriteKey.concat('Left');
						selectedSprite.sprite.loadTexture(concatanatedKey);
						selectedSprite.sprite.y += (blockSize * selectedSprite.size);
						selectedSprite.sprite.y -= blockSize;
						selectedSprite.sprite.x -= blockSize * selectedSprite.size;
						selectedSprite.sprite.x += blockSize;
						selectedSprite.previousRotationIdentifier = 'Up';

						if (!bounds.contains(selectedSprite.sprite.x, selectedSprite.sprite.y))
						{
							concatanatedKey = firstHalfOfSpriteKey.concat('Up');
							selectedSprite.sprite.loadTexture(concatanatedKey);
							selectedSprite.sprite.y -= (blockSize * selectedSprite.size);
							selectedSprite.sprite.y += blockSize;
							selectedSprite.sprite.x += blockSize * selectedSprite.size;
							selectedSprite.sprite.x -= blockSize;
						}

						var rotatedBoundaries = new Phaser.Rectangle(selectedSprite.sprite.x, selectedSprite.sprite.y, selectedSprite.sprite.width, selectedSprite.sprite.height);

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(rotatedBoundaries, boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{
									concatanatedKey = firstHalfOfSpriteKey.concat('Up');
									selectedSprite.sprite.loadTexture(concatanatedKey);
									selectedSprite.sprite.y -= (blockSize * selectedSprite.size);
									selectedSprite.sprite.y += blockSize;
									selectedSprite.sprite.x += blockSize * selectedSprite.size;
									selectedSprite.sprite.x -= blockSize;
								}
							}
						}

						for (var i = 0; i < arrayOfMisses.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Up');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.y -= (blockSize * selectedSprite.size);
								selectedSprite.sprite.y += blockSize;
								selectedSprite.sprite.x += blockSize * selectedSprite.size;
								selectedSprite.sprite.x -= blockSize;
							}
						}

						for (var i = 0; i < playerOneAwaySprite.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Up');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.y -= (blockSize * selectedSprite.size);
								selectedSprite.sprite.y += blockSize;
								selectedSprite.sprite.x += blockSize * selectedSprite.size;
								selectedSprite.sprite.x -= blockSize;
							}
						}

					}
					else if (key.event.code == "ArrowLeft" && lastTwoChar == 'wn')
					{
						updateActionCounter(selectedSprite.size);
						concatanatedKey = firstHalfOfSpriteKey.concat('Left');
						selectedSprite.sprite.loadTexture(concatanatedKey);
						selectedSprite.sprite.x -= blockSize * selectedSprite.size;
						selectedSprite.sprite.x += blockSize;
						selectedSprite.previousRotationIdentifier = 'Down';

						if (!bounds.contains(selectedSprite.sprite.x, selectedSprite.sprite.y))
						{
							concatanatedKey = firstHalfOfSpriteKey.concat('Down');
							selectedSprite.sprite.loadTexture(concatanatedKey);
							selectedSprite.sprite.x += blockSize * selectedSprite.size;
							selectedSprite.sprite.x -= blockSize;
							//selectedSprite.sprite.x = selectedSprite.previousXCoordinate;
						}

						var rotatedBoundaries = new Phaser.Rectangle(selectedSprite.sprite.x, selectedSprite.sprite.y, selectedSprite.sprite.width, selectedSprite.sprite.height);

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(rotatedBoundaries, boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{
									concatanatedKey = firstHalfOfSpriteKey.concat('Down');
									selectedSprite.sprite.loadTexture(concatanatedKey);
									selectedSprite.sprite.x += blockSize * selectedSprite.size;
									selectedSprite.sprite.x -= blockSize;
								}
							}
						}

						for (var i = 0; i < arrayOfMisses.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Down');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.x += blockSize * selectedSprite.size;
								selectedSprite.sprite.x -= blockSize;
							}
						}

						for (var i = 0; i < playerOneAwaySprite.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Down');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.x += blockSize * selectedSprite.size;
								selectedSprite.sprite.x -= blockSize;
							}
						}
					}
					else if (key.event.code == "ArrowUp" && lastTwoChar == 'ft')
					{
						updateActionCounter(selectedSprite.size);
						concatanatedKey = firstHalfOfSpriteKey.concat('Up');
						selectedSprite.sprite.loadTexture(concatanatedKey);
						selectedSprite.sprite.x += blockSize * selectedSprite.size;
						selectedSprite.sprite.x -= blockSize;
						selectedSprite.sprite.y -= (blockSize * selectedSprite.size);
						selectedSprite.sprite.y += blockSize;
						selectedSprite.previousRotationIdentifier = 'Left';

						if (!bounds.contains(selectedSprite.sprite.x, selectedSprite.sprite.y))
						{
							concatanatedKey = firstHalfOfSpriteKey.concat('Left');
							selectedSprite.sprite.loadTexture(concatanatedKey);
							selectedSprite.sprite.x -= blockSize * selectedSprite.size;
							selectedSprite.sprite.x += blockSize;
							selectedSprite.sprite.y += (blockSize * selectedSprite.size);
							selectedSprite.sprite.y -= blockSize;
						}

						var rotatedBoundaries = new Phaser.Rectangle(selectedSprite.sprite.x, selectedSprite.sprite.y, selectedSprite.sprite.width, selectedSprite.sprite.height);

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(rotatedBoundaries, boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{
									concatanatedKey = firstHalfOfSpriteKey.concat('Left');
									selectedSprite.sprite.loadTexture(concatanatedKey);
									selectedSprite.sprite.x -= blockSize * selectedSprite.size;
									selectedSprite.sprite.x += blockSize;
									selectedSprite.sprite.y += (blockSize * selectedSprite.size);
									selectedSprite.sprite.y -= blockSize;
								}
							}
						}

						for (var i = 0; i < arrayOfMisses.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Left');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.x -= blockSize * selectedSprite.size;
								selectedSprite.sprite.x += blockSize;
								selectedSprite.sprite.y += (blockSize * selectedSprite.size);
								selectedSprite.sprite.y -= blockSize;
							}
						}

						for (var i = 0; i < playerOneAwaySprite.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Left');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.x -= blockSize * selectedSprite.size;
								selectedSprite.sprite.x += blockSize;
								selectedSprite.sprite.y += (blockSize * selectedSprite.size);
								selectedSprite.sprite.y -= blockSize;
							}
						}

					}
					else if (key.event.code == "ArrowUp" && lastTwoChar == 'ht')
					{
						updateActionCounter(selectedSprite.size);
						concatanatedKey = firstHalfOfSpriteKey.concat('Up');
						selectedSprite.sprite.loadTexture(concatanatedKey);
						selectedSprite.sprite.y -= (blockSize * selectedSprite.size);
						selectedSprite.sprite.y += blockSize;
						selectedSprite.previousRotationIdentifier = 'Right';

						if (!bounds.contains(selectedSprite.sprite.x, selectedSprite.sprite.y))
						{
							concatanatedKey = firstHalfOfSpriteKey.concat('Right');
							selectedSprite.sprite.loadTexture(concatanatedKey);
							selectedSprite.sprite.y += blockSize * selectedSprite.size;
							selectedSprite.sprite.y -= blockSize;
						}

						var rotatedBoundaries = new Phaser.Rectangle(selectedSprite.sprite.x, selectedSprite.sprite.y, selectedSprite.sprite.width, selectedSprite.sprite.height);

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(rotatedBoundaries, boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{
									concatanatedKey = firstHalfOfSpriteKey.concat('Right');
									selectedSprite.sprite.loadTexture(concatanatedKey);
									selectedSprite.sprite.y += blockSize * selectedSprite.size;
									selectedSprite.sprite.y -= blockSize;

								}
							}
						}

						for (var i = 0; i < arrayOfMisses.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Right');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.y += blockSize * selectedSprite.size;
								selectedSprite.sprite.y -= blockSize;
							}
						}

						for (var i = 0; i < playerOneAwaySprite.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Right');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.y += blockSize * selectedSprite.size;
								selectedSprite.sprite.y -= blockSize;
							}
						}
					}
					else if (key.event.code == "ArrowDown" && lastTwoChar == 'ht')
					{
						updateActionCounter(selectedSprite.size);
						concatanatedKey = firstHalfOfSpriteKey.concat('Down');
						selectedSprite.sprite.loadTexture(concatanatedKey);
						selectedSprite.previousRotationIdentifier = 'Right';

						if (!bounds.contains(selectedSprite.sprite.x, selectedSprite.sprite.y + blockSize * selectedSprite.size - blockSize))
						{
							concatanatedKey = firstHalfOfSpriteKey.concat('Right');
							selectedSprite.sprite.loadTexture(concatanatedKey);
						}

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(selectedSprite.sprite.getBounds(), boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{
									concatanatedKey = firstHalfOfSpriteKey.concat('Right');
									selectedSprite.sprite.loadTexture(concatanatedKey);

								}
							}
						}

						var rotatedBoundaries = new Phaser.Rectangle(selectedSprite.sprite.x, selectedSprite.sprite.y, selectedSprite.sprite.width, selectedSprite.sprite.height);

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(rotatedBoundaries, boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{
									concatanatedKey = firstHalfOfSpriteKey.concat('Right');
									selectedSprite.sprite.loadTexture(concatanatedKey);
								}
							}
						}

						for (var i = 0; i < arrayOfMisses.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Right');
								selectedSprite.sprite.loadTexture(concatanatedKey);
							}

						}

						for (var i = 0; i < playerOneAwaySprite.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other boats
							{
								concatanatedKey = firstHalfOfSpriteKey.concat('Right');
								selectedSprite.sprite.loadTexture(concatanatedKey);
							}

						}
					}
					else if (key.event.code == "ArrowDown" && lastTwoChar == 'ft')
					{
						updateActionCounter(selectedSprite.size);
						concatanatedKey = firstHalfOfSpriteKey.concat('Down');
						selectedSprite.sprite.loadTexture(concatanatedKey);
						selectedSprite.sprite.x += blockSize * selectedSprite.size;
						selectedSprite.sprite.x -= blockSize;
						selectedSprite.previousRotationIdentifier = 'Left';


						if (!bounds.contains(selectedSprite.sprite.x, selectedSprite.sprite.y + blockSize * selectedSprite.size - blockSize))
						{
							concatanatedKey = firstHalfOfSpriteKey.concat('Left');
							selectedSprite.sprite.loadTexture(concatanatedKey);
							selectedSprite.sprite.x -= blockSize * selectedSprite.size;
							selectedSprite.sprite.x += blockSize;
						}

						var rotatedBoundaries = new Phaser.Rectangle(selectedSprite.sprite.x, selectedSprite.sprite.y, selectedSprite.sprite.width, selectedSprite.sprite.height);

						for (var i = 0; i < boatSpriteArray.length; i++)
						{
							if (selectedSprite.sprite.key != boatSpriteArray[i].key) //If the intersection isn't between the same two boats
							{
								if (Phaser.Rectangle.intersects(rotatedBoundaries, boatSpriteArray[i].getBounds())) //Check the intersection between the selected boat and every other boats
								{
									concatanatedKey = firstHalfOfSpriteKey.concat('Left');
									selectedSprite.sprite.loadTexture(concatanatedKey);
									selectedSprite.sprite.x -= blockSize * selectedSprite.size;
									selectedSprite.sprite.x += blockSize;

								}
							}
						}

						for (var i = 0; i < arrayOfMisses.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, arrayOfMisses[i].getBounds())) //Check the intersection between the selected boat and every other missed sprite
							{
								//Set the selected sprite back to it's origial position before moving it
								concatanatedKey = firstHalfOfSpriteKey.concat('Left');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.x -= blockSize * selectedSprite.size;
								selectedSprite.sprite.x += blockSize;
							}
						}

						for (var i = 0; i < playerOneAwaySprite.length; i++)
						{
							if (Phaser.Rectangle.intersects(rotatedBoundaries, playerOneAwaySprite[i].getBounds())) //Check the intersection between the selected boat and every other missed sprite
							{
								//Set the selected sprite back to it's origial position before moving it
								concatanatedKey = firstHalfOfSpriteKey.concat('Left');
								selectedSprite.sprite.loadTexture(concatanatedKey);
								selectedSprite.sprite.x -= blockSize * selectedSprite.size;
								selectedSprite.sprite.x += blockSize;
							}
						}
					}
				}
			}
			spriteToBoatUpdate(selectedSprite.sprite);
			updateShipLocationToMatrix();
		}        
        //----END ROTATE BOAT------------------------------------------------------------
        
        //----MATRIX FUNCTIONS-------------------------------------------------------
		function calculateCurrentMatrix()
		{
			for (i = 0; i < 16; i++)
			{
				for (j = 0; j < 16; j++)
				{
					//console.log('[ ' + playerMatrix[j][i] + ' ] ');
				}
				//console.log('\n');
			}
		}

		function updateShipLocationToMatrix()
		{
			//replace all current boat coordinates in the matrix with 0's
			for (i = 0; i < 16; i++)
			{
				for (j = 0; j < 16; j++)
				{
					if (playerMatrix[i][j] == 4)
					{
						playerMatrix[i][j] = 0;
					}
				}
			}

			for (i = 0; i < ptBoat.length; i++)
			{
				if (playerMatrix[ptBoat[i].xCoordinate][ptBoat[i].yCoordinate] == 0)
				{
					playerMatrix[ptBoat[i].xCoordinate][ptBoat[i].yCoordinate] = 4; //location contains a boat, insert a 4 into the player matrix on every spot
				}
			}

			for (i = 0; i < destroyerBoat.length; i++)
			{
				if (playerMatrix[destroyerBoat[i].xCoordinate][destroyerBoat[i].yCoordinate] == 0)
				{
					playerMatrix[destroyerBoat[i].xCoordinate][destroyerBoat[i].yCoordinate] = 4; //location contains a boat, insert a 4 into the player matrix on every spot
				}
			}

			for (i = 0; i < submarineBoat.length; i++)
			{
				if (playerMatrix[submarineBoat[i].xCoordinate][submarineBoat[i].yCoordinate] == 0)
				{
					playerMatrix[submarineBoat[i].xCoordinate][submarineBoat[i].yCoordinate] = 4; //location contains a boat, insert a 4 into the player matrix on every spot
				}
			}

			for (i = 0; i < battleshipBoat.length; i++)
			{
				if (playerMatrix[battleshipBoat[i].xCoordinate][battleshipBoat[i].yCoordinate] == 0)
				{
					playerMatrix[battleshipBoat[i].xCoordinate][battleshipBoat[i].yCoordinate] = 4; //location contains a boat, insert a 4 into the player matrix on every spot
				}
			}

			for (i = 0; i < aircraftCarrierBoat.length; i++)
			{
				if (playerMatrix[aircraftCarrierBoat[i].xCoordinate][aircraftCarrierBoat[i].yCoordinate] == 0)
				{
					playerMatrix[aircraftCarrierBoat[i].xCoordinate][aircraftCarrierBoat[i].yCoordinate] = 4; //location contains a boat, insert a 4 into the player matrix on every spot
				}
			}

			calculateCurrentMatrix();
		}
        //----END MATRIX FUNCTIONS-------------------------------------------------------
        
		//----LEE'S ALGORITHM---------------------------------------------------------
		function setUpSD(convertedMatrix)
		{
			var sXcoord;
			var sYcoord;
			var dXcoord;
			var dYcoord;
			var xLength;
			var yLength;

			for (i = 0; i < convertedMatrix.length; i++)
			{
				for (j = 0; j < convertedMatrix[i].length; j++)
				{
					if (convertedMatrix[i][j] == 'S') //find Start and set it equal to 0, also save the coords
					{
						sXcoord = i;
						sYcoord = j;
						convertedMatrix[i][j] = 0;
					}
					else if (convertedMatrix[i][j] == 'D') //find Destination and set it equal to 0, also save the coords
					{
						dXcoord = i;
						dYcoord = j;
						convertedMatrix[i][j] = 99999;
					}
					if (j == convertedMatrix[i].length - 1)
					{
						yLength = convertedMatrix[i].length;
					}
				}
				if (i == convertedMatrix.length - 1)
				{
					xLength = convertedMatrix.length;
				}
			}
			leeAlgorithm(convertedMatrix, sXcoord, sYcoord, xLength, yLength); //call the recursive algorithm
			return convertedMatrix[dXcoord][dYcoord];
		}

		function leeAlgorithm(convertedMatrix, x, y, xLength, yLength)
		{
			var cost = convertedMatrix[x][y];
			if (x + 1 < xLength)
			{
				if (convertedMatrix[x + 1][y] != '*' && (convertedMatrix[x + 1][y] == '0' || convertedMatrix[x + 1][y] > cost + 1))
				{
					convertedMatrix[x + 1][y] = cost + 1;
					if (x + 1 < xLength)
					{
						leeAlgorithm(convertedMatrix, x + 1, y, xLength, yLength);
					}
				}
			}
			if (x - 1 >= 0)
			{
				if (convertedMatrix[x - 1][y] != '*' && (convertedMatrix[x - 1][y] == '0' || convertedMatrix[x - 1][y] > cost + 1))
				{
					convertedMatrix[x - 1][y] = cost + 1;
					if (x - 1 >= 0)
					{
						leeAlgorithm(convertedMatrix, x - 1, y, xLength, yLength);
					}
				}
			}
			if (y + 1 < yLength)
			{
				if (convertedMatrix[x][y + 1] != '*' && (convertedMatrix[x][y + 1] == '0' || convertedMatrix[x][y + 1] > cost + 1))
				{
					convertedMatrix[x][y + 1] = cost + 1;
					if (y + 1 < yLength)
					{
						leeAlgorithm(convertedMatrix, x, y + 1, xLength, yLength);
					}
				}
			}
			if (y - 1 >= 0)
			{
				if (convertedMatrix[x][y - 1] != '*' && (convertedMatrix[x][y - 1] == '0' || convertedMatrix[x][y - 1] > cost + 1))
				{
					convertedMatrix[x][y - 1] = cost + 1;
					if (y - 1 >= 0)
					{
						leeAlgorithm(convertedMatrix, x, y - 1, xLength, yLength);
					}
				}
			}
		}
		//----END LEE'S ALGORITHM---------------------------------------------------------

		//----CONVERTED MATRIX---------------------------------------------------------
		/*
			Functions to convert the 16x16 board matrix where boats are represented by 
			2-5 board spaces into a matrix where a boat is represented by 1 space.
			This resulting matrix will be used in the implementation of Lee's Algorithm 
			to find the shortest path between two points in a matrix.
		*/

		//converts the 16x16 board matrix so it can be used in Lee's Algorithm
		function convertMatrixForLeesAlgorithm(sprite)
		{
			var boatCoordinatesArray;
			var convertedMatrix;

			var boatLength;
			var spriteBC = new Boardcoordinates(sprite.x, sprite.y);
			var spriteKey = sprite.key;
			var firstTwoChar = spriteKey.charAt(0).concat(spriteKey.charAt(1));

			if (firstTwoChar == 'pa')
			{
				boatLength = 2;
				boatArray = Boat(boatLength, spriteBC, spriteKey);
			}
			else if (firstTwoChar == 'de')
			{
				boatLength = 3;
				boatArray = Boat(boatLength, spriteBC, spriteKey);
			}
			else if (firstTwoChar == 'su')
			{
				boatLength = 3;
				boatArray = Boat(boatLength, spriteBC, spriteKey);
			}
			else if (firstTwoChar == 'ba')
			{
				boatLength = 4;
				boatArray = Boat(boatLength, spriteBC, spriteKey);
			}
			else if (firstTwoChar == 'ai')
			{
				boatLength = 5;
				boatArray = Boat(boatLength, spriteBC, spriteKey);
			}

			var lastStringIndex = sprite.key.length - 1;
			var lastTwoChar = sprite.key.charAt(lastStringIndex - 1).concat(sprite.key.charAt(lastStringIndex));

			//referencing the boat by the back
			var xCoordinateNewLocation = boatArray[0].xCoordinate;
			var yCoordinateNewLocation = boatArray[0].yCoordinate;

			var xCoordinateOldLocation;
			var yCoordinateOldLocation;

			//boat points to the right
			if (lastTwoChar == 'ht')
			{
				//dragStartCoordinates represents back of the boat
				xCoordinateOldLocation = dragStartCoordinates.xCoordinate / blockSize;
				yCoordinateOldLocation = dragStartCoordinates.yCoordinate / blockSize;
                
				if (xCoordinateOldLocation == xCoordinateNewLocation && yCoordinateOldLocation == yCoordinateNewLocation)
				{
					return 0;
				}

				convertedMatrix = rightConvertedMatrix(boatLength, xCoordinateOldLocation, yCoordinateOldLocation);

				//set start location of boat with 'S' and destination of boat with 'D'
				convertedMatrix[xCoordinateOldLocation][yCoordinateOldLocation] = 'S';
				convertedMatrix[xCoordinateNewLocation][yCoordinateNewLocation] = 'D';
                
                return convertedMatrix;
			}
			//boat points to the left
			else if (lastTwoChar == 'ft')
			{ 
				//dragStartCoordinates represents point of the boat, increment x by boatLength
				xCoordinateOldLocation = dragStartCoordinates.xCoordinate / blockSize + boatLength - 1;
				yCoordinateOldLocation = dragStartCoordinates.yCoordinate / blockSize;

				if (xCoordinateOldLocation == xCoordinateNewLocation && yCoordinateOldLocation == yCoordinateNewLocation)
				{
					return 0;
				}

				convertedMatrix = leftConvertedMatrix(boatLength, xCoordinateOldLocation, yCoordinateOldLocation);

				//set start location of boat with 'S' and destination of boat with 'D'
				convertedMatrix[xCoordinateOldLocation-boatLength+1][yCoordinateOldLocation] = 'S';
				convertedMatrix[xCoordinateNewLocation-boatLength+1][yCoordinateNewLocation] = 'D';

				return convertedMatrix;
			}
			//boat points down
			else if (lastTwoChar == 'wn')
			{
				//dragStartCoordinates represents back of the boat
				xCoordinateOldLocation = dragStartCoordinates.xCoordinate / blockSize;
				yCoordinateOldLocation = dragStartCoordinates.yCoordinate / blockSize;

				if (xCoordinateOldLocation == xCoordinateNewLocation && yCoordinateOldLocation == yCoordinateNewLocation)
				{
					return 0;
				}

				convertedMatrix = downConvertedMatrix(boatLength, xCoordinateOldLocation, yCoordinateOldLocation);

				//set start location of boat with 'S' and destination of boat with 'D'
				convertedMatrix[xCoordinateOldLocation][yCoordinateOldLocation] = 'S';
				convertedMatrix[xCoordinateNewLocation][yCoordinateNewLocation] = 'D';

				return convertedMatrix;
			}
			//boat points up
			else if (lastTwoChar == 'Up')
			{
				//dragStartCoordinates represents point of the boat, increment y by boatLength
				xCoordinateOldLocation = dragStartCoordinates.xCoordinate / blockSize;
				yCoordinateOldLocation = dragStartCoordinates.yCoordinate / blockSize + boatLength - 1;

				if (xCoordinateOldLocation == xCoordinateNewLocation && yCoordinateOldLocation == yCoordinateNewLocation)
				{
					return 0;
				}

				convertedMatrix = upConvertedMatrix(boatLength, xCoordinateOldLocation, yCoordinateOldLocation);

				//set start location of boat with 'S' and destination of boat with 'D'
				convertedMatrix[xCoordinateOldLocation][yCoordinateOldLocation-boatLength+1] = 'S';
				convertedMatrix[xCoordinateNewLocation][yCoordinateNewLocation-boatLength+1] = 'D';

				return convertedMatrix;
			}
		}
        
        //converts the 16x16 matrix when the selected ship is pointing to the right
		function rightConvertedMatrix(boatLength, xCoordinateBack, yCoordinateBack)
		{
			//boatLength is length of the boat
			//xCoordinateBack and yCoordinateBack are the board coordinates of the back of the boat 
			//before it was moved
            //initialize converted matrix (16-boatLength)x(16)
			var convertedMatrix = new Array(17 - boatLength);

			for (var i = 0; i < 17 - boatLength; i++)
			{
				convertedMatrix[i] = new Array(16);
			}

			//iterate through x coordinates of playerMatrix
			for (var i = 0; i < 17 - boatLength; ++i)
			{
				//iterate through y coordinates of playerMatrix
				for (var j = 0; j < 16; ++j)
				{
					var spacesToConcatenate = [];

					//iterate through boatLength number of board spaces to the right
					for (var k = 0; k < boatLength; ++k)
					{
						spacesToConcatenate[k] = playerMatrix[i + k][j];
					}

					var result = checkResult(spacesToConcatenate);
					convertedMatrix[i][j] = result;
				}
			}

			//set spaces to the left of the boat to '0' if they are empty
			var iterator = boatLength - 1;
			var counter = iterator;
			var i = xCoordinateBack - iterator;

			//if ship is within boatLength distance from left border of board
			while (i < 0)
			{
				++i;
				--counter;
			}

			for (i; i < xCoordinateBack; ++i)
			{
				var spaceAvailable = true;

				for (var k = 0; k < counter; ++k)
				{

					if (playerMatrix[i + k][yCoordinateBack] != 0)
					{
						spaceAvailable = false;
					}
				}

				if (spaceAvailable)
				{
					convertedMatrix[i][yCoordinateBack] = '0';
				}

				--counter;
			}

			//set spaces to the right of the boat to '0' if they are empty
			var xCoordinateFront = xCoordinateBack + boatLength - 1;
			counter = iterator;
			i = xCoordinateFront + iterator;

			//if ship is within boatLength distance from right border of board
			while (i > 15)
			{
				--i;
				--counter;
			}

			for (i; i > xCoordinateFront; --i)
			{
				var spaceAvailable = true;

				for (var k = 0; k < counter; ++k)
				{
					if (playerMatrix[i - k][yCoordinateBack] != 0)
					{
						spaceAvailable = false;
					}
				}

				if (spaceAvailable)
				{
					convertedMatrix[i - boatLength + 1][yCoordinateBack] = '0';
				}

				--counter;
			}
			return convertedMatrix;
		}

        //converts the 16x16 matrix when the selected ship is pointing to the left
		function leftConvertedMatrix(boatLength, xCoordinateBack, yCoordinateBack)
		{
			//boatLength is length of the boat
			//xCoordinateBack and yCoordinateBack are the board coordinates of the back of the boat 
			//before it was moved
            
            //x coordinate for the front (point) of the boat
			var xCoordinateFront = xCoordinateBack - boatLength + 1;

			//initialize converted matrix (17-boatLength)x(16)
			var convertedMatrix = new Array(17 - boatLength);

			for (var i = 0; i < 17 - boatLength; i++)
			{
				convertedMatrix[i] = new Array(16);
			}

			//iterate through x coordinates of playerMatrix
			for (var i = 0; i < 17 - boatLength; ++i)
			{

				//iterate through y coordinates of playerMatrix
				for (var j = 0; j < 16; ++j)
				{
					var spacesToConcatenate = [];

					//iterate through boatLength number of board spaces to the right
					for (var k = 0; k < boatLength; ++k)
					{
						spacesToConcatenate[k] = playerMatrix[i + k][j];
					}
                    
					var result = checkResult(spacesToConcatenate);
					convertedMatrix[i][j] = result;
				}
			}
            //set spaces to the left of the boat to '0' if they are empty
			var iterator = boatLength - 1;
			var counter = iterator;
			var i = xCoordinateFront - iterator;

			//if ship is within boatLength distance from left border of board
			while (i < 0)
			{
				++i;
				--counter;
			}
            for (i; i < xCoordinateFront; ++i)
			{
				var spaceAvailable = true;

				for (var k = 0; k < counter; ++k)
				{

					if (playerMatrix[i + k][yCoordinateBack] != 0)
					{
						spaceAvailable = false;
					}
				}

				if (spaceAvailable)
				{
					convertedMatrix[i][yCoordinateBack] = '0';
				}

				--counter;
			}

			//set spaces to the right of the boat to '0' if they are empty
			counter = iterator;
			i = xCoordinateBack + iterator;

			//if ship is within boatLength distance from right border of board
			while (i > 15)
			{
				--i;
				--counter;
			}

			for (i; i > xCoordinateBack; --i)
			{
				var spaceAvailable = true;

				for (var k = 0; k < counter; ++k)
				{

					if (playerMatrix[i - k][yCoordinateBack] != 0)
					{
						spaceAvailable = false;
					}
				}

				if (spaceAvailable)
				{
					convertedMatrix[i - boatLength + 1][yCoordinateBack] = '0';
				}

				--counter;
			}
			return convertedMatrix;
		}
        
        //converts the 16x16 matrix when the selected ship is pointing to the up
		function upConvertedMatrix(boatLength, xCoordinateBack, yCoordinateBack)
		{
			//boatLength is length of the boat
			//xCoordinateBack and yCoordinateBack are the board coordinates of the back of the boat 
			//before it was moved

			//y coordinate for the front (point) of the boat
			var yCoordinateFront = yCoordinateBack - boatLength + 1;

			//initialize converted matrix (16)x(17-boatLength)
			var convertedMatrix = new Array(16);

			for (var i = 0; i < 16; i++)
			{
				convertedMatrix[i] = new Array(17 - boatLength);
			}

			//iterate through x coordinates of playerMatrix
			for (var i = 0; i < 16; ++i)
			{
				//iterate through y coordinates of playerMatrix
				for (var j = 0; j < 17 - boatLength; ++j)
				{
					var spacesToConcatenate = [];

					//iterate through boatLength number of board spaces to the right
					for (var k = 0; k < boatLength; ++k)
					{
						spacesToConcatenate[k] = playerMatrix[i][j + k];
					}

					var result = checkResult(spacesToConcatenate);
					convertedMatrix[i][j] = result;
				}
			}

			//set spaces above of the boat to '0' if they are empty
			var iterator = boatLength - 1;
			var counter = iterator;
			var i = yCoordinateFront - iterator;

			//if ship is within boatLength distance from top border of board
			while (i < 0)
			{
				++i;
				--counter;
			}

			for (i; i < yCoordinateFront; ++i)
			{

				var spaceAvailable = true;

				for (var k = 0; k < counter; ++k)
				{

					if (playerMatrix[xCoordinateBack][i + k] != 0)
					{
						spaceAvailable = false;
					}
				}

				if (spaceAvailable)
				{
					convertedMatrix[xCoordinateBack][i] = '0';
				}

				--counter;
			}

			//set spaces below the boat to '0' if they are empty
			counter = iterator;
			i = yCoordinateBack + iterator;
            
            //if ship is within boatLength distance from bottom border of board
			while (i > 15)
			{
				--i;
				--counter;
			}

			for (i; i > yCoordinateBack; --i)
			{

				var spaceAvailable = true;

				for (var k = 0; k < counter; ++k)
				{

					if (playerMatrix[xCoordinateBack][i - k] != 0)
					{
						spaceAvailable = false;
					}
				}

				if (spaceAvailable)
				{
					convertedMatrix[xCoordinateBack][i - boatLength] = '0';
				}

				--counter;
			}

			return convertedMatrix;
		}
        
        //converts the 16x16 matrix when the selected ship is pointing to the up
		function downConvertedMatrix(boatLength, xCoordinateBack, yCoordinateBack)
		{
			//boatLength is length of the boat
			//xCoordinateBack and yCoordinateBack are the board coordinates of the back of the boat 
			//before it was moved

			//y coordinate for the front (point) of the boat
			var yCoordinateFront = yCoordinateBack + boatLength - 1;

			//initialize converted matrix (16)x(17-boatLength)
			var convertedMatrix = new Array(16);

			for (var i = 0; i < 16; i++)
			{
				convertedMatrix[i] = new Array(17 - boatLength);
			}

			//iterate through x coordinates of playerMatrix
			for (var i = 0; i < 16; ++i)
			{
				//iterate through y coordinates of playerMatrix
				for (var j = 0; j < 17 - boatLength; ++j)
				{
                    var spacesToConcatenate = [];

					//iterate through boatLength number of board spaces to the right
					for (var k = 0; k < boatLength; ++k)
					{
						spacesToConcatenate[k] = playerMatrix[i][j + k];
					}

					var result = checkResult(spacesToConcatenate);
					convertedMatrix[i][j] = result;
				}
			}

			//set spaces above of the boat to '0' if they are empty
			var iterator = boatLength - 1;
			var counter = iterator;
			var i = yCoordinateBack - iterator;

			//if ship is within boatLength distance from top border of board
			while (i < 0)
			{
				++i;
				--counter;
			}

			for (i; i < yCoordinateBack; ++i)
			{
				var spaceAvailable = true;

				for (var k = 0; k < counter; ++k)
				{

					if (playerMatrix[xCoordinateBack][i + k] != 0)
					{
						spaceAvailable = false;
					}
				}

				if (spaceAvailable)
				{
					convertedMatrix[xCoordinateBack][i] = '0';
				}

				--counter;
			}

			//set spaces below the boat to '0' if they are empty
			counter = iterator;
			i = yCoordinateFront + iterator;

			//if ship is within boatLength distance from bottom border of board
			while (i > 15)
			{
				--i;
				--counter;
			}

			for (i; i > yCoordinateFront; --i)
			{
				var spaceAvailable = true;

				for (var k = 0; k < counter; ++k)
				{
					if (playerMatrix[xCoordinateBack][i - k] != 0)
					{
						spaceAvailable = false;
					}
				}

				if (spaceAvailable)
				{
					convertedMatrix[xCoordinateBack][i - boatLength] = '0';
				}

				--counter;
			}
			return convertedMatrix;
		}

        //checks an array of board spaces to see if they are all '0' (open) spaces
		function checkResult(data)
		{
			/*
				data is array of board space results (0,1,2,3,4)
			*/

			var result = true;

			//check if all board spaces are '0' for the array
			for (i = 0; i < data.length; ++i)
			{
				if (data[i] != 0)
				{
					result = false;
				}
			}

			if (result == true)
			{
				return '0';
			}
			else
			{
				return '*';
			}
		}
		//----END CONVERTED MATRIX---------------------------------------------------------

		//----FIRE DATA---------------------------------------------------
		//handles player and opponent fires' results

		//server sends client results of fires for player's and opponent's fires
		socket.on('fire data', function(data)
		{
			/* 
				format of fires in data (first index result = username)
				fire: players fire data (coordinates)
				result: 'hit' or 'miss'
			*/

			var fireData = [];
			fireData = JSON.parse(data);

			if (fireData[0].result == username) //player's fires at the opponent
			{
				receivePlayerFires(fireData);
			}
			else //opponent's fires at the player
			{
				receiveOpponentFires(fireData);
			}
		});

		//receive opponent's fires' results from the server and display the sprites for the fires
		receiveOpponentFires = function(data)
		{
			/* 
                format of data (fires) (index 0 result is username)
				fire: players fire data (coordinates)
				result: 'hit', 'miss', or 'oneAway'
			*/

			for (i = 0; i < playerOneAwaySprite.length; i++)
			{
				addPlayerMiss(playerOneAwaySprite[i].x / blockSize, playerOneAwaySprite[i].y / blockSize);
				playerOneAwaySprite[i].destroy();
			}

			//empty the OneAwaySprite list for next iteration
			playerOneAwaySprite = [];

			//takes in the hits sent from the server, adds them to the board, and removes them from the total 
			for (i = 1; i < data.length; i++) //iterate through boardspaces shot at
			{
				if (data[i].result === 'hit') //only passing in hits as of now, change code for data to register hits, and all of the aims without hits turn into misses
				{
					addPlayerHit(data[i].xCoordinate, data[i].yCoordinate);
				}
				else if (data[i].result === 'miss')
				{
					addPlayerMiss(data[i].xCoordinate, data[i].yCoordinate);
				}
				else if (data[i].result === 'oneAway') //oneAway will be implemented later on, too much to do now. Will be calculated similarly to hits in the server.
				{
					addPlayerOneAway(data[i].xCoordinate, data[i].yCoordinate);
				}
			}

			checkBoatSunk();

			for (i = 0; i < aimSprite.length; i++)
			{
				aimSprite[i].destroy();
			}

			aimSprite = [];
            
            //check for which ships have been hit, then remove their ability to move
            for (i = 0; i < boatSpriteArray.length; i++)
            {
                if (arrayIsHit[i] == true)
                {
                    boatSpriteArray[i].input.draggable = false;
                }
            }
            
			socket.emit('client ready next turn', username);
		}

		//receive players's fires back from the server and display the sprites for the fires
		receivePlayerFires = function(data)
        {
            /* format of data (fires) (index 0 result is username)
                fire: players fire data (coordinates)
                result: 'hit' or 'miss'
            */

            //change all previous One Away sprites to Miss sprites
            for (i = 0; i < opponentOneAwaySprite.length; i++)
            {
                addOpponentMiss(opponentOneAwaySprite[i].x / blockSize, opponentOneAwaySprite[i].y / blockSize);
                opponentOneAwaySprite[i].destroy();
            }

            //empty the OneAwaySprite list for next iteration
            opponentOneAwaySprite = [];
            var isHit = false;
            var isMiss = false;
            var isOneAway = false;

            for (i = 1; i < data.length; i++) //iterate through boardspaces shot at
            {
                if (data[i].result === 'hit') //only passing in hits as of now, change code for data to register hits, and all of the aims without hits turn into misses
                {
                    addOpponentHit(data[i].xCoordinate, data[i].yCoordinate);
                    isHit = true;
                }
                else if (data[i].result === 'miss')
                {
                    addOpponentMiss(data[i].xCoordinate, data[i].yCoordinate);
                    isMiss = true;
                }
                else if (data[i].result === 'oneAway') //oneAway will be implemented later on, too much to do now. Will be calculated similarly to hits in the server.
                {
                    addOpponentOneAway(data[i].xCoordinate, data[i].yCoordinate);
                    isOneAway = true;
                }
            }

            /*if(isHit && (isMiss || isOneAway))
            {
                var randomHitAudio = OpponentGame.rnd.pick(opponentHitAudio);
                var randomMissAudio = OpponentGame.rnd.pick(opponentMissAudio);
                randomHitAudio.play();
                randomMissAudio.play();
            }
            else */if(isHit)
            {
                var randomHitAudio = OpponentGame.rnd.pick(opponentHitAudio);
                randomHitAudio.play();
            }
            else if(isMiss || isOneAway)
            {
                var randomMissAudio = OpponentGame.rnd.pick(opponentMissAudio);
                randomMissAudio.play();
            }

//THIS WASN'T IN THE MERGED CODE.... DO WE NEED IT????
            //check for which ships have been hit, then remove their ability to move
            for (i = 0; i < boatSpriteArray.length; i++)
            {
                if (arrayIsHit[i] == true)
                {
                    boatSpriteArray[i].input.draggable = false;
                }
            }
            
            //empty the OneAwaySprite list for next iteration
            //opponentOneAwaySprite = [];
			
        }
		//----END FIRE DATA---------------------------------------------

		//----EVENT LISTENERS--------------------------------------
		//enable and disable event listeners for player's and opponent's boards

		//enable event listeners for player's board
		function enablePlayerEventListeners()
		{
			groupOfBoats.setAll('inputEnabled', true);
		}

		//disable event listeners for player's board
		function disablePlayerEventListeners()
		{
			groupOfBoats.setAll('inputEnabled', false);
		}

		//event listeners for boat sprites
		function boatEventListeners(sprite, pointer)
		{
			/*Finding the boat who's coordinate equals the clicked sprite's coordinates
			  then create a coordinate array for the selectedSprite */

			var spriteCoordinates = new Boardcoordinates(sprite.x / blockSize, sprite.y / blockSize);
			var spriteCoordArray = [];

			for (var i = 0; i < arrayOfBoats.length; i++)
			{
				for (var j = 0; j < arrayOfBoats[i].length; j++)
				{
					if (arrayOfBoats[i][j].xCoordinate == spriteCoordinates.xCoordinate && arrayOfBoats[i][j].yCoordinate == spriteCoordinates.yCoordinate)
					{
						spriteCoordArray = arrayOfBoats[i];
					}
				}
			}

			/*Iterate through the coordinates of the sprite array, using the coordinates as the index of the matrix.
			  If any of the indices of the matrix equals 3 i.e. the ship has been hit. Disable movement on that sprite.
			*/

			for (var i = 0; i < spriteCoordArray.length; i++)
			{
				if (playerMatrix[spriteCoordArray[i].xCoordinate][spriteCoordArray[i].yCoordinate] == 3)
				{
					sprite.inputEnabled = false;
				}
			}

			//If input has not been disabled, set the selectedSprite to the sprite clicked on
			if (!sprite.inputEnabled == false)
			{
				//Used in rotateBoat function on selected boat by mouse
				selectedSprite.size = spriteCoordArray.length;
				selectedSprite.coordArray = spriteCoordArray;
				selectedSprite.sprite = sprite;
			}
		}

		//enable event listeners for opponent's board
		function enableOpponentEventListeners()
		{
			OpponentGame.input.mouse.capture = true;
			OpponentGame.input.onDown.add(onDown, this);
			OpponentGame.input.onUp.add(onUp, this);
		}

		//disable event listeners for opponent's board
		function disableOpponentEventListeners()
		{
			OpponentGame.input.mouse.capture = false;
			OpponentGame.input.onDown.add(onDown, false);
			OpponentGame.input.onUp.add(onUp, false);
		}
		//----END EVENT LISTENERS------------------------------------------

		//----PRELOAD BOARDS----------------------------------------------
		//preloads player's and opponent's boards when game screen is opened

		//preload player's board when game screen is opened
		function preloadPlayerBoard()
		{
			loadBoats();
            loadPlayerAudio();
			loadPlayerMarkers();

			PlayerGame.create.grid('drawingGrid', gridSize, gridSize, blockSize, blockSize, '#747474');

			canvas = PlayerGame.make.bitmapData(spriteWidth * blockSize, spriteHeight * blockSize);
			canvasBG = PlayerGame.make.bitmapData(canvas.width, canvas.height);

			canvasBG.rect(0, 0, canvasBG.width, canvasBG.height, '#8B938B');
			canvasBG.rect(1, 1, canvasBG.width - 2, canvasBG.height - 2, '#0A336B');

			var x = 0;
			var y = 0;

			canvasBG.addToWorld(x, y);
			canvasSprite = canvas.addToWorld(x + 1, y + 1);
			canvasGrid = PlayerGame.add.sprite(x, y, 'drawingGrid');
			canvasGrid.crop(new Phaser.Rectangle(0, 0, spriteWidth * blockSize, spriteHeight * blockSize));
		}

		//preload opponent's board when game screen is opened
		function preloadOpponentBoard()
		{
			loadOpponentMarkers();
			loadOpponentAudio();

			OpponentGame.create.grid('drawingGrid', gridSize, gridSize, blockSize, blockSize, '#747474');

			canvas = OpponentGame.make.bitmapData(spriteWidth * blockSize, spriteHeight * blockSize);
			canvasBG = OpponentGame.make.bitmapData(canvas.width, canvas.height);

			canvasBG.rect(0, 0, canvasBG.width, canvasBG.height, '#8B938B');
			canvasBG.rect(1, 1, canvasBG.width - 2, canvasBG.height - 2, '#E9E9E9');

			var x = 0;
			var y = 0;

			canvasBG.addToWorld(x, y);
			canvasSprite = canvas.addToWorld(x, y);
			canvasGrid = OpponentGame.add.sprite(x, y, 'drawingGrid');
			canvasGrid.crop(new Phaser.Rectangle(0, 0, spriteWidth * blockSize, spriteHeight * blockSize));
		}
		//----END PRELOAD BOARDS-------------------------------------------

		//----CREATE BOARDS------------------------------------------------
		//create player/opponent boards and ships when game screen is opened

		//create player's board when game screen is opened
		function createPlayerBoard()
		{
			playerMatrix = new Array(16);

			for (var i = 0; i < gridSize; i++)
			{
				playerMatrix[i] = new Array(16);
			}

			for (var i = 0; i < gridSize; i++)
			{
				for (var j = 0; j < gridSize; j++)
				{
					playerMatrix[i][j] = 0;
				}
			}

			bounds = new Phaser.Rectangle(0, 0, gridSize, gridSize);

			//addPlayer(); //calls addPlayer to create a profile for the user
			groupOfBoats = PlayerGame.add.group();
			createBoats();

			//TODO: Setting up hotkeys for moving boats -------------------------------------------------

			//Setting up hotkeys for rotating boats
			var rightKey = PlayerGame.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(rotateBoat, this);
			var leftKey = PlayerGame.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(rotateBoat, this);
			var upKey = PlayerGame.input.keyboard.addKey(Phaser.Keyboard.UP).onDown.add(rotateBoat, this);
			var downKey = PlayerGame.input.keyboard.addKey(Phaser.Keyboard.DOWN).onDown.add(rotateBoat, this);
			var enterKey = PlayerGame.input.keyboard.addKey(Phaser.KeyCode.ENTER).onDown.add(sendMessage, this);

			/* Boat array needs to be set up at the beginning of the game so the event handlers on the
			sprites can be used. */
			var bc = new Boardcoordinates(ptBoatSprite.x, ptBoatSprite.y);
			var ptBoatLength = 2;
			ptBoat = new Boat(ptBoatLength, bc, ptBoatSprite.key);

			bc = new Boardcoordinates(destroyerSprite.x, destroyerSprite.y);
			var destroyerLength = 3;
			destroyerBoat = new Boat(destroyerLength, bc, destroyerSprite.key);

			bc = new Boardcoordinates(submarineSprite.x, submarineSprite.y);
			var submarineLength = 3;
			submarineBoat = new Boat(submarineLength, bc, submarineSprite.key);

			bc = new Boardcoordinates(battleshipSprite.x, battleshipSprite.y);
			var battleshipLength = 4;
			battleshipBoat = new Boat(battleshipLength, bc, battleshipSprite.key);

			bc = new Boardcoordinates(aircraftCarrierSprite.x, aircraftCarrierSprite.y);
			aircraftCarrierLength = 5;
			aircraftCarrierBoat = new Boat(aircraftCarrierLength, bc, aircraftCarrierSprite.key);

			arrayOfBoats = [ptBoat, destroyerBoat, submarineBoat, battleshipBoat, aircraftCarrierBoat];
            
            createPlayerAudio();
		}

		//create boats when player board is created 
		function createBoats()
		{
			boatArray = []; //clear boatArray in case of leftover data

			//create ptBoat
			ptBoatSprite = PlayerGame.add.sprite(8 * blockSize, 8 * blockSize, 'patrolBoat-Right');

			//create destroyer
			destroyerSprite = PlayerGame.add.sprite(0, 3 * blockSize, 'destroyer-Right');

			//create submarine
			submarineSprite = PlayerGame.add.sprite(0, 5 * blockSize, 'submarine-Right');

			//create battleship
			battleshipSprite = PlayerGame.add.sprite(0, 7 * blockSize, 'battleship-Right');

			//create aircraft carrier
			aircraftCarrierSprite = PlayerGame.add.sprite(0, 9 * blockSize, 'aircraftCarrier-Right');

			//Adding boat sprites to a group
			groupOfBoats.add(ptBoatSprite);
			groupOfBoats.add(destroyerSprite);
			groupOfBoats.add(submarineSprite);
			groupOfBoats.add(battleshipSprite);
			groupOfBoats.add(aircraftCarrierSprite);

			//Setting all values and calling all functions for the group of sprites
			groupOfBoats.callAll('scale.setTo', 'scale', spriteSize, spriteSize);
			groupOfBoats.setAll('inputEnabled', true);
			groupOfBoats.callAll('input.enableDrag', 'input');
			groupOfBoats.callAll('input.enableSnap', 'input', blockSize, blockSize, true, true);
			groupOfBoats.setAll('input.boundsRect', bounds);
			groupOfBoats.callAll('events.onDragStart.add', 'events.onDragStart', onDragStart, this);
			groupOfBoats.callAll('events.onDragStop.add', 'events.onDragStop', onDragStop, this);
			groupOfBoats.callAll('events.onInputDown.add', 'events.onInputDown', boatEventListeners, this);

			//Adding all the boat sprites to a global array
			boatSpriteArray.push(ptBoatSprite)
			boatSpriteArray.push(destroyerSprite);
			boatSpriteArray.push(submarineSprite);
			boatSpriteArray.push(battleshipSprite);
			boatSpriteArray.push(aircraftCarrierSprite)
		}

		//create opponent board when game screen is opened
		function createOpponentBoard()
		{
			disableOpponentEventListeners();
            createOpponentAudio();
		}
		//----END CREATE BOARDS--------------------------------------------

		//----UPDATE BOARDS--------------------------------------------------------
		//updates player's and opponent's boards

		//updates the player's board when timer ends
		function updatePlayerBoard ()
		{
			bc = new Boardcoordinates(ptBoatSprite.x, ptBoatSprite.y); //create object with x&y coordinates of the boat
			var ptBoatJSON = JSON.stringify(new Boat(2, bc, ptBoatSprite.key)); //create object with size and coordinates of the boat.  Then conver to JSON

			bc = new Boardcoordinates(destroyerSprite.x, destroyerSprite.y);
			var destroyerBoatJSON = JSON.stringify(new Boat(3, bc, destroyerSprite.key));

			bc = new Boardcoordinates(submarineSprite.x, submarineSprite.y);
			var submarineBoatJSON = JSON.stringify(new Boat(3, bc, submarineSprite.key));

			bc = new Boardcoordinates(battleshipSprite.x, battleshipSprite.y);
			var battleshipBoatJSON = JSON.stringify(new Boat(4, bc, battleshipSprite.key));

			bc = new Boardcoordinates(aircraftCarrierSprite.x, aircraftCarrierSprite.y);
			var aircraftCarrierBoatJSON = JSON.stringify(new Boat(5, bc, aircraftCarrierSprite.key));

			shipArray = [ptBoatJSON, destroyerBoatJSON, submarineBoatJSON, battleshipBoatJSON, aircraftCarrierBoatJSON];

			var bc = new Boardcoordinates(ptBoatSprite.x, ptBoatSprite.y);
			var ptBoatLength = 2;
			ptBoat = new Boat(ptBoatLength, bc, ptBoatSprite.key);

			bc = new Boardcoordinates(destroyerSprite.x, destroyerSprite.y);
			var destroyerLength = 3;
			destroyerBoat = new Boat(destroyerLength, bc, destroyerSprite.key);

			bc = new Boardcoordinates(submarineSprite.x, submarineSprite.y);
			var submarineLength = 3;
			submarineBoat = new Boat(submarineLength, bc, submarineSprite.key);

			bc = new Boardcoordinates(battleshipSprite.x, battleshipSprite.y);
			var battleshipLength = 4;
			battleshipBoat = new Boat(battleshipLength, bc, battleshipSprite.key);

			bc = new Boardcoordinates(aircraftCarrierSprite.x, aircraftCarrierSprite.y);
			aircraftCarrierLength = 5;
			aircraftCarrierBoat = new Boat(aircraftCarrierLength, bc, aircraftCarrierSprite.key);

			arrayOfBoats = [ptBoat, destroyerBoat, submarineBoat, battleshipBoat, aircraftCarrierBoat];

			var playerShipData = {
				ships: shipArray,
				username: username
			};

			sendPlayerShipData(playerShipData);
		}

		//updates the opponent's board when timer ends
		function updateOpponentBoard ()
		{
			var fireArray = [];

			for (i = 0; i < aimSprite.length; i++)
			{
				var aim = new Boardcoordinates(aimSprite[i].x, aimSprite[i].y);
				aim = convertCoordinates(aim, blockSize);
				aim = JSON.stringify(aim);
				fireArray.push(aim);
			}

			//player's fires locations and username
			var playerFireData = {
				aims: fireArray,
				username: username
			};

			//sends player's fires locations to the server
			sendPlayerFireData(playerFireData);
		}
		//----END UPDATE BOARDS-------------------------------------------------

		//----LOAD IMAGES-------------------------------------------------------
		//loads boat images and marker images

		//load boat images for player's board
		function loadBoats()
		{
			PlayerGame.load.image('patrolBoat-Right', 'static/media/Boat2-Right.png');
			PlayerGame.load.image('patrolBoat-Down', 'static/media/Boat2-Down.png');
			PlayerGame.load.image('patrolBoat-Left', 'static/media/Boat2-Left.png');
			PlayerGame.load.image('patrolBoat-Up', 'static/media/Boat2-High.png');

			PlayerGame.load.image('destroyer-Right', 'static/media/Boat3-Right.png');
			PlayerGame.load.image('destroyer-Down', 'static/media/Boat3-Down.png');
			PlayerGame.load.image('destroyer-Left', 'static/media/Boat3-Left.png');
			PlayerGame.load.image('destroyer-Up', 'static/media/Boat3-Up.png');

			PlayerGame.load.image('submarine-Right', 'static/media/Boat3-Right.png');
			PlayerGame.load.image('submarine-Down', 'static/media/Boat3-Down.png');
			PlayerGame.load.image('submarine-Left', 'static/media/Boat3-Left.png');
			PlayerGame.load.image('submarine-Up', 'static/media/Boat3-Up.png');

			PlayerGame.load.image('battleship-Right', 'static/media/Boat4-Right.png');
			PlayerGame.load.image('battleship-Down', 'static/media/Boat4-Down.png');
			PlayerGame.load.image('battleship-Left', 'static/media/Boat4-Left.png');
			PlayerGame.load.image('battleship-Up', 'static/media/Boat4-Up.png');

			PlayerGame.load.image('aircraftCarrier-Right', 'static/media/Boat5-Right.png');
			PlayerGame.load.image('aircraftCarrier-Down', 'static/media/Boat5-Down.png');
			PlayerGame.load.image('aircraftCarrier-Left', 'static/media/Boat5-Left.png');
			PlayerGame.load.image('aircraftCarrier-Up', 'static/media/Boat5-Up.png');
		}

		//load markers for player's board
		function loadPlayerMarkers()
		{
			PlayerGame.load.image('hit', 'static/media/Hit.png');
			PlayerGame.load.image('miss', 'static/media/Miss.png');
			PlayerGame.load.image('oneAway', 'static/media/OneAway.png');
		}

		//load markers for opponent's board
		function loadOpponentMarkers()
		{
			OpponentGame.load.image('hit', 'static/media/Hit.png');
			OpponentGame.load.image('miss', 'static/media/Miss.png');
			OpponentGame.load.image('oneAway', 'static/media/OneAway.png');
			OpponentGame.load.image('aim', 'static/media/Aim.png'); //AIM MARKER GOING TO GO HERE WHEN IMAGE IS MADE
		}
		//----END LOADING IMAGES--------------------------------------------------------
        
        //----LOAD AUDIO----------------------------------------------------------------

        //load sounds for player's board
        function loadPlayerAudio()
        {
            PlayerGame.load.audio('playerBattleShipMovementAmbient', 'static/media/BattleShipMovementAmbient.wav');
            PlayerGame.load.audio('playerExplosionMetal', 'static/media/ExplosionMetal.wav');
            PlayerGame.load.audio('playerExplosionMetalGverb', 'static/media/ExplosionMetalGverb.wav');
            PlayerGame.load.audio('playerGunShot', 'static/media/GunShot.wav');
            PlayerGame.load.audio('playerGunShotGverb', 'static/media/GunShotGverb.wav');
            PlayerGame.load.audio('playerSplash', 'static/media/Splash.wav');
            PlayerGame.load.audio('playerSplashGverb', 'static/media/SplashGverb.wav');
            PlayerGame.load.audio('playerWaterSurfaceExplosion01', 'static/media/WaterSurfaceExplosion01.wav');
            PlayerGame.load.audio('playerWaterSurfaceExplosion02', 'static/media/WaterSurfaceExplosion02.wav');
            PlayerGame.load.audio('playerWaterSurfaceExplosion03', 'static/media/WaterSurfaceExplosion03.wav');
            PlayerGame.load.audio('playerWaterSurfaceExplosion04', 'static/media/WaterSurfaceExplosion04.wav');
            PlayerGame.load.audio('playerWaterSurfaceExplosion05', 'static/media/WaterSurfaceExplosion05.wav');
            PlayerGame.load.audio('playerWaterSurfaceExplosion06', 'static/media/WaterSurfaceExplosion06.wav');
            PlayerGame.load.audio('playerWaterSurfaceExplosion07', 'static/media/WaterSurfaceExplosion07.wav');
            PlayerGame.load.audio('playerWaterSurfaceExplosion08', 'static/media/WaterSurfaceExplosion08.wav');
            //PlayerGame.load.start();
        }

        //load sounds for opponent's board
        function loadOpponentAudio()
        {
            OpponentGame.load.audio('opponentBattleShipMovementAmbient', 'static/media/BattleShipMovementAmbient.wav');
            OpponentGame.load.audio('opponentExplosionMetal', 'static/media/ExplosionMetal.wav');
            OpponentGame.load.audio('opponentExplosionMetalGverb', 'static/media/ExplosionMetalGverb.wav');
            OpponentGame.load.audio('opponentGunShot', 'static/media/GunShot.wav');
            OpponentGame.load.audio('opponentGunShotGverb', 'static/media/GunShotGverb.wav');
            OpponentGame.load.audio('opponentSplash', 'static/media/Splash.wav');
            OpponentGame.load.audio('opponentSplashGverb', 'static/media/SplashGverb.wav');
            OpponentGame.load.audio('opponentWaterSurfaceExplosion01', 'static/media/WaterSurfaceExplosion01.wav');
            OpponentGame.load.audio('opponentWaterSurfaceExplosion02', 'static/media/WaterSurfaceExplosion02.wav');
            OpponentGame.load.audio('opponentWaterSurfaceExplosion03', 'static/media/WaterSurfaceExplosion03.wav');
            OpponentGame.load.audio('opponentWaterSurfaceExplosion04', 'static/media/WaterSurfaceExplosion04.wav');
            OpponentGame.load.audio('opponentWaterSurfaceExplosion05', 'static/media/WaterSurfaceExplosion05.wav');
            OpponentGame.load.audio('opponentWaterSurfaceExplosion06', 'static/media/WaterSurfaceExplosion06.wav');
            OpponentGame.load.audio('opponentWaterSurfaceExplosion07', 'static/media/WaterSurfaceExplosion07.wav');
            OpponentGame.load.audio('opponentWaterSurfaceExplosion08', 'static/media/WaterSurfaceExplosion08.wav');
            //OpponentGame.load.start();
        }

        function loadBackgroundAudio()
        {
            //do we want this yet?
        }
        //----END LOADING AUDIO---------------------------------------------------------

        //----CREATE AUDIO--------------------------------------------------------------
        
        //create player board sounds
        function createPlayerAudio()
        {
            playerBattleShipMovementAmbient = PlayerGame.add.audio('playerBattleShipMovementAmbient');
            playerExplosionMetal = PlayerGame.add.audio('playerExplosionMetal');
            playerExplosionMetalGverb = PlayerGame.add.audio('playerExplosionMetalGverb');
            playerGunShot = PlayerGame.add.audio('playerGunShot');
            playerGunShotGverb = PlayerGame.add.audio('playerGunShotGverb');
            playerSplash = PlayerGame.add.audio('playerSplash');
            playerSplashGverb = PlayerGame.add.audio('playerSplashGverb');
            playerWaterSurfaceExplosion01 = PlayerGame.add.audio('playerWaterSurfaceExplosion01');
            playerWaterSurfaceExplosion02 = PlayerGame.add.audio('playerWaterSurfaceExplosion02');
            playerWaterSurfaceExplosion03 = PlayerGame.add.audio('playerWaterSurfaceExplosion03');
            playerWaterSurfaceExplosion04 = PlayerGame.add.audio('playerWaterSurfaceExplosion04');
            playerWaterSurfaceExplosion05 = PlayerGame.add.audio('playerWaterSurfaceExplosion05');
            playerWaterSurfaceExplosion06 = PlayerGame.add.audio('playerWaterSurfaceExplosion06');
            playerWaterSurfaceExplosion07 = PlayerGame.add.audio('playerWaterSurfaceExplosion07');
            playerWaterSurfaceExplosion08 = PlayerGame.add.audio('playerWaterSurfaceExplosion08');

            playerMissAudio = [playerSplash, playerSplashGverb];
            playerAimAudio = [playerGunShot, playerGunShotGverb];
            playerHitAudio = [playerWaterSurfaceExplosion01, 
                                playerWaterSurfaceExplosion02, 
                                playerWaterSurfaceExplosion03, 
                                playerWaterSurfaceExplosion04, 
                                playerWaterSurfaceExplosion05, 
                                playerWaterSurfaceExplosion06, 
                                playerWaterSurfaceExplosion07, 
                                playerWaterSurfaceExplosion08];

            //PlayerGame.sound.setDecodedCallback([playerMissAudio, playerAimAudio, playerHitAudio], createOpponentBoard, this);					
        }

        //create opponent board sounds
        function createOpponentAudio()
        {
            opponentBattleShipMovementAmbient = OpponentGame.add.audio('opponentBattleShipMovementAmbient');
            opponentExplosionMetal = OpponentGame.add.audio('opponentExplosionMetal');
            opponentExplosionMetalGverb = OpponentGame.add.audio('opponentExplosionMetalGverb');
            opponentGunShot = OpponentGame.add.audio('opponentGunShot');
            opponentGunShotGverb = OpponentGame.add.audio('opponentGunShotGverb');
            opponentSplash = OpponentGame.add.audio('opponentSplash');
            opponentSplashGverb = OpponentGame.add.audio('opponentSplashGverb');
            opponentWaterSurfaceExplosion01 = OpponentGame.add.audio('opponentWaterSurfaceExplosion01');
            opponentWaterSurfaceExplosion02 = OpponentGame.add.audio('opponentWaterSurfaceExplosion02');
            opponentWaterSurfaceExplosion03 = OpponentGame.add.audio('opponentWaterSurfaceExplosion03');
            opponentWaterSurfaceExplosion04 = OpponentGame.add.audio('opponentWaterSurfaceExplosion04');
            opponentWaterSurfaceExplosion05 = OpponentGame.add.audio('opponentWaterSurfaceExplosion05');
            opponentWaterSurfaceExplosion06 = OpponentGame.add.audio('opponentWaterSurfaceExplosion06');
            opponentWaterSurfaceExplosion07 = OpponentGame.add.audio('opponentWaterSurfaceExplosion07');
            opponentWaterSurfaceExplosion08 = OpponentGame.add.audio('opponentWaterSurfaceExplosion08');

            opponentMissAudio = [opponentSplash, opponentSplashGverb];
            opponentAimAudio = [opponentGunShot, opponentGunShotGverb];
            opponentHitAudio = [opponentWaterSurfaceExplosion01, 
                                opponentWaterSurfaceExplosion02, 
                                opponentWaterSurfaceExplosion03, 
                                opponentWaterSurfaceExplosion04, 
                                opponentWaterSurfaceExplosion05, 
                                opponentWaterSurfaceExplosion06, 
                                opponentWaterSurfaceExplosion07, 
                                opponentWaterSurfaceExplosion08];

            //OpponentGame.sound.setDecodedCallback([opponentMissAudio, opponentAimAudio, opponentHitAudio], createOpponentBoard, this);

        }
        //----END CREATE AUDIO---------------------------------------------------------

		//----OPPONENT MARKERS------------------------------------------------------
		//adds opponent images as sprites for opponent's board

		//add sprite for hit
		function addOpponentHit(xCoord, yCoord)
		{
			var tempSprite = OpponentGame.add.sprite(xCoord * blockSize, yCoord * blockSize, 'hit');
			tempSprite.scale.setTo(spriteSize, spriteSize);

			opponentHitSprite.push(tempSprite);
		}

		//add sprite for miss
		function addOpponentMiss(xCoord, yCoord)
		{
			var tempSprite = OpponentGame.add.sprite(xCoord * blockSize, yCoord * blockSize, 'miss');
			tempSprite.scale.setTo(spriteSize, spriteSize);

			opponentMissSprite.push(tempSprite);
		}

		//add sprite for one away
		function addOpponentOneAway(xCoord, yCoord)
		{
			var tempSprite = OpponentGame.add.sprite(xCoord * blockSize, yCoord * blockSize, 'oneAway');
			tempSprite.scale.setTo(spriteSize, spriteSize);

			opponentOneAwaySprite.push(tempSprite);
		}

		//add sprite for aim
		function addOpponentAim(xCoord, yCoord)
		{
			var tempSprite = OpponentGame.add.sprite(xCoord * blockSize, yCoord * blockSize, 'aim');
			tempSprite.scale.setTo(spriteSize, spriteSize);

			aimSprite.push(tempSprite);
            
            randomAimAudio = OpponentGame.rnd.pick(opponentAimAudio);
            randomAimAudio.play();

            //Phaser.Cache.reloadSoundComplete('opponentGunShot');
		}
		//------------------END OPPONENT MARKERS------------------------------------------------

		//----------------------PLAYER MARKERS--------------------------------------------------
		//add player images as sprites for player's board

		//adds sprite for hit
		function addPlayerHit(xCoord, yCoord)
		{
			var tempSprite = PlayerGame.add.sprite(xCoord * blockSize, yCoord * blockSize, 'hit');
			tempSprite.scale.setTo(spriteSize, spriteSize);

			arrayOfHits.push(new Boardcoordinates(tempSprite.x, tempSprite.y));

			playerMatrix[xCoord][yCoord] = 3; //This space has a hit, so in the matrix it equals 3
		}

		//adds sprite for miss
		function addPlayerMiss(xCoord, yCoord)
		{
			var tempSprite = PlayerGame.add.sprite(xCoord * blockSize, yCoord * blockSize, 'miss');
			tempSprite.scale.setTo(spriteSize, spriteSize);

			arrayOfMisses.push(tempSprite);

			playerMatrix[xCoord][yCoord] = 1; //This space has a miss, so in the matrix it equals 1
		}

		//adds sprite for one away
		function addPlayerOneAway(xCoord, yCoord)
		{
			var tempSprite = PlayerGame.add.sprite(xCoord * blockSize, yCoord * blockSize, 'oneAway');
			tempSprite.scale.setTo(spriteSize, spriteSize);

			playerOneAwaySprite.push(tempSprite);

			playerMatrix[xCoord][yCoord] = 2; //This space has a one away, so in the matrix it equals 2
		}
		//------------------END PLAYER MARKERS--------------------------------------------------

		//----GAME OVER BUTTONS------------------------------------------------------------------
		
        //resets the board for another game to begin
        function resetGame()
        {
            //re-initialize player and opponent games
            PlayerGame = new Phaser.Game(windowSize, windowSize, Phaser.AUTO, 'playerBoard',
			{
				preload: preloadPlayerBoard,
				create: createPlayerBoard
			});

			OpponentGame = new Phaser.Game(windowSize, windowSize, Phaser.AUTO, 'opponentBoard',
			{
				preload: preloadOpponentBoard,
				create: createOpponentBoard
			});
            
            //resets turn number to 1
			turnNumber = 1;
            
            //resets actions and action circles for the new game
            resetActions();
            
            //sets all ships to not-hit
            ptBoatIsHit = false;
            destroyerIsHit = false;
            submarineIsHit = false;
            battleshipIsHit = false;
            aircraftCarrierIsHit = false;
            
			//empty hits/misses array
			shipArray = [];
			boatSpriteArray = [];
			arrayOfHits = [];
			arrayOfMisses = [];
			indexShipSunk = [];
            opponentHitSprite = [];
            opponentMissSprite = [];
            playerOneAwaySprite = [];
            opponentOneAwaySprite = [];
			
			numShipsSunk = 0;
        }
        
        //resets all the action circles and gives the player unlimited actions to set their board for the second game
        function resetActions() 
        {
            $("#actions-remaining-circle span").text(' ');
            
            for (var i = 1; i <= 10; i++)
            {
                var id = '#circle' + i;
                $(id).css("fill", "#FFFFFF");
            }
            
            totalActions = 9999999;
            actionCounter = 9999999;
        }
        
		$("#play-again").click(function(){
			//TO-DO for Thomas:
            //login screen inbox should be empty when reloading that screen (currently has clients previous username) ???
            
            //BUGS
            //Sometimes timer doesn't stop after the game has been won
            //Think about solutions to changing opponent user name to "waiting..."
			
			clearNotificationBox();
			clearChatBox();
			$("#readyButton").val("Start Game");			
			
			$('.endOfGame').hide();

            //destroy the game boards
			PlayerGame.destroy();
			OpponentGame.destroy();
			
            //reset the game for another game to start
			resetGame();
			
			//updates timer to 00:00
			var display = document.querySelector('#time');
			display.textContent = "00:00";
            
            //resets opponent username label
            document.getElementById("opponentUserName").innerHTML = "waiting...";
            
            //re-add client to a game
            socket.emit('add player', username);
		});

		$("#main-menu").click(function(){
			
			clearNotificationBox();
			clearChatBox();
			$("#readyButton").val("Start Game");
			
			$('.endOfGame').hide();

			PlayerGame.destroy();
			OpponentGame.destroy();

			socket.emit('game over main menu', username);

			//hides Game screen, shows menu screen
			$('#gameScreen').hide();
			$('#menuScreen').show();
			
			$('#usernameInput').val('');
		});
        //----END GAME OVER BUTTONS------------------------------------------------------------------
	}
};