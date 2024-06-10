<template>
    <el-dialog title="プロフィール" >
        <ElCard class="profile-card" :body-style="{ height: '50vh' }">
            <img :src="displayImg" class="main-img" />
            <h2>{{ displayName }}</h2>
            <h3>{{ liveIn }}在住</h3>
            <p>{{ comment }}</p>
            <div class="profile-tag">
                <ElTag v-for="item in tags" type="info" round>{{ item }}</ElTag>
            </div>
            <ElTag type="success" v-if="status === '1'" class="status"
                >今すぐ話したい</ElTag
            >
        </ElCard>
    </el-dialog>
</template>
<script setup lang="ts">
//props でUserIDを受け取る
import { onMounted, ref } from 'vue';
import { db, auth } from '@/plugins/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { defineProps } from 'vue';
import ErrorResponce from './error-responce.vue';
import { onAuthStateChanged } from 'firebase/auth';

const displayName = ref('');
const displayImg = ref('');
const liveIn = ref('');
const comment = ref('');
const tags = ref<Array<string>>();
const status = ref('');

const mental = ref(100);

const UserID = defineProps<{ UserID: string }>();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, 'users', UserID.UserID.toString());
        getDoc(userDocRef)
            .then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    displayName.value = userData?.displayName;
                    displayImg.value = userData?.photoURL;
                    mental.value = userData?.mental;
                    liveIn.value = userData?.liveIn;
                    comment.value = userData?.comment;
                    tags.value = userData?.tags;
                    status.value = userData?.status;
                }
            })
            .catch((error) => {
                ErrorResponce(error);
            });
    }
});

onMounted(() => {
    onAuthStateChanged;
});
</script>

<style scoped>
.profile-card p {
    margin: 1vh 0 0 0;
}
.main-img {
    width: auto;
    height: auto;
    max-width: 70%;
    max-height: 50%;
    display: block;
    object-fit: cover;
    margin: auto;
    padding: 0;
}

.profile-card {
    height: 70vh;
    max-height: 80%;
    margin-top: 1vh;
    padding: 0;
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2%;
}

.profile-card img {
    border-radius: 10%;
}
.profile-tag {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: start;
    align-items: center;
    row-gap: 1vh;
    column-gap: 1%;
}

.profile-tag,
.el-tag {
    font-size: 2.5vh;
    padding: 2vh 2%;
}
</style>
