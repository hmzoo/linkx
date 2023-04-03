
import Peer from 'peerjs';
import axios from 'axios';
import localstore from 'store2';
axios.defaults.withCredentials = true;

const site_host = import.meta.env.VITE_SITE_HOST || "slufe.com"
const site_title = import.meta.env.VITE_SITE_TITLE || "SLUFE"
const env_test = import.meta.env.VITE_ENV_TEST || "ENV_TEST"


//////////////////// STORE

export const linkxStore = {
    camOn: localstore("camOn") == null || localstore("camOn"),
    micOn: !(localstore("micOn") == null) || localstore("micOn"),
    camlabel: "",
    miclabel: "",
    stream_error: "",
    stream:null,
    msg: "",
    key: "000000",
    site_host: site_host,
    site_title: site_title,
    flux: [],
    messages: [],
    showme: localstore("showme") == null || localstore("showme") ,
    last_tik: Date.now(),
    env_test: env_test,
    set_stream_status(data){
        this.camOn=data.cam
        this.micOn=data.mic
        this.stream_error=data.error
        this.stream=data.stream 
        this.camlabel=data.camlabel
        this.miclabel=data.miclabel
      },
      set_stream_labels(v,a){
        this.camlabel=v
        this.miclabel=a

      },
      start_stream(){
        slufe_stream_start(this.camOn,this.micOn)
      },
      switchcam() {
        this.camOn = !this.camOn;
        this.start_stream()
      },
      switchmic() {
        this.micOn = !this.micOn;
        this.start_stream()
      },
      swapcam() {
        this.camlabel = nextCam();
        this.start_stream()
      },
      swapmic() {
        this.miclabel = nextMic();
        this.start_stream()
      },
      set_key_msg(k,m){
        this.key=k| "no key";
        this.msg=m|| "" 
      },

    hb() {
        axios.get('/hb').then(res => {
            update_data(res.data);
        })
    },
    renew() {
        reset_mypeer();
        axios.get('/new').then(res => {
            update_data(res.data);
            init_mypeer();
        })
    },
    set(v) {
        axios.get('/set', { params: { val: v } }).then(res => {
            update_data(res.data);
        })
    },
    add(k) {
        axios.get('/add', { params: { key: k } }).then(res => {
            update_data(res.data);
        })
    },
    clean() {
        axios.get('/clean').then(res => {
            update_data(res.data);
        })
    },
    tik() {
        this.last_tik = Date.now()
    },
    update_flux() {

        let tab = peers.map((e) => { return { id: e.id, keynum: e.keynum, stream: e.stream || fakestream, message: e.message, connected: e.connected, me: false } });


         tab.push({ id: myPeer.id, keynum: this.key, stream: slufe_stream_muted || fakestream, message: mymessage, connected: true, me: true })

        this.flux = tab.sort((a, b) => (a.keynum > b.keynum) ? 1 : -1)


    },
    update_messages(m) {
        this.messages.splice(0, this.messages.length, ...m)
    },
    message(k, m, c) {
        if (m != "") {
            this.messages.push({ keynum: k, msg: m, cat: c })
        }
    },

    send_message(msg) {
        mymessage = msg;
        this.message(this.key, msg, "me");
        for (let i = 0; i < peers.length; i++) {
            if (peers[i].connection && peers[i].connection.open) {
                peers[i].connection.send({ keynum: this.key, msg: msg })
            }
        }
    },
    send_stream() {
    
            for (let i = 0; i < peers.length; i++) {
                if (myPeer && peers[i].connection && peers[i].connection.open) {
                    if (peers[i].call) { peers[i].call.close() }
                    init_call(peers[i].id);
                }
            }
    },
    switchshowme() {  
        this.showme = !this.showme;
        localstore("showme",this.showme)
    },
    init_peer() {
        reset_mypeer();
        init_mypeer();
    },
    reset_peer() {
        reset_mypeer();
    },
    synchro() {
        synchro_fwl_peers();
    },
    onleave(){
        reset_mypeer();
        localstore("showme",this.showme)
        localstore("micOn",this.micOn)
        localstore("camOn",this.camOn)
        localstore("audioIndex",audioIndex) 
        localstore("videoIndex",videoIndex) 
        localstore("audioId",audioId) 
        localstore("videoId",videoId) 
    }
}
////////////GETMEDIA
let slufe_stream_status = { stream:null,cam: false, mic: false, camlabel: "", miclabel: "", error: "" };
let slufe_stream =null;
let slufe_stream_muted =null;
let videoDevices = [];
let audioDevices = [];
let videoIndex = localstore("videoIndex") || 0;
let audioIndex = localstore("audioIndex") || 0;
let videoId = localstore("videoId") || "";
let audioId = localstore("audioId") || "";

