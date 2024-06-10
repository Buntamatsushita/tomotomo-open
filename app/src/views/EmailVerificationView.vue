<template>
  <div class="main-content">
    <h1>メールアドレスの確認</h1>
    <p>
      メールアドレスの確認メールを送信しました。<br />メールボックスをご確認ください。
    </p>
    <p>
      このページはあと、{{ countDown }}秒で自動的に遷移します。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const countDown = ref(10);

onMounted(() => {
  const timer = setInterval(() => {
    countDown.value--;
    if (countDown.value === 0) {
      clearInterval(timer);
      router.push({ path: '/login' });
    }
  }, 1000);
});
</script>

<style scoped>
.main-content {
  padding: 5% 15%;
}
</style>
