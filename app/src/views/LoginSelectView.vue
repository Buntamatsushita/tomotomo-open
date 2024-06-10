<template>
    <div class="view">
        <img src="../assets/start/logo.svg" alt="logo" class="logo" />
        <ElButton type="primary" @click="login" class="login" round
            >ログイン</ElButton
        >
        <ElButton type="primary" @click="signUp" class="signup" round
            >新規登録</ElButton
        >
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { auth } from '@/plugins/firebase';
import { onMounted } from 'vue';

const router = useRouter();

const checkLoginStatus = () => {
    // ログイン状態をチェックする関数
  const user = auth.currentUser;
  if (user) {
    router.push('/search');
  }
};

const login = () => {
    router.push({ path: '/login' });
};

const signUp = () => {
    router.push({ path: '/signup' });
};

onMounted(() => {
    checkLoginStatus();
});
</script>

<style scoped>
.view {
    justify-content: center;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
}

.logo {
    width: 80%;
    height: auto;
    margin: 0 0 20vh 0;
    text-align: center;
}
.login {
    margin-top: 5vh;
    font-size: 4vh;
    width: 70%;
    height: 5vh;
    color: black;
    background-color: whitesmoke;
    border: none;
}
.login:hover {
    color: white;
    background-color: white;
}
.login:active {
    color: white;
    background-color: white;
}
.signup {
    margin-top: 5vh;
    font-size: 4vh;
    width: 70%;
    height: 5vh;
    color: white;
    background-color: #a1ff71;
    border: none;
}
.signup:hover {
    color: white;
    background-color: #a1ff71;
}
.signup:active {
    color: white;
    background-color: #a1ff71;
}
</style>
