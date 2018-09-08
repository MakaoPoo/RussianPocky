var peer = null;
var room = null;
var conn = null;

$('#connect_btn').on('click', function() {
  let peerId = $('#peer_id_input').val();
  connectSkyway(peerId);
});

function connectSkyway(id) {
  peer = new Peer(id ,{ key: '85a2adb9-746e-412b-b4ef-aca08e8ffcf0' });
  peer.on('error', function(err) {
    $('#log').prepend("<p>" + err + "</p>");
    console.log('Received', err);
  })
  peer.on('open', function(data_id) {
    console.log('My peer ID is: ' + data_id);
    $("#peer_id_label").text(data_id)
  });
}

$('#join_btn').on('click', function() {
  let roomName = $('#room_name_input').val();

  room = peer.joinRoom(roomName);
  setupRoom(room);
});
$('#close_btn').on('click', function() {
  if(room != null) {
    room.close();
  }
});

function setupRoom(room) {
  room.on('open', function() {
    room.on('data', function(data) {
      $('#log').prepend("<p>" + data.src + ": " + data.data + "</p>");
    });
    room.on('error', function(err) {
      $('#log').prepend("<p>" + err + "</p>");
      console.log('Received', err);
    })
    room.on('peerLeave', function(id) {
      $('#log').prepend("<p>" + id + "が退室</p>");
    })
    // メッセージを送信
    room.send('Hello!');
  });
}

$('#send_msg_btn').on('click', function() {
  if(room != null) {
    // メッセージを送信
    room.send($('#message_input').val());
  }
});

$(window).on('unload', function() {
  peer.disconnect();
  peer.destroy();
});
