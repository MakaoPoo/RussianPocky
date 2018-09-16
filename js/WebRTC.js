class WebRTC {
  constructor() {
    this.peer = null;
    this.peerProcessing = false;
    this.room = null;
    this.roomProcessing = false;
    this.memberList = {};
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
    let peer = new Peer(id,
      { key: 'ec4d0c86-ae0b-4313-b813-2b0511a60a42' }
    );

    let webRTC = this;
    peer.on('open', function(data_id) {
      webRTC.peer = this;
      webRTC.peerProcessing = false;
      console.log("Skywayに接続");
      console.log('あなたのID: ' + data_id);

      webRTC.trigger("connect", this);

      this.on('close', function() {
        webRTC.room = null;
        webRTC.peer = null;
        webRTC.peerProcessing = false;
      });
    });
    peer.on('error', function(err) {
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
        console.log(err);
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

  joinRoom(roomName, option) {
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
    let room = this.peer.joinRoom(roomName, {metadata: option});

    let webRTC = this;
    room.on('open', function(a) {
      webRTC.room = this;
      webRTC.roomProcessing = false;

      console.log(this.connections);
      if(Object.keys(this.connections).length+1 > this._options.metadata.memberMax) {
        console.log("満員");
        webRTC.closeRoom();
      }

      webRTC.openRoom();
      this.getLog();

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
        webRTC.room = null;
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
    let memberData = {
      ready: false,
      comment: "よろしく"
    }
    this.memberList[id] = memberData;
    this.trigger("member", this.memberList);
  }

  deleteMember(id) {
    if(this.checkProcessing()) {
      return;
    }
    delete this.memberList[id];
    this.trigger("member", this.memberList);
  }

  categorizeData(message) {
    if(this.checkProcessing()) {
      return;
    }
    switch(message.data.type) {
      case "msg":
      this.memberList[message.src].comment = message.data.data;
      this.trigger("message", this.memberList);
      break;

      case "ready_flag":
      this.memberList[message.src].ready = message.data.data;
      this.trigger("ready_flag", this.memberList);
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
  }

  closeRoom() {
    if(this.checkProcessing()) {
      return;
    }
    if(this.room != null) {
      webRTC.roomProcessing = true;
      this.trigger("close");
      this.room.close();
    }
  }

  destroyPeer() {
    if(this.checkProcessing()) {
      return;
    }
    if(this.peer != null) {
      webRTC.peerProcessing = true;
      this.trigger("close");
      this.trigger("destroy");
      this.peer.disconnect();
      this.peer.destroy();
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

  getPeerID() {
    if(this.peer != null) {
      return this.peer.id;
    }
    return null;
  }

  getRoomMember() {
    if(this.room != null) {
      return this.memberList;
    }
    return {};
  }

  getPeer() {
    return this.peer;
  }

  getRoom() {
    return this.room;
  }
}
