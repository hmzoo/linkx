
import Peer from 'peerjs';
import axios from 'axios';
import localstore from 'store2';
axios.defaults.withCredentials = true;
//axios.defaults.headers.get['Access-Control-Allow-Origin'] = '*';

const site_host = import.meta.env.VITE_SITE_HOST || "linkx.com"
const site_title = import.meta.env.VITE_SITE_TITLE || "LINKX"
const axios_url = ""


//////////////////// UPDATE

let updates = {
    infos: true,
    medias: true,
    stream: true,
    data: true,
    flux: true,
    messages: true,
    list_flux_streams_updated: [],
    list_flux_datas_updated: [],
    list_flux_added: [],
    list_flux_deleted: []
}



let infos_updated = () => { updates.infos = true; linkxStore_update("infos"); }
let medias_updated = () => { updates.medias = true; linkxStore_update("medias"); }
let stream_updated = () => { updates.stream = true; linkxStore_update("stream");if(myPeer && myPeer.id){flux_stream_changed(myPeer.id)} }
let data_updated = () => { updates.data = true; linkxStore_update("data"); }
let messages_updated = () => { updates.messages = true; linkxStore_update("messages"); }
let flux_updated = () => { updates.flux = true; linkxStore_update("flux"); }

let flux_stream_changed = (id) => { updates.list_flux_streams_updated.push(id); linkxStore_update("streams"); }
let flux_data_changed = (id) => { updates.list_flux_datas_updated.push(id); linkxStore_update("datas"); }

let flux_added = (id) => { updates.list_flux_added.push(id); flux_updated(); linkxStore_update("added"); }
let flux_deleted = (id) => { updates.list_flux_deleted.push(id); flux_updated(); linkxStore_update("deleted"); }

let reset_updates = () => {
    let u = updates
    updates = {
        infos: false,
        medias: false,
        stream: false,
        data: false,
        flux: false,
        messages: false,
        list_flux_streams_updated: [],
        list_flux_datas_updated: [],
        list_flux_added: [],
        list_flux_deleted: []
    }
    //console.log("R", u)
    return u;

}
let linkxStore_update = (m) => {
    //console.log("update",m);
    linkxStore.synchro();
    linkxStore.on_update();
};

