
import linkx  from './linkx.js';

linkx.init_peer();
linkx.req_hb();



window.addEventListener('beforeunload', () => { linkx.leave() });
window.setInterval(() => {
  linkx.req_hb();
  linkx.synchro();
 // console.log("TIC");
}, 2000);

window.linkx=linkx;


//module.exports = linkx;
module.exports = {linkx}