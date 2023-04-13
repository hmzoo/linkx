import { linkxStore } from './linkx.js';
import * as _ from 'underscore';


window.linkx = linkxStore;

linkxStore.stream();
linkxStore.init_peer();
linkxStore.req_hb();
window.addEventListener('beforeunload', () => { linkxStore.leave() });
window.setInterval(() => {
  linkxStore.req_hb();
  linkxStore.synchro();
  review();
}, 3000);

let submit_addkey =()=>{
  window.linkx.req_add(document.querySelector('#addkey').value);
  return false;
}

let submit_sendmessage =()=>{
  window.linkx.message(document.querySelector('#sendmessage').value);
  return false;
}


var tpl_main = `<div>
<div id="infos"></div>
<div><input type='text' value="" id="addkey" ><button id="btn_addkey" >ADD</button></div>
<div id="my_stream"><video id="me" style="width:80px"  muted="true" autoplay></video></div>
<div id="medias"></div>
<div id="messages"></div>
<div><input type='text' value="" id="sendmessage" ><button id="btn_sendmessage" >SEND</button></div>
<div id="flux"></div>
</div>
`
document.querySelector('#app').innerHTML = _.template(tpl_main)(linkxStore);
document.querySelector('#btn_addkey').addEventListener('click', ()=>{window.linkx.req_add(document.querySelector('#addkey').value);});
document.querySelector('#btn_sendmessage').addEventListener('click', ()=>{window.linkx.message(document.querySelector('#sendmessage').value);});

var tpl_medias = `
<button onclick='window.linkx.switch_cam()' ><%= medias_cam_on ?  "CAM ON ("+medias_cam_label+")" : "CAM OFF" %></button><button onclick='window.linkx.swap_cam()'>►</button><br/>
<button onclick='window.linkx.switch_mic()' ><%= medias_mic_on ?  "MIC ON("+medias_mic_label+")" : "MIC OFF" %></button><button onclick='window.linkx.swap_mic()'>►</button><br/>
`
var fcn_medias = _.template(tpl_medias);

var tpl_infos = `
KEY: <%= my_key %> <button onclick='window.linkx.req_renew()' >NEW</button><br/>
MESSAGE: <%= my_message %> <br/>
INFO: <%= server_message %> <br/>
<% if (medias_stream_error != "") { %> MEDIAS ERROR : <%= medias_stream_error %> <% } %> <br/>
`;
var fcn_infos = _.template(tpl_infos);

var tpl_messages = `
MESSAGES :<br/>
<% _.each(messages, function(msg){ %>
<%= msg.keynum %>: <%= msg.msg %> (<%= msg.cat %>)</br>
<% }); %>
`;
var fcn_messages = _.template(tpl_messages);

var tpl_flux = `
<% _.each(flux, function(f){ %>
<%= f.keynum %>: <%= f.message %></br>
<video id="<%= f.id %>" style="width:80px"   autoplay></video></br>
<% }); %>
`;
var fcn_flux = _.template(tpl_flux);

const review = () => {

  let updates = linkxStore.get_updates();
  console.log(updates)
  if (updates.infos) {
    document.querySelector('#infos').innerHTML = fcn_infos(linkxStore);
  }
  if (updates.medias) {
    document.querySelector('#medias').innerHTML = fcn_medias(linkxStore);
  }

  if (updates.messages) {
    document.querySelector('#messages').innerHTML = fcn_messages(linkxStore);
  }

  if (updates.stream) {
    document.querySelector('#me').srcObject = linkxStore.my_stream;
  }

  if (updates.flux) { 
    document.querySelector('#flux').innerHTML = fcn_flux(linkxStore);
    for(let i=0;i<linkxStore.flux.length;i=i+1){
      document.getElementById(linkxStore.flux[i].id).srcObject = linkxStore.flux[i].stream;
    }
   }

   if(updates.list_flux_streams_updated.length>0){
    for(let i=0;i<linkxStore.flux.length;i=i+1){
            if(updates.list_flux_streams_updated.includes(linkxStore.flux[i].id)){
              document.getElementById(linkxStore.flux[i].id).srcObject = linkxStore.flux[i].stream;
            }
    }
   }

  }

  //let video = document.getElementById('selfvideo');
  //video.srcObject = linkxStore.stream;