//////////////////// STORE
export const linkxStore = {

    site_host: site_host,
    site_title: site_title,

    medias_cam_on: localstore("medias_cam_on") == null || localstore("medias_cam_on"),
    medias_mic_on: !(localstore("medias_mic_on") == null) || localstore("medias_mic_on"),
    medias_cam_label: "",
    medias_mic_label: "",
    medias_show_me: localstore("medias_show_me") == null || localstore("medias_show_me"),
    medias_stream_error: "",

    server_message: "",

    my_key: "000000",
    my_stream: null,
    my_message: "",
    my_data: {},

    flux: [],
    messages: [],
    on_update() {
       // console.log("On Update");
    },

    get_updates() {
        return reset_updates();
    },

    stream() {
        stream_start(this.medias_cam_on, this.medias_mic_on)
    },
    switch_cam() {
        this.medias_cam_on = !this.medias_cam_on;
        this.stream()
    },
    switch_mic() {
        this.medias_mic_on = !this.medias_mic_on;
        this.stream()
    },
    swap_cam() {
        this.medias_cam_label = nextCam();
        this.stream()
    },
    swap_mic() {
        this.medias_mic_label = nextMic();
        this.stream()
    },
    switch_show_me() {
        this.medias_show_me = !this.medias_show_me;
        flux_updated();
        localstore("medias_show_me", this.medias_show_me)
    },

    req_hb() {
        axios.get(axios_url + '/hb').then(res => {
            update_data(res.data);
        })
    },
    req_renew() {
        reset_mypeer();
        axios.get(axios_url + '/new').then(res => {
            update_data(res.data);
            init_mypeer();
        })
    },
    req_set(v) {
        axios.get(axios_url + '/set', { params: { val: v } }).then(res => {
            update_data(res.data);
        })
    },
    req_add(k) {
        axios.get(axios_url + '/add', { params: { key: k } }).then(res => {
            update_data(res.data);
        })
    },
    req_clean() {
        axios.get(axios_url + '/clean').then(res => {
            update_data(res.data);
        })
    },

    message(msg) {
        this.my_message = msg;
        this.messages.push({ keynum: this.my_key, msg: this.my_message, cat: "me" })
        messages_updated();
        for (let i = 0; i < peers.length; i++) {
            if (peers[i].connection && peers[i].connection.open) {
                peers[i].connection.send({ keynum: this.my_key, msg: this.my_message })
            }
        }
        
    },
    data(d) {
        this.my_data = d;
        for (let i = 0; i < peers.length; i++) {
            if (peers[i].connection && peers[i].connection.open) {
                peers[i].connection.send({ keynum: this.my_key, data: this.my_data })
            }
        }
        data_updated();
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
    leave() {
        reset_mypeer();
        localstore("medias_show_me", this.medias_show_me)
        localstore("medias_mic_on", this.medias_mic_on)
        localstore("medias_cam_on", this.medias_cam_on)
        localstore("audioIndex", audioIndex)
        localstore("videoIndex", videoIndex)
        localstore("audioId", audioId)
        localstore("videoId", videoId)
    },
    get_flux_id(id) {
        for (let i = 0; i < this.flux.length; i = i + 1) {
            if (id == this.flux[i].id) { return this.flux[i] }
        }
        return null;
    }
}
////////////GETMEDIA

let stream = null;
let stream_muted = null;
let videoDevices = [];
let audioDevices = [];
let videoIndex = localstore("videoIndex") || 0;
let audioIndex = localstore("audioIndex") || 0;
let videoId = localstore("videoId") || "";
let audioId = localstore("audioId") || "";

const stream_start = (medias_cam_on, medias_mic_on) => {
    stream_kill()
    if (medias_mic_on || medias_cam_on) {
        navigator.mediaDevices
            .getUserMedia(getConstrains(medias_cam_on, medias_mic_on))
            .then(s => {

                listDevices();
                stream = s;
                stream_muted = stream.clone()
                let audiotracks = stream_muted.getAudioTracks();
                if (audiotracks.length > 0) { stream_muted.removeTrack(audiotracks[0]); }

                linkx_set_stream_status({ stream: s, cam: medias_cam_on, mic: medias_mic_on, medias_mic_label: curMic(), medias_cam_label: curCam(), error: "" });
                peers_send_stream();
                stream_updated()
            })
            .catch(error => {
                console.log(error)
                let medias_stream_error = "⚠\nMay the browser didn't support or there is some errors.\n Or \n Camera not authorized. please check your media permissions settings"
                linkx_set_stream_status({ stream: null, cam: false, mic: false, medias_mic_label: curMic(), medias_cam_label: curCam(), error: medias_stream_error });
                stream_kill()
            })
    } else {
        stream_kill()
        linkx_set_stream_status({ stream: null, cam: false, mic: false, medias_mic_label: curMic(), medias_cam_label: curCam(), error: "" });
    }
}


const stream_kill = () => {
    if (stream) {
        stream.getTracks().forEach(track => { track.stop() })
        stream = null
    }
    if (stream_muted) {
        stream_muted.getTracks().forEach(track => { track.stop() })
        stream_muted = null
    }
    stream_updated();
}

const listDevices = () => {
    if (videoDevices.length == 0) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            audioDevices = devices.filter(device => device.kind === 'audioinput');
            videoDevices = devices.filter(device => device.kind === 'videoinput');
            linkx_set_stream_labels(curCam(), curMic())
        }).catch(error => { console.log(error) });
    }

}
let getConstrains = (medias_cam_on, medias_mic_on) => {
    let audio = { echoCancellation: true }
    let video = true
    if (videoId != "") { video = { deviceId: { exact: videoId } } }
    if (audioId != "") { audio.deviceId = { exact: audioId } }
    let constrains = { audio: audio, video: video }
    if (!medias_cam_on) { constrains.video = false }
    if (!medias_mic_on) { constrains.audio = false }
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
    videoId = videoDevices[videoIndex].deviceId
    medias_updated();
    return videoDevices[videoIndex].label
}
let nextMic = () => {
    if (audioDevices.length == 0) { return "default" }
    let oldid = audioDevices[audioIndex].deviceId
    audioIndex = (audioIndex + 1) % audioDevices.length
    if (oldid == audioDevices[audioIndex].deviceId) { audioIndex = (audioIndex + 1) % audioDevices.length }
    audioId = audioDevices[audioIndex].deviceId
    medias_updated();
    return audioDevices[audioIndex].label
}

const linkx_set_stream_status = (data) => {
    linkxStore.medias_cam_on = data.cam
    linkxStore.medias_mic_on = data.mic
    linkxStore.medias_stream_error = data.error
    linkxStore.my_stream = data.stream
    linkxStore.medias_cam_label = data.medias_cam_label
    linkxStore.medias_mic_label = data.medias_mic_label
    medias_updated();
}
const linkx_set_stream_labels = (v, a) => {
    linkxStore.medias_cam_label = v
    linkxStore.medias_mic_label = a
    medias_updated();
}

