<template>
  <div class="start">
    <img src="../../assets/start/logo.svg" alt="logo" class="start-logo" />
    <p>ver.β</p>
    <router-link to="login-select" class="start-button"
      >-　タップしてスタート　-</router-link
    >
  </div>
</template>

<script setup lang="ts">

</script>
<style scoped>
.start {
  justify-content: end;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
}

.start-logo {
  width: 80%;
  height: auto;
  margin: 0 0 5vh 0;
  text-align: center;
}

.start-button {
  margin: 40vh 0 20vh 0;
  width: 100%;
  font-size: 25px;
  font-weight: bold;
  background-color: transparent;
  color: black;
  text-decoration: none;
  border: none;
  position: relative;

  -webkit-animation: blink 1.5s ease-in-out infinite alternate;
  -moz-animation: blink 1.5s ease-in-out infinite alternate;
  animation: blink 1.5s ease-in-out infinite alternate;
}

@-webkit-keyframes blink {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@-moz-keyframes blink {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes blink {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
