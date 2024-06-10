<template>
    <router-view />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { auth } from '@/plugins/firebase';

const router = useRouter();
const isLogin = ref(true);

// ログイン状態をチェックするカスタム関数
const checkLoginStatus = () => {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // ログイン済みの場合はログインユーザー情報を返す
                resolve(user);
            } else {
                // ログインしていない場合はnullを返す
                resolve(null);
                isLogin.value = false;
            }
        });
    });
};

onMounted(() => {
    checkLoginStatus();
});

function logout() {
    auth.signOut().then(() => {
        console.log('ログアウトしました。');
        router.push({ path: '/' });
    });
}
</script>

<style>
#app {
    height: 100vh;
    margin: 0;
    padding: 0;
}
.zen-kaku gothic new-regular {
    font-family: 'Zen Kaku Gothic New', sans-serif;
    font-weight: 400;
    font-style: normal;
}
html {
    height: 100vh;
    width: 100vw;
    padding: 0;
    margin: 0;
    background-color: white;
    font-family: 'Zen Kaku Gothic New', sans-serif;
}
body {
    height: 100vh;
    margin: 0;
    background-color: white;
    padding: 0;
}



@media screen and (min-width: 769px) {
    #app {
        width: 60vw;
        margin: 0 auto;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
}
@media screen and (min-width: 1200px) {
    #app {
        width: 40vw;
        margin: 0 auto;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
}

::-webkit-full-page-media, :future, :root #app {
    height: 90vh
}
</style>