const slufe_stream_start=(camOn, micOn)=>{
        slufe_stream_status = { cam: camOn, mic: micOn, miclabel: curMic(),camlabel: curCam(), error: "" };
        slufe_stream_kill()
        if (micOn || camOn) {
          navigator.mediaDevices
            .getUserMedia(getConstrains(camOn, micOn))
            .then(s => {
              
              listDevices();
              slufe_stream= s;
              slufe_muted_stream();
              linkxStore.set_stream_status({ stream:s,cam: camOn, mic: micOn,miclabel: curMic(), camlabel: curCam(), error: "" });
              linkxStore.send_stream();
            })
            .catch(error => {
                console.log(error)
                let stream_error = "⚠\nMay the browser didn't support or there is some errors.\n Or \n Camera not authorized. please check your media permissions settings"
                linkxStore.set_stream_status({ stream:null,cam: false, mic: false, miclabel: curMic(),camlabel: curCam(), error: stream_error });
                slufe_stream_kill()
            })
        } else { 
            slufe_stream_kill()
            linkxStore.set_stream_status({ stream:null,cam: false, mic: false, miclabel: curMic(),camlabel: curCam(), error: "" });
         }
      }

const slufe_muted_stream=()=>{
    if (slufe_stream) {
       slufe_stream_muted =  slufe_stream.clone()

             let audiotracks = slufe_stream_muted.getAudioTracks();
            if (audiotracks.length > 0) { slufe_stream_muted.removeTrack(audiotracks[0]); }
      }

}

const slufe_stream_kill=()=>{
    if (slufe_stream) {
        slufe_stream.getTracks().forEach(track => { track.stop() })
        slufe_stream = null
      }
      if (slufe_stream_muted) {
        slufe_stream_muted.getTracks().forEach(track => { track.stop() })
        slufe_stream_muted = null
      }
}

const listDevices = () => {
    if (videoDevices.length == 0) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            audioDevices = devices.filter(device => device.kind === 'audioinput');
            videoDevices = devices.filter(device => device.kind === 'videoinput');
            linkxStore.set_stream_labels(curCam(),curMic())
        }).catch(error => { console.log(error) });
    }
    
}
let getConstrains = (camOn, micOn) => {
    let audio ={ echoCancellation: true }
    let video = true
    if(videoId !=""){video={deviceId: { exact: videoId  }}}
    if(audioId !=""){audio.deviceId= { exact: audioId  }}
    let constrains = { audio:audio , video:video }
    if (!camOn) { constrains.video = false }
    if (!micOn) { constrains.audio = false }
    return constrains
}
let curCam = () => {
    if (videoDevices.length == 0) { return "default" }
    return videoDevices[videoIndex].label
}
let curMic = () => {
    if (audioDevices.length == 0) { return "default" }
    return audioDevices[audioIndex].label
}
let nextCam = () => {
    if (videoDevices.length == 0) { return "default" }
    let oldid = videoDevices[videoIndex].deviceId
    videoIndex = (videoIndex + 1) % videoDevices.length
    if (oldid == videoDevices[videoIndex].deviceId) { videoIndex = (videoIndex + 1) % videoDevices.length }
    videoId=videoDevices[videoIndex].deviceId
    return videoDevices[videoIndex].label
}
let nextMic = () => {
    if (audioDevices.length == 0) { return "default" }
    let oldid = audioDevices[audioIndex].deviceId
    audioIndex = (audioIndex + 1) % audioDevices.length
    if (oldid == audioDevices[audioIndex].deviceId) { audioIndex = (audioIndex + 1) % audioDevices.length }
    audioId=audioDevices[audioIndex].deviceId
    return audioDevices[audioIndex].label
}

////////////FWL

let slufe_key = "000000"
let slufe_fwl = []

const update_data = (data) => {
    slufe_key = data.key || "no key";
    slufe_fwl = data.fwl || [];
    linkxStore.set_key_msg(slufe_key,data.msg || "")
}

///////////PEERJS


let myPeer = null;
let peers = []
let failed_peerid = [];
let mymessage = "";



const createfakestream = () => {
    let color1 = "#24A8AC", color2 = "#0087CB";
    let numberOfStripes = 30;
    let w = 640
    let h = 400;
    const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
    const cxt = canvas.getContext('2d');
    //cxt.fillStyle = 'grey';
    //cxt.fillRect(0, 0, 320, 200);
    for (var i = 0; i < numberOfStripes; i++) {
        var thickness = h / numberOfStripes;
        cxt.beginPath();
        cxt.strokeStyle = i % 2 ? color1 : color2;
        cxt.lineWidth = thickness;

        cxt.moveTo(0, i * thickness + thickness / 2);
        cxt.lineTo(w, i * thickness + thickness / 2);
        cxt.stroke();
    }
    const stream = canvas.captureStream(25);
    const vtrack = stream.getVideoTracks()[0];
    const videoTrack = Object.assign(vtrack, { enabled: true });
    return new MediaStream([videoTrack]);
}
let fakestream = createfakestream()

const new_peer = (id) => {
    var index = peers.map(function (e) { return e.id; }).indexOf(id);
    if (index < 0) {
        let keynum = "000000" 
        let ifwl = slufe_fwl.map(function (e) { return e.d; }).indexOf(id);
        if (ifwl >= 0) { keynum = slufe_fwl[ifwl].k }
        index = peers.push({ id: id, keynum: keynum, stream: null, message: "", connection: null, call: null, connected: false, called: false, streamid: "", cpt: 0 }) - 1;
    }
    return peers[index];
}

