class LoadingText{
  constructor() {
    this.loadingTextStr = ["N","o","w"," ","L","o","a","d","i","n","g"];
    this.loadingTextCount = 0;
    this.loadingTextFlag = false;

    this.textJumpSpan = 5;
    this.textJumpTime = 30;
    this.textJumpMax = 100;
    this.textJumpWait = 50;

    this.loadEndJoken;
  }

  isLoading() {
    return this.loadingTextFlag;
  }

  setTextState(span, time, max, wait) {
    this.textJumpSpan = span;
    this.textJumpTime = time;
    this.textJumpMax = max;
    this.textJumpWait = wait;
  }

  LoadingStart(joken) {
    $('#loadingText').css('display', 'block');
    this.loadEndJoken = joken;
    this.loadingTextFlag = false;
    this.LoadingTextDraw(this);
  }

  LoadingEnd() {
    $('#loadingText').css('display', 'none');
    this.loadingTextFlag = true;
    let canvas = document.getElementById("loadingText");
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width,  canvas.height);

    if(typeof mainStart == 'function') {
      mainStart();
    }
  }

  LoadingTextDraw(obj) {
    if(obj.loadEndJoken()) {
      obj.LoadingEnd();
      return;
    }

    let canvas = document.getElementById("loadingText");
    let ctx = canvas.getContext('2d');

    canvas.width = $('#loadingText').width();
    canvas.height = $('#loadingText').height();
    let width = canvas.width;
    let height = canvas.height;
    let fontSize = width/10;
    ctx.font =  fontSize+"px 'ＭＳ ゴシック'";
    ctx.fillStyle = "#ffffff";
    ctx.clearRect(0, 0, width, height);
    let textLength = obj.loadingTextStr.length;
    let loadY = new Array(textLength);
    let cx = width/2;
    let cy = height/2;
    let center = obj.textJumpTime/2;

    for(var i=0; i<textLength; i++) {
      if(obj.textJumpSpan*i <= obj.loadingTextCount && obj.loadingTextCount < obj.textJumpSpan*i + obj.textJumpTime) {
        let relCount = obj.loadingTextCount - obj.textJumpSpan*i - center;
        loadY[i] = (center*center - relCount*relCount) / (center*center) * obj.textJumpMax;
      } else {
        loadY[i] = 0;
      }
    }
    obj.loadingTextCount = (obj.loadingTextCount + 1) % (obj.textJumpSpan*(textLength-1) + obj.textJumpTime + obj.textJumpWait);
    for(var i=0; i<textLength; i++) {
      ctx.fillText(obj.loadingTextStr[i], cx+(-(fontSize/2)*(textLength/2) + (fontSize/2)*i), cy+(-loadY[i] + fontSize/2));
    }

    setTimeout(function(){obj.LoadingTextDraw(obj);}, 10);
  }
}
