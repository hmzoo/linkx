<script setup>
import { ref } from 'vue'
import BtnCam from './components/BtnCam.vue'
import BtnCamRot from './components/BtnCamRot.vue'
import BtnMic from './components/BtnMic.vue'

const videoOn =ref(true)
const microOn =ref(true)
</script>

<template>
<div class="header">
    <div class="home-menu pure-menu pure-menu-horizontal ">
        <a class="pure-menu-heading" href="">O</a>

        <ul class="pure-menu-list">
            <li class="pure-menu-item "><a href="#" class="pure-menu-link" v-on:click="videoOn = !videoOn"><BtnCam :is_on="videoOn"/></a></li>
            <li class="pure-menu-item "><a href="#" class="pure-menu-link" v-on:click="microOn = !microOn"><BtnMic :is_on="microOn"/></a></li>
        <li class="pure-menu-item "><a href="#" class="pure-menu-link" ><BtnCamRot/></a></li>
        </ul>
    </div>
</div>


</template>


