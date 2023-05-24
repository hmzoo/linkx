import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import { library } from "@fortawesome/fontawesome-svg-core";
import { faMicrophone, faMicrophoneSlash, faPhone ,faVideo,faVideoSlash,faCameraRotate} from "@fortawesome/free-solid-svg-icons";

library.add(faPhone,faVideo,faVideoSlash,faMicrophone,faMicrophoneSlash,faCameraRotate);


import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

createApp(App).component("font-awesome-icon", FontAwesomeIcon).mount('#app')
