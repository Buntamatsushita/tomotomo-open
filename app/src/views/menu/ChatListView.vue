<template>
    <div class="profile-view">
        <header class="chat-header">
            <h1>友達一覧</h1>
        </header>
        <el-scrollbar>
            <div class="scroll-item">
                <img
                    src="/src/assets/home/megaphone.svg"
                    alt=""
                    class="chat-profile-img"
                />
                <div class="chat-detail" @click="toNotification">
                    <h2>運営からのお知らせ</h2>
                </div>
            </div>
            <div v-for="talk in talks" :key="talk.uuid" class="scroll-item">
                <img :src="talk.photoURL" @click="onDialog(talk.bobID)" alt="" class="chat-profile-img" />

                <div class="chat-detail" @click="toChat(talk.uuid)">
                    <h2>{{ talk.displayName }}</h2>
                    <p class="chat-text">
                        {{ talk.lastMessage }}
                    </p>
                    <span>
                        <span v-if="talk.unread > 0" style="color: red"
                            >{{ talk.unread }}件の未読</span
                        >
                    </span>
                </div>
            </div>
        </el-scrollbar>
        <Profile v-if="isDialogVisible" :UserID="selectedBobID" @close="isDialogVisible = false" />
    </div>
    <menu-bar class="menu-bar" />
</template>

<script setup lang="ts">
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, realtimeDB } from '@/plugins/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    or,
} from 'firebase/firestore';
import { ref as dbref, onValue } from 'firebase/database';
import { onMounted, ref, Ref } from 'vue';
import { useRouter } from 'vue-router';
import ErrorResponce from '@/components/error-responce.vue';

const talks = ref<Array<Object>>([]) as any as Ref<
    Array<{
        uuid: string;
        bobID: string;
        displayName: string;
        photoURL: string;
        lastMessage: string;
        time: string;
        unread: number;
    }>
>;

const router = useRouter();
const isDialogVisible = ref(false);
const selectedBobID = ref('');

function toChat(uuid: string) {
    router.push(`/chat/${uuid}`);
}

// // 通知の許可を求める
// Notification.requestPermission().then((result) => {
//     // console.log(result);
// });

// ログイン状態をチェックし、ログインユーザーのトークを取得する関数
async function fetchUserTalks() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userUid = user.uid;

            const q = query(
                collection(db, 'talks'),
                or(
                    where('user1_id', '==', userUid),
                    where('user2_id', '==', userUid),
                ),
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (eachdoc) => {
                const talkData = eachdoc.data() as {
                    user1_id: string;
                    user2_id: string;
                    // その他の必要なプロパティがあればここに追加
                };
                const Bob = ref('');
                if (userUid === talkData.user1_id) {
                    Bob.value = talkData.user2_id;
                } else {
                    Bob.value = talkData.user1_id;
                }

                const userDocRef = doc(db, 'users', Bob.value);
                getDoc(userDocRef)
                    .then(async (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const userData = docSnapshot.data();
                            const lastMessage = ref('');
                            const timestamp = ref('');
                            const unread = ref(0);
                            //リアルタイムデータベースのmessagesを取得
                            const messagesRef = dbref(
                                realtimeDB,
                                'messages/' + eachdoc.id,
                            );
                            onValue(messagesRef, (snapshot) => {
                                const data = snapshot.val();
                                if (data) {
                                    const keys = Object.keys(data);
                                    const lastKey = keys[keys.length - 1];
                                    lastMessage.value = data[lastKey].text;
                                    timestamp.value = data[lastKey].time;
                                    // 未読数をカウント
                                    for (const key of keys) {
                                        if (
                                            data[key].send_user_id !==
                                                userUid &&
                                            !data[key].status
                                        ) {
                                            unread.value++;
                                        }
                                    }
                                }
                                //talksにtalkがすでにある場合は更新、ない場合は追加
                                const talk = {
                                    uuid: eachdoc.id,
                                    bobID: Bob.value,
                                    displayName: userData.displayName,
                                    photoURL: userData.photoURL,
                                    lastMessage: lastMessage.value,
                                    time: timestamp.value,
                                    unread: unread.value,
                                };
                                const index = talks.value.findIndex(
                                    (item) => item.uuid === eachdoc.id,
                                );
                                if (index !== -1) {
                                    talks.value[index] = talk;
                                } else {
                                    talks.value.push(talk);
                                }

                                talks.value.sort((a, b) => {
                                    if (a.time < b.time) {
                                        return 1;
                                    } else {
                                        return -1;
                                    }
                                });
                            });
                        }
                    })
                    .catch((error) => {
                        ErrorResponce(error);
                    });
            });
        }
    });
}

function toNotification() {
    router.push('/notification');
}

function onDialog(bobID: string) {
    selectedBobID.value = bobID;
    isDialogVisible.value = true;
}

onMounted(() => {
    fetchUserTalks();
});
</script>

<style scoped>
.chat-header {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 7vh;
    width: 100%;
    background-color: #b9fc97;
    color: black;
    top: 0;
    position: fixed;
    z-index: 999;
}

.chat-header h1 {
    font-size: 4vh;
    margin: 0;
    padding: 0;
}

.profile-view {
    padding: 0;
    margin: 0;
    width: 100%;
    height: 83vh;
    padding-top: 7vh;
}

.scroll-item {
    display: flex;
    align-items: center;
    justify-content: start;
    margin: 0;
    height: 15vh;
    width: 100%;
    gap: 2vw;
    text-align: center;
    border-radius: 4px;
    border-bottom: 1px solid #000000;
}

.chat-profile-img {
    width: 10vh;
    height: 10vh;
    border-radius: 50%;
    margin: 0;
    padding: 0;
}

.chat-detail {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 1vh;
    margin-right: 5%;
    width: 75%;
}

.chat-detail h2 {
    overflow: hidden;
    margin: 0;
    padding: 0;
    font-size: 3vh;
}

.chat-text {
    overflow: hidden;
    margin: 0;
    padding: 0;
    font-size: 1em;
    width: 75%;
    color: #000000;
    white-space: nowrap;
    text-align: start;
}

.menu-bar {
    position: fixed;
    bottom: 0;
}
</style>
