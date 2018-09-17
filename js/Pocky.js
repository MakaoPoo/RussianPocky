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
  });

  database.ref('/rooms').on('value', function(snapshot) {
    data.rooms = snapshot.val();
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
  userData.onDisconnect().set(null);

  $('.page').css("display", "none");
  $('#room_page').css("display", "block");
  $('#user_id_label').text(userID);
  $('.room_header-close').css("display", "none");
  $('.room_header-join').css("display", "block");
});

$('#disconnect_btn').on('click', function() {
  closeRoom();
  logout();
});

$('#join_btn').on('click', function() {
  roomID = $('#room_name_input').val();
  let membersData = firebase.database().ref('members/'+roomID);

  membersData.once('value')
  .then(function(snapshot) {
    data.members = snapshot.val();
    if(data.members == null) {
      return 0;
    }
    if(data.rooms == null || data.rooms[roomID] == null) {
      return 0;
    }
    let memberNum = Object.keys(data.members).length;
    return memberNum;
  })
  .then(function(memberNum) {
    if(data.rooms == null || data.rooms[roomID] == null) {
      let room = data.rooms[roomID];
      if(memberNum >= room.max) {
        alert("ルームが満員です");
        return;
      }
    }

    let roomsData = firebase.database().ref('rooms/'+roomID);
    let gameSetting = firebase.database().ref('gameSetting/'+roomID);

    if(memberNum == 0) {
      roomsData.update({
        max: 4
      });
      gameSetting.update({
        honsu: 20,
        hazure: 2,
        junban: "random"
      });
    }

    gameSetting.on('value', function(snapshot) {
      data.gameSetting = snapshot.val();

      $('#honsu_range').val(data.gameSetting.honsu);
      $('#honsu_range_label').text(data.gameSetting.honsu);
      $('#hazure_range').val(data.gameSetting.hazure);
      $('#hazure_range_label').text(data.gameSetting.hazure);
      $('input[name="junban"]').prop('checked',false);
      $('input[name="junban"][value="'+data.gameSetting.junban+'"]').prop('checked',true);
    });

    membersData.update({
      [userID]: {ready: false}
    });
    membersData.onDisconnect().update({
      [userID]: null
    });

    membersData.on('value', function(snapshot) {
      data.members = snapshot.val();

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
    $('.room_wrapper').css("display", "flex");
    $('#room_name_label').text(roomName);
  });
});

$('#close_btn').on('click', function() {
  closeRoom();
});

$('input[type="range"]').on('input', function() {
  let label = $(this).prev('.range_label');
  label.text($(this).val());
});

$('input[type="range"]').on('change', function() {
  updateGameSetting($(this));
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

  updateGameSetting(range);
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

  updateGameSetting(range);
});

function updateGameSetting(range) {
  if(roomID != null) {
    let gameSetting = firebase.database().ref('gameSetting/'+roomID);
    let num = Number(range.val());
    if(range.attr("id") == "honsu_range") {
      gameSetting.update({honsu: num});
    }
    if(range.attr("id") == "hazure_range") {
      gameSetting.update({hazure: num});
    }
  }
}

$( 'input[name="junban"]:radio' ).on('change', function() {
  if(roomID == null) {
    return;
  }
  let gameSetting = firebase.database().ref('gameSetting/'+roomID);
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

function getUsers(){
  let database = firebase.database().ref('/users');
  database.once('value', function(snapshot) {
    users = snapshot.val();
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
  let gameSetting = firebase.database().ref('gameSetting/'+roomID);
  membersData.update({
    [userID]: null
  });
  membersData.onDisconnect().cancel();
  membersData.off('value');
  delete data.members;
  gameSetting.off('value');
  delete data.gameSetting;
  roomID = null;

  $('.room_header-close').css("display", "none");
  $('.room_header-join').css("display", "block");
  $('.room_wrapper').css("display", "none");
  $('.room_member_list').empty();
}

function logout() {
  if(!isLogin(userID)) {
    return;
  }
  let userData = firebase.database().ref('users/'+userID);
  userData.set(null);
  userData.onDisconnect().cancel();
  userID = null;

  $('.page').css("display", "none");
  $('#login_page').css("display", "block");
  $('#user_id_label').text("ID");
  $('.room_member_list').empty();
}
