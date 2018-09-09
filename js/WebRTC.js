class WebRTC {
  constructor() {
    this.peer = null;
    this.peerProcessing = false;
    // this.lobby = null;
    // this.roomList = {};
    this.room = null;
    this.roomProcessing = false;
    this.memberList = {};
    this.messageList = [];
    this.callback = {};
  }

  connectSkyway(id, callback = {}) {
    if(this.checkProcessing()) {
      return;
    }
    if(this.peer != null) {
      alert(this.peer.id + "で接続しています");
      console.log(this.peer.id + "で接続しています");
      return;
    }

    this.peerProcessing = true;
    this.peer = new Peer(id,
      { key: 'ec4d0c86-ae0b-4313-b813-2b0511a60a42' }
    );

    let webRTC = this;
    this.peer.on('open', function(data_id) {
      webRTC.peerProcessing = false;
      console.log("Skywayに接続");
      console.log('あなたのID: ' + data_id);

      webRTC.trigger("connect", this);

      this.on('close', function() {
        webRTC.peerProcessing = false;
      });
    });
    this.peer.on('error', function(err) {
      webRTC.peerProcessing = false;
      webRTC.roomProcessing = false;
      switch(err.type) {
        case "invalid-key":
        alert("APIキーが不正です");
        console.log("APIキーが不正です");
        break;

        case "room-error":
        alert("ルームエラーです");
        console.log("ルームエラーです");
        break;

        case "unavailable-id":
        alert("IDが不正です");
        console.log("IDが不正です");
        break;

        case "peer-unavailable":
        alert("Peerが不正です");
        console.log("Peerが不正です");
        break;

        default:
        console.log(err.type);
      }
      webRTC.trigger("error", err.type);
      webRTC.destroyPeer();
    });
  }
  //
  // joinLobby(callback = {}) {
  //   if(peer == null || peer.isDisconnected) {
  //     console.log("Peer is not connected Skyway");
  //     return;
  //   }
  //   this.lobby = this.peer.joinRoom("MakaoPooGamesLobby");
  //   this.lobby.on('open', function() {
  //     console.log("Join lobby");
  //     if(typeof(callback["open"]) == "function") {
  //       callback["open"](data);
  //     }
  //     this.lobby.on('data', function(data) {
  //       console.log(data);
  //       if(typeof(callback["data"]) == "function") {
  //         callback["data"](data);
  //       }
  //     });
  //     this.lobby.on('error', function(err) {
  //       console.log(err);
  //       if(typeof(callback["error"]) == "function") {
  //         callback["error"](err);
  //       }
  //     })
  //     this.lobby.on('peerJoin', function(id) {
  //       console.log(id + " join");
  //       if(typeof(callback["join"]) == "function") {
  //         callback["join"](id);
  //       }
  //     })
  //     this.lobby.on('peerLeave', function(id) {
  //       console.log(id + " leave");
  //       if(typeof(callback["leave"]) == "function") {
  //         callback["leave"](id);
  //       }
  //     })
  //   });
  // }

  joinRoom(roomName) {
    if(this.checkProcessing()) {
      return;
    }
    if(this.peer == null || this.peer.isDisconnected) {
      alert("Skywayに接続されていません");
      console.log("Skywayに接続されていません");
      return;
    }
    if(roomName == "") {
      alert("ルーム名が入力されていません");
      console.log("ルーム名が入力されていません");
      return;
    }
    if(this.room != null) {
      alert(this.room.name + "に入室しています");
      console.log(this.room.name + "に入室しています");
      return;
    }
    this.roomProcessing = true;
    this.initDataList();
    this.room = this.peer.joinRoom(roomName);

    let webRTC = this;
    this.room.on('open', function() {
      webRTC.roomProcessing = false;
      webRTC.openRoom();
      this.on('data', function(data) {
        webRTC.categorizeData(data);
      });
      this.on('peerJoin', function(id) {
        webRTC.addMember(id);
      })
      this.on('peerLeave', function(id) {
        webRTC.deleteMember(id);
      })
      this.on('close', function() {
        webRTC.roomProcessing = false;
      });
      this.on('log', function(logList) {
        for(let logJson of logList) {
          let log = JSON.parse(logJson);
          switch(log.messageType) {
            case "ROOM_USER_JOIN":
            webRTC.addMember(log.message.src)
            break;

            case "ROOM_USER_LEAVE":
            webRTC.deleteMember(log.message.src)
            break;

            case "ROOM_DATA":
            webRTC.categorizeData(log.message);
            break;
          }
        }
      });
    });
  }

  updateRoomData() {
    if(this.checkProcessing()) {
      return;
    }
    if(this.room != null) {
      this.room.getLog();
    }
  }

  sendData(inType, inData) {
    if(this.checkProcessing()) {
      return;
    }
    if(this.room == null) {
      alert("ルームに入室していません");
      console.log("ルームに入室していません");
      return;
    }
    let data = {
      type: inType,
      data: inData
    };
    let message = {
      src: this.peer.id,
      data: data
    };
    if(this.room != null) {
      this.room.send(data);
    }
    this.categorizeData(message);
  }

  addMember(id) {
    if(this.checkProcessing()) {
      return;
    }
    let data = {
      type: "msg",
      data: "入室"
    };
    let message = {
      src: id,
      data: data
    };
    this.categorizeData(message);
    this.memberList[id] = "exist";
    this.trigger("member", this.memberList);
  }

  deleteMember(id) {
    if(this.checkProcessing()) {
      return;
    }
    let data = {
      type: "msg",
      data: "退室"
    };
    let message = {
      src: id,
      data: data
    };
    this.categorizeData(message);
    delete this.memberList[id];
    this.trigger("member", this.memberList);
  }

  categorizeData(message) {
    if(this.checkProcessing()) {
      return;
    }
    switch(message.data.type) {
      case "msg":
      this.messageList.push({
        src: message.src,
        msg: message.data.data
      });
      this.trigger("message", this.messageList);
      break;
    }
  }

  trigger(funcName, data = null) {
    if(typeof this.callback[funcName] === 'function') {
      this.callback[funcName](data);
    }
  }

  on(funcName, func) {
    if(typeof func === 'function') {
      this.callback[funcName] = func;
    }
  }

  openRoom() {
    if(this.room != null) {
      this.trigger("open", this.room);
    }
    this.room.getLog();
  }

  closeRoom() {
    if(this.checkProcessing()) {
      return;
    }
    if(this.room != null) {
      webRTC.roomProcessing = true;
      this.initDataList();
      this.trigger("close");
      this.room.close();
      this.room = null;
    }
  }

  destroyPeer() {
    if(this.checkProcessing()) {
      return;
    }
    if(this.peer != null) {
      webRTC.peerProcessing = true;
      this.initDataList();
      this.trigger("destroy");
      this.peer.disconnect();
      this.peer.destroy();
      this.peer = null;
      this.room = null;
    }
  }

  checkProcessing() {
    if(this.peerProcessing) {
      alert("Peerの処理中です");
      console.log("Peerの処理中です");
      return true;
    }
    if(this.roomProcessing) {
      alert("Roomの処理中です");
      console.log("Roomの処理中です");
      return true;
    }
    return false;
  }

  initDataList() {
    for(var member in this.memberList){
      delete this.memberList[member];
    }
    this.messageList.splice(0, this.messageList.length);
  }

  getPeerID() {
    if(this.peer != null) {
      return this.peer.id;
    }
    return null;
  }

  get roomMember() {
    if(this.room != null) {
      return this.memberList;
    }
    return {};
  }

  get roomMessage() {
    if(this.room != null) {
      return this.messageList;
    }
    return new Array(0);
  }
}
