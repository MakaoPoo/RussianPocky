$(function() {
  peer = new Peer({ key: '85a2adb9-746e-412b-b4ef-aca08e8ffcf0' });
  peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);
  });
  console.log("あああ");

});
