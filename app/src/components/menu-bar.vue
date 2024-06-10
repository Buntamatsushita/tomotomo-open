<template>
    <div class="menu-bar">
        <div class="icon">
            <el-icon size="40" class="menu-icon" @click="search"
                ><Search
            /></el-icon>
            <p class="icon-name">探す</p>
        </div>
        <div class="icon">
            <el-icon size="40" class="menu-icon" @click="chat"
                ><ChatSquare
            /></el-icon>
            <p class="icon-name">話す</p>
        </div>
        <div class="icon">
            <el-icon size="40" class="menu-icon" @click="profile"
                ><Avatar
            /></el-icon>
            <p class="icon-name">自分</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const search = () => {
    router.push('/search');
};

const chat = () => {
    router.push('/chat-list');
};

const profile = () => {
    router.push('/profile');
};
</script>

<style scoped>
.menu-bar {
    display: flex;
    gap: 25%;
    align-items: center;
    justify-content: center;
    height: 10vh;
    width: 100%;
    background-color: #b9fc97;
}
.icon {
    justify-content: center;
    align-items: center;
    text-align: center;
    display: flex;
    flex-direction: column;
}
.menu-icon svg {
    padding: 0;
    margin: 0;
}
.icon-name {
    margin: 0;
    padding: 0;
    font-size: 2vh;
}

@media screen and (min-width: 769px) {
    .menu-bar {
        width: 60vw;
    }
}
@media screen and (min-width: 1200px) {
    .menu-bar {
        width: 40vw;
    }
}

</style>
