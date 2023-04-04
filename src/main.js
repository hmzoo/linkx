import {linkxStore} from './linkx.js';
import Handlebars from 'handlebars';
const template = document.getElementById('template-linkx').innerHTML;
const compiler = Handlebars.compile(template);

window.linkx=linkxStore;

linkxStore.start_stream();
linkxStore.init_peer();
linkxStore.hb();
window.addEventListener('beforeunload', () => { linkxStore.onleave() });
window.setInterval(() => {
  linkxStore.hb();
  linkxStore.synchro();
  review();
}, 3000);



const review =()=>{
document.querySelector('#app').innerHTML = compiler(linkxStore);
let video = document.getElementById('selfvideo');
video.srcObject = linkxStore.stream;
console.log
}