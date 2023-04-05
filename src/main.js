import {linkxStore} from './linkx.js';
import * as _ from 'underscore';


window.linkx=linkxStore;

linkxStore.stream();
linkxStore.init_peer();
linkxStore.req_hb();
window.addEventListener('beforeunload', () => { linkxStore.leave() });
window.setInterval(() => {
  linkxStore.req_hb();
  linkxStore.synchro();
  review();
}, 3000);

var tpl_infos = `<div id="output">
<div><video id="me" style="width:80px"  muted="true" autoplay></video></div>
KEY: <%= my_key %> <br/>
MESSAGE: <%= my_message %> <br/>
<%= medias_cam_on ?  "CAM ON ("+medias_cam_label+")" : "CAM OFF" %><br/>
<%= medias_mic_on ?  "MIC ON("+medias_mic_label+")" : "MIC OFF" %><br/>
INFO: <%= server_message %> <br/>
<% if (medias_stream_error != "") { %> MEDIAS ERROR : <%= medias_stream_error %> <% } %> <br/>
</div>`;
var fcn_infos = _.template(tpl_infos); 

var tpl_messages = `<div id="output2">
MESSAGES :<br/>
<% _.each(messages, function(msg){ %>
<%= msg.keynum %>: <%= msg.msg %> (<%= msg.cat %>)</br>

  <% }); %>
</div>`;
var fcn_messages = _.template(tpl_messages);

const review =()=>{

document.querySelector('#infos').innerHTML = fcn_infos(linkxStore);
document.querySelector('#messages').innerHTML = fcn_messages(linkxStore);
document.getElementById("me").srcObject = linkxStore.my_stream;

//let video = document.getElementById('selfvideo');
//video.srcObject = linkxStore.stream;

}