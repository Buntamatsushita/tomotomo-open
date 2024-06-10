<template>
    <header>
        <el-icon @click="back" size="50">
            <ArrowLeft />
        </el-icon>
        <h1>運営からのお知らせ</h1>
    </header>
    <ElScrollbar class="news">
        <div>
            <h2>ベータ版リリース予定のお知らせ!</h2>
            <p>ベータ版のリリースは2024/05/27</p>
        </div>
    </ElScrollbar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function back() {
    router.back();
}
</script>

<style scoped>
header {
    display: flex;
    align-items: center;
    padding: 0 5%;
    height: 10%;
    border-bottom: 1px solid #ccc;
}
header h1 {
    font-size: 1.2rem;
    margin: 0;
    padding: 0;
    margin-left: 5%;
}
.news {
    height: 90%;
}
</style>
