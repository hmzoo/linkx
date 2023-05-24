<script setup>
defineProps({
  is_on: {
    type: Boolean,
    required: true
  }
})
</script>

<template>

<span class="pure-button pure-button-primary" >

  <font-awesome-icon icon="video" v-if="is_on" />
  <font-awesome-icon icon="video-slash" v-else />
  
</span>

</template>