const peers_send_stream = () => {

    for (let i = 0; i < peers.length; i++) {
        if (myPeer && peers[i].connection && peers[i].connection.open) {
            if (peers[i].call) { peers[i].call.close() }
            init_call(peers[i].id);
        }
    }
}

////////////FWL

let key = "000000"
let fwl = []

const update_data = (data) => {
    key = data.key || "no key";
    fwl = data.fwl || [];
    linkxStore.my_key = key
    linkxStore.server_message = data.msg || ""
    infos_updated();
}



///////////PEERJS

let myPeer = null;
let peers = []

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
        let ifwl = fwl.map(function (e) { return e.d; }).indexOf(id);
        if (ifwl >= 0) { keynum = fwl[ifwl].k }
        index = peers.push({ id: id, keynum: keynum, stream: null, message: "", connection: null, call: null, connected: false, called: false, streamid: "", data: {}, cpt: 0 }) - 1;
        flux_added(id)
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
        flux_deleted(id);
    }
}

// Connections
const onConnectionOpen = (p, cxn) => {
    p.connection = cxn
    p.connected = true
    cxn.send({ keynum: key });
    linkx_message(p.keynum, "connected", "info")
    init_call(cxn.peer, stream)
}

const onConnectionData = (p, data) => {
    if (data.keynum) { p.keynum = data.keynum }
    if (data.msg) {
        p.message = data.msg
        linkx_message(p.keynum, data.msg, "peer")
    }
    if (data.data) {
        p.data = data.data
        flux_data_changed(id)
    }
    if (data.ask && data.ask == "callme" && stream) {
        // init_call(cxn.peer, store.stream);
    }
}

const onConnectionClose = (p) => {
    p.connected = false
    linkx_message(p.keynum, "connection closed", "info")
}

// Calls
const onCallStream = (p, call, stream) => {
    p.call = call
    p.called = true;
    if (stream) {
        p.stream = stream
        flux_stream_changed(p.id)
    }
}

const onCallStop = (p) => {
    p.called = false;
    p.called = false;
    if (p.stream) {
        p.stream.getTracks().forEach(track => { track.stop() })
        p.stream = null;
        flux_stream_changed(p.id)
    }
    p.call = null;
}




const init_mypeer = () => {
    myPeer = new Peer()
    myPeer.on('open', (id) => {
        linkxStore.req_set(id);
        myPeer.on('connection', (cxn) => {
            let p = new_peer(cxn.peer);
            cxn.on('open', () => { onConnectionOpen(p, cxn) })
            cxn.on('data', (data) => { onConnectionData(p, data) })
            cxn.on('close', () => { onConnectionClose(p) })
        })
        myPeer.on('call', (call) => {
            let p = new_peer(call.peer);
            if (stream) {
                call.answer(stream)
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
                }
            }
            remove_peer(id);
        })
    })
    flux_updated();
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
            flux_deleted(peers[i].id)
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

    if (stream) {
        call = myPeer.call(pid, stream);
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

    for (let i = 0; i < fwl.length; i++) {
        let f = fwl[i];
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
        var index = fwl.map(function (e) { return e.d; }).indexOf(peers[i].id);
        if (index < 0) {
            todelete.push(peers[i].id)
        }
    }

    for (let i = 0; i < todelete.length; i++) {
        remove_peer(todelete[i]);
    }



    let tab = peers.map((e) => { return { id: e.id, keynum: e.keynum, stream: e.stream || fakestream, message: e.message, connected: e.connected, me: false, data: e.data } });
    if (myPeer && myPeer.id  && linkxStore.medias_show_me) {
        tab.push({ id: myPeer.id, keynum: linkxStore.my_key, stream: stream_muted || fakestream, message: linkxStore.my_message, connected: true, me: true, data: linkxStore.my_data })
      //  if (linkxStore.flux == []) { flux_added(myPeer.id) }
        //if (updates.stream) { flux_stream_changed(myPeer.id) }
       // if (updates.data) { flux_data_changed(myPeer.id) }
    }


    linkxStore.flux = tab.sort((a, b) => (a.keynum > b.keynum) ? 1 : -1)



}

const linkx_message = (k, m, c) => {
    if (m != "") {
        linkxStore.messages.push({ keynum: k, msg: m, cat: c })
        messages_updated()
    }
}





