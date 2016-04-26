function Boardcoordinates(xCoordinate, yCoordinate)
{

    this.xCoordinate = xCoordinate;
    this.yCoordinate = yCoordinate;

};

function Boat(size, BoardCoordinates, key)
{

    BoardCoordinates = convertCoordinates(BoardCoordinates, blockSize);

    var lastStringIndex = key.length - 1;
    var lastTwoChar = key.charAt(lastStringIndex - 1).concat(key.charAt(lastStringIndex));

    var allCoordinates = [];

    if (lastTwoChar == 'ht') //boat is pointing right
    {
        for (var i = 0; i < size; i++)
        {
            var tempC = new Boardcoordinates(BoardCoordinates.xCoordinate + i, BoardCoordinates.yCoordinate);
            allCoordinates.push(tempC);
        }
    }

    if (lastTwoChar == 'wn') //boat is pointing down
    {
        for (var i = 0; i < size; i++)
        {
            var tempC = new Boardcoordinates(BoardCoordinates.xCoordinate, BoardCoordinates.yCoordinate + i);
            allCoordinates.push(tempC);
        }
    }

    if (lastTwoChar == 'ft') //boat is pointing left
    {
        for (var i = 0; i < size; i++)
        {
            var tempC = new Boardcoordinates(BoardCoordinates.xCoordinate - i + size - 1, BoardCoordinates.yCoordinate);
            allCoordinates.push(tempC);
        }
    }

    if (lastTwoChar == 'Up') //boat is pointing up
    {
        for (var i = 0; i < size; i++)
        {
            var tempC = new Boardcoordinates(BoardCoordinates.xCoordinate, BoardCoordinates.yCoordinate + size - 1 - i);
            allCoordinates.push(tempC);
        }
    }

    return allCoordinates;

};

function CheckFire(BoardCoordinates, fireStatus)
{

    this.BoardCoordinates = BoardCoordinates;
    this.fireStatus = fireStatus;

};

function convertCoordinates(bc, blockSize)
{
    bc.xCoordinate /= blockSize;
    bc.yCoordinate /= blockSize;
    return bc;
}

function updateNotificationBox(message)
{

    if (!$.trim($("#notifications").val()))
    { // textarea is empty or contains only white-space
        $("#notifications").val(message);
    }
    else
    {
        $('#notifications').val($('#notifications').val() + "\n" + message);
    }
}

function clearNotificationBox()
{

    $("#notifications").val('');
}

function clearChatBox()
{
	$("#chatBox").val('');
}

function updateActionCircles(actionCounter, totalActions)
{

    $("#actions-remaining-circle span").text(actionCounter + ' / ' + totalActions);
    for (var i = 1; i <= actionCounter; i++)
    {
        var id = '#circle' + i;
        $(id).css("fill", "#FFFFFF");
    }
    for (var i = actionCounter + 1; i <= 10; i++)
    {
        var id = '#circle' + i;
        $(id).css("fill", "#3E3E3E");
    }
}