const remove_peer = (id) => {
    var index = peers.map(function (e) { return e.id; }).indexOf(id);
    if (index >= 0) {
        if (peers[index].connection && peers[index].connection.open) {
            peers[index].connection.close();
        }
        if (peers[index].call && peers[index].call.open) {
            peers[index].call.close();
        }
        peers = peers.filter(function (obj) {
            return obj.id !== id;
        });
    }
}

// Connections
const onConnectionOpen = (p, cxn) => {
    p.connection = cxn
    p.connected = true
    cxn.send({ keynum: slufe_key });
    linkxStore.message(p.keynum, "connected", "info")
    init_call(cxn.peer,slufe_stream)
}

const onConnectionData = (p, data) => {
    if (data.keynum) { p.keynum = data.keynum }
    if (data.msg) {
        p.message = data.msg
        linkxStore.message(p.keynum, data.msg, "peer")
    }
    if (data.ask && data.ask == "callme" && linkxStore.getmystream()) {
        // init_call(cxn.peer, store.stream);
    }
}

const onConnectionClose = (p) => {
    p.connected = false
    linkxStore.message(p.keynum, "connection closed", "info")
}

// Calls
const onCallStream = (p, call, stream) => {
    p.call = call
    p.called = true;
    if (stream ) {
        p.stream = stream
    }
}

const onCallStop = (p) => {
    p.called = false;
    p.called = false;
    if (p.stream) {
        p.stream.getTracks().forEach(track => { track.stop() })
        p.stream = null;
    }
    p.call = null;
}




const init_mypeer = () => {
    myPeer = new Peer()
    myPeer.on('open', (id) => {
        linkxStore.set(id);
        myPeer.on('connection', (cxn) => {
            let p = new_peer(cxn.peer);
            cxn.on('open', () => { onConnectionOpen(p, cxn) })
            cxn.on('data', (data) => { onConnectionData(p, data) })
            cxn.on('close', () => { onConnectionClose(p) })
        })
        myPeer.on('call', (call) => {
            let p = new_peer(call.peer);
            if (slufe_stream) {
                call.answer(slufe_stream)
            } else {
                call.answer()
            }
            call.on('stream', (stream) => { onCallStream(p, call, stream) })
            call.on('close', () => { onCallStop(p) })
            call.on('error', (err) => { console.log(err); onCallStop(p) })
        })

        myPeer.on('close', () => {
            remove_peer(id);
        })
        myPeer.on('error', (err) => {

            let serr = err.toString();
            if (serr.length > 34) {
                let err_msg = serr.substring(0, 32);
                if (err_msg == "Error: Could not connect to peer") {
                    let err_id = serr.substring(33);
                    // failed_peerid.push(err_id);
                }
            }
            remove_peer(id);
        })
    })
}

const reset_mypeer = () => {
    if (myPeer != null) {
        for (let i = 0; i < peers.length; i++) {
            if (peers[i] && peers[i].connection && peers[i].connection.open) {
                peers[i].connection.close()
            }
            if (peers[i] && peers[i].call && peers[i].call.open) {
                peers[i].call.close()
            }
        }
        peers = [];
        myPeer.destroy();
    }
}

const init_connection = (pid, k) => {
    let cxn = myPeer.connect(pid)
    if (cxn) {
        let p = new_peer(cxn.peer);
        p.keynum = k;
        cxn.on('open', () => { onConnectionOpen(p, cxn) })
        cxn.on('data', (data) => { onConnectionData(p, data) })
        cxn.on('close', () => { onConnectionClose(p) })
    }
}

const init_call = (pid) => {
    
    let call

    if (slufe_stream) {
        call = myPeer.call(pid, slufe_stream );
    } else {
        //call = myPeer.call(pid, createfakestream());
    }

    if (call) {
        let p = new_peer(call.peer);
        call.on('stream', (stream) => { onCallStream(p, call, stream) })
        call.on('close', () => { onCallStop(p) })
        call.on('error', (err) => { console.log(err); onCallStop(p) })
    }
}



const synchro_fwl_peers = () => {
    
    for (let i = 0; i < slufe_fwl.length; i++) {
        let f = slufe_fwl[i];
        var index = peers.map(function (e) { return e.id; }).indexOf(f.d);
        if (index < 0) {
            init_connection(f.d, f.k);
            //init_call(f.d, store.stream);
        } else {
            let p = peers[index]
            if (p.connected == false && p.cpt < 20) { p.cpt = p.cpt + 1; init_connection(f.d, f.k); }
            //if (p.called == false && p.cpt < 20) { p.cpt = p.cpt + 1; init_call(f.d, store.stream); }
            p.keynum = f.k;
        }

    }
    let todelete = [];

    for (let i = 0; i < peers.length; i++) {
        var index = slufe_fwl.map(function (e) { return e.d; }).indexOf(peers[i].id);
        if (index < 0) {
            todelete.push(peers[i].id)
        }
    }

    for (let i = 0; i < todelete.length; i++) {
        remove_peer(todelete[i]);
    }

    linkxStore.update_flux();

}





