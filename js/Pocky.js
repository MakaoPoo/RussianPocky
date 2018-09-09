var webRTC = new WebRTC();

$(window).on('load', function() {

});

webRTC.on('message', function(data) {
  $('#log').empty();
  for(let msg of data) {
    let myID = webRTC.getPeerID();
    let msgP = $('<p>');
    msgP.text+msg.src+": "+msg.msg);
    if(myID == msg.src) {
      msgP.addClass("my_message");
    }
    let msgDiv = $('<div>').append(msgP);
    $('#log').append(msgDiv);
  }
  $('#log_wrapper').scrollTop($('#log').height());
});

webRTC.on('open', function() {
});

webRTC.on('close', function() {
  $('#log').empty();
});

webRTC.on('connect', function(peer) {
  $('#peer_id_label').text(peer.id);
});

webRTC.on('destroy', function() {
  $('#peer_id_label').text("ID:");
});

$('#connect_btn').on('click', function() {
  let peerID = $('#peer_id_input').val();
  webRTC.connectSkyway(peerID);
});

$('#join_btn').on('click', function() {
  let roomName = $('#room_name_input').val();
  webRTC.joinRoom(roomName, {

  })
});
$('#close_btn').on('click', function() {
  webRTC.closeRoom();
});

$('#send_msg_btn').on('click', function() {
  let message = $('#message_input').val();
  webRTC.sendData("msg", message);
});

$(window).on('unload', function() {
  webRTC.destroyPeer();
});
