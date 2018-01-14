var peer;
var connectedPeers = {};
var currentConnection;

function SharePuzzle() 
{
    var peerID = document.getElementById("CoopConnectID").value;
    if (peerID.length > 0) {
        peer = new Peer(peerID, {key: 'xlnoew5r4bjwz5mi'});
    } else {
        peer = new Peer({key: 'xlnoew5r4bjwz5mi'});
    }
    
    peer.on('open', function(id) {
        document.getElementById('CoOpStatusText').innerHTML = "Shared as: " + id;
        document.getElementById('CoOpHeader').style.visibility = "visible";
    });
    
    peer.on('error', function(err) {
        console.log(err);
    });
    
    peer.on('connection', function(c){
        currentConnection = c;
        connectedPeers[c.peer] = 1;
        console.log("Connection received from " + c.peer);
        if (c.label === 'chat') {
            c.on('data', ReceiveData);
            c.on('close', function() {
                alert(c.peer + ' has left the puzzle.');
                delete connectedPeers[c.peer];
            });
        }
    });        
}

function JoinPuzzle() {
    var peerID = document.getElementById("CoopConnectID").value;
    peer = new Peer({key: 'xlnoew5r4bjwz5mi'});
    
    currentConnection = peer.connect(peerID, 
        {label: 'chat',
        serialization: 'none', 
        metadata: { message: 'I want to join the puzzle!'}
    });
    
    currentConnection.on('open', function() {
        document.getElementById('CoOpStatusText').innerHTML = "Joined: " + peerID;
        document.getElementById('CoOpHeader').style.visibility = "visible";

        // Receive messages
        currentConnection.on('data', ReceiveData);
        
        currentConnection.on('error', function(err) { alert(err); });
        
        // Request the full state of the puzzle
        currentConnection.send('_SEND_FULL_STATE');
    });
}

function ReceiveData(data) {
    if (data == '_SEND_FULL_STATE') {
        SendPuzzleFullStateToPeer();
    } else if (data.startsWith('_FULL_STATE:')) {
        var info = data.substring('_FULL_STATE:'.length);
        var fullPuzzle = JSON.parse(info);
        InitializeBoardForPuzzle(fullPuzzle, false);
    }
}

function SendPuzzleFullStateToPeer() {
    if (currentConnection != null) {
        var puzzleString = GetPuzzleAsString();
        currentConnection.send('_FULL_STATE:' + puzzleString);
    }
}

function SendPuzzleEntries() {
    if (currentConnection != null) {
        // TODO: save bandwith and just send over the cell entries instead of the whole puzzle
        var puzzleString = GetPuzzleAsString();
        currentConnection.send('_FULL_STATE:' + puzzleString);
    }
}