let data = {}
let userID = null;
let roomID = null;

$(window).on('keydown', function(e) {
  if(e.keyCode == 32){
    console.log(data.users);
    console.log(data.rooms);
    console.log(data.members);
  }
});

$(window).on('load', function() {
  var config = {
    apiKey: "AIzaSyCwmU21RNBHW1J37_Yzty0nlq2uJIx037Q",
    authDomain: "makapoogames-russianpocky.firebaseapp.com",
    databaseURL: "https://makapoogames-russianpocky.firebaseio.com",
    projectId: "makapoogames-russianpocky",
    storageBucket: "makapoogames-russianpocky.appspot.com",
    messagingSenderId: "1072136120076"
  };
  firebase.initializeApp(config);
  firebase.functions().useFunctionsEmulator('http://localhost:5000')
  let database = firebase.database();
  database.ref('/users').on('value', function(snapshot) {
    data.users = snapshot.val();
    console.log("users", snapshot.val());
  });
  database.ref('/rooms').on('value', function(snapshot) {
    data.rooms = snapshot.val();
    console.log("rooms", snapshot.val());
  });
});

$('#connect_btn').on('click', function() {
  userID = $('#user_id_input').val();
  if(typeof data.users == 'undefined') {
    alert("ユーザ情報が取得されていません");
    return;
  }
  if(userID == "") {
    alert("ユーザIDを入力してください");
    return;
  }
  if(isLogin(userID)) {
    alert("既にログインしているIDです");
    return
  }

  let userData = firebase.database().ref('users/'+userID);
  userData.update({
    login: true
  });

  $('.page').css("display", "none");
  $('#room_page').css("display", "block");
  $('#user_id_label').text(userID);
  $('.room_header-close').css("display", "none");
  $('.room_header-join').css("display", "block");
});

$('#disconnect_btn').on('click', function() {
  closeRoom();
  logout();
  $('.page').css("display", "none");
  $('#login_page').css("display", "block");
  $('#user_id_label').text("ID");
  $('#log').empty();
});

$('#join_btn').on('click', function() {
  roomID = $('#room_name_input').val();
  let membersData = firebase.database().ref('members/'+roomID);
  let roomsData = firebase.database().ref('rooms/'+roomID);

  membersData.once('value')
  .then(function(snapshot) {
    data.members = snapshot.val();
    if(data.members == null) {
      return true;
    }
    if(data.rooms == null || data.rooms[roomID] == null) {
      return true;
    }
    let memberNum = Object.keys(data.members).length;
    let room = data.rooms[roomID];
    if(memberNum >= room.max) {
      alert("ルームが満員です");
      return false;
    }
    console.log("memberNum", memberNum);
    return true;
  })
  .then(function(canJoin) {
    if(!canJoin) {
      return;
    }

    roomsData.update({
      max: 2
    });

    membersData.update({
      [userID]:{ready: false}
    });
    membersData.on('value', function(snapshot) {
      data.members = snapshot.val();
      console.log("members", snapshot.val());

      $('.room_member_list').empty();
      for(let name in data.members) {
        let p_name = $('<p class="member_name">');
        let p_ready = $('<p class="member_ready">');
        let div_member = $('<div class="room_member">');
        p_name.text(name);
        if(data.members[name].ready){
          p_ready.text("Ready");
        }else {
          p_ready.text("");
        }
        div_member.append(p_name);
        div_member.append(p_ready);
        $('.room_member_list').append(div_member);
      }
    });
    let roomName = $('#room_name_input option:selected').text();

    $('.room_header-join').css("display", "none");
    $('.room_header-close').css("display", "block");
    $('#room_name_label').text(roomName);
  });
});

$('#close_btn').on('click', function() {
  closeRoom();

  $('.room_header-close').css("display", "none");
  $('.room_header-join').css("display", "block");
  $('.room_member_list').empty();
});

$('input[type="range"]').on('input', function() {
  let label = $(this).prev('.range_label');
  label.text($(this).val());
});

$('.left_btn').on('click', function() {
  let range = $(this).nextAll('input[type="range"]').first();
  let label = $(this).nextAll('.range_label').first();
  let num = Number(range.val());
  let min = Number(range.attr("min"));
  if(min < num) {
    num -= 1;
  }
  range.val(num);
  label.text(num)
});

$('.right_btn').on('click', function() {
  let range = $(this).nextAll('input[type="range"]').first();
  let label = $(this).nextAll('.range_label').first();
  let num = Number(range.val());
  let max = Number(range.attr("max"));
  if(max > num) {
    num += 1;
  }
  range.val(num);
  label.text(num)
});

$('#ready_btn').on('click', function() {
  if(roomID == null) {
    return;
  }

  let membersData = firebase.database().ref('members/'+roomID);
  let ready = data.members[userID].ready;

  membersData.update({
    [userID]:{ready: !ready}
  });
});

$(window).on('unload', function() {
  closeRoom();
  logout();
});

function getUsers(){
  let database = firebase.database().ref('/users');
  database.once('value', function(snapshot) {
    users = snapshot.val();
    console.log("users", snapshot.val());
  });
}

function isLogin(userID) {
  if(userID == null || data.users==null || data.users[userID] == null) {
    return false;
  }
  return data.users[userID].login;
}

function closeRoom() {
  if(roomID == null) {
    return;
  }

  let membersData = firebase.database().ref('members/'+roomID);
  membersData.update({
    [userID]: null
  });
  membersData.off('value');
  delete data.members;
  roomID = null;
}

function logout() {
  if(!isLogin(userID)) {
    return;
  }
  let userData = firebase.database().ref('users/'+userID);
  userData.set(null);
  userID = null;
}
