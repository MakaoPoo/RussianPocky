class WebRTC {
  constructor() {
    this.peer = null;
    // this.lobby = null;
    // this.roomList = {};
    this.room = null;
    this.memberList = {};
    this.messageList = [];
    this.callback = {};
  }

  connectSkyway(id, callback = {}) {
    if(this.peer != null) {
      if(this.peer.id === id) {
        console.log(id + "で既に接続しています");
        return;
      }else {
        this.destroyPeer();
      }
    }
    this.peer = new Peer(id,
      { key: 'ec4d0c86-ae0b-4313-b813-2b0511a60a42' }
    );

    let webRTC = this;
    this.peer.on('open', function(data_id) {
      console.log("Skywayに接続");
      console.log('あなたのID: ' + data_id);

      webRTC.trigger("connect", this);
    });
    this.peer.on('error', function(err) {
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
    if(this.peer == null || this.peer.isDisconnected) {
      console.log("Skywayに接続されていません");
      return;
    }
    if(roomName == "") {
      console.log("ルーム名が入力されていません");
      return;
    }
    if(this.room != null) {
      if(this.room.name === roomName) {
        console.log(roomName + "には既に入室しています");
        return;
      }else {
        this.closeRoom();
      }
    }
    this.room = this.peer.joinRoom(roomName);

    let webRTC = this;
    this.room.on('open', function() {
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
    if(this.room != null) {
      this.room.getLog();
    }
  }

  sendData(inType, inData) {
    if(this.room == null) {
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
    for(var member in this.memberList){
      delete this.memberList[member];
    }
    this.messageList.splice(0, this.messageList.length);
    if(this.room != null) {
      this.trigger("close");
      this.room.close();
      this.room = null;
    }
  }

  destroyPeer() {
    this.closeRoom();
    if(this.peer != null && !this.peer.isDisconnected) {
      this.trigger("destroy");
      this.peer.disconnect();
      this.peer.destroy();
      this.peer = null;
    }
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
