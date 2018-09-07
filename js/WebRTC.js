var peer = null;
var conn = null;

function initializePeer(callback) {
  peer = new Peer({ key: '85a2adb9-746e-412b-b4ef-aca08e8ffcf0' });
  peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);
    $("#peer_id_label").text(id)
    peer.on('connection', function(conn_data) {
      conn = conn_data;
      conn.on('open', function() {
        // メッセージを受信
        conn.on('data', function(data) {
          $('#log').prepend("<p>" + data + "</p>");
          console.log('Received', data);
        });
      });
    });
  });

}

$('#connect_btn').on('click', function() {
  let input_id = $('#peer_id_input').val();
  conn = peer.connect(input_id, {
    metadata: {
      hoge: "foobar",
    }
  });
  conn.on('open', function() {

    // メッセージを送信
    conn.send('Hello!');
  });
});

$('#send_msg_btn').on('click', function() {
  if(conn != null) {
    // メッセージを送信
    conn.send($('#message_input').val());
  }
});
