<template>
    <div class="chat-header">
        <el-icon @click="backToChatList" size="50">
            <ArrowLeft />
        </el-icon>
        <h1>{{ BobName }}</h1>
        <el-icon @click="toCall" size="50">
            <PhoneFilled />
        </el-icon>
    </div>
    <div class="chat-view">
        <el-Scrollbar ref="scrollbarRef" style="height: 84vh; width: 98%">
            <div ref="innerRef" id="inner">
                <div v-for="message in messages">
                    <div
                        class="bobMessage"
                        v-if="BobID === message.send_user_id"
                    >
                        <img class="bobIcon" :src="bobIcon" />
                        <div class="message">
                            <p class="bobSay">{{ message.text }}</p>
                            <p class="time">{{ formatTime(message.time) }}</p>
                        </div>
                    </div>
                    <div class="myMessage" v-else>
                        <div>
                            <!-- <div class="status">
                                <p class="status-text" v-if="onSending">
                                    送信中<el-icon name="loading" />
                                </p>
                                <p
                                    class="status-text"
                                    v-else-if="message.status === false"
                                >
                                    送信済
                                    <el-icon><Promotion /></el-icon>
                                </p>
                                <p
                                    class="status-text"
                                    v-else-if="message.status === true"
                                >
                                    既読<el-icon name="check" />
                                </p>
                            </div> -->
                            <p class="time">{{ formatTime(message.time) }}</p>
                        </div>
                        <p class="mySay" v-text="message.text"></p>
                    </div>
                </div>
            </div>
        </el-Scrollbar>

        <div class="input-view">
            <el-input
                placeholder="メッセージを入力"
                v-model="inputMessage"
                :autosize="{ minRows: 1, maxRows: 2 }"
                type="textarea"
                style="width: 85%; font-size: 3vh; max-height: 10vh"
            />
            <el-button
                :disabled="inputMessage === ''"
                @click="sendMessage"
                style="width: 15%; height: 5vh; font-size: 2.5vh"
            >
                送信
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, realtimeDB } from '@/plugins/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { ref as dbref, onValue, push, update } from 'firebase/database';
import { ref, Ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElScrollbar } from 'element-plus';

const router = useRouter();

const roomID = router.currentRoute.value.params.id as string;

const inputMessage = ref('');
const messages = ref<Array<Object>>([]) as Ref<
    Array<{ send_user_id: string; text: string; time: string; status: boolean }>
>;
const BobID = ref('');
const BobName = ref('');
const bobIcon = ref('');

const myName = ref('');
const myID = ref('');

const onSending = ref<boolean>();

const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>();
const innerRef = ref<HTMLDivElement>();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        myID.value = user.uid;
        myName.value = user.displayName ? user.displayName : '';
        const talkDocRef = doc(db, 'talks', roomID);
        const talkDoc = await getDoc(talkDocRef);
        const talkData = talkDoc.data() as {
            user1_id: string;
            user2_id: string;
        };

        if (myID.value === talkData.user1_id) {
            BobID.value = talkData.user2_id;
        } else {
            BobID.value = talkData.user1_id;
        }

        const userDocRef = doc(db, 'users', BobID.value);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data() as {
            displayName: string;
            photoURL: string;
        };
        BobName.value = userData.displayName;
        bobIcon.value = userData.photoURL;
    }
});

async function loadMessages() {
    const messagesRef = dbref(realtimeDB, 'messages/' + roomID);
    await onValue(messagesRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
            messages.value = Object.values(data);
            const messageUids = Object.keys(data);
            // 未読メッセージを既読にする
            for (const uid of messageUids) {
                if (
                    data[uid].send_user_id !== myID.value &&
                    !data[uid].status
                ) {
                    // サーバーに既読を更新
                    await update(
                        dbref(realtimeDB, 'messages/' + roomID + '/' + uid),
                        {
                            status: true,
                        },
                    );
                }
            }
            nextTick(scrollToBottom);
        }
    });
}

function sendMessage() {
    onSending.value = true;
    // 現在の時間を取得して、TimeStampを生成
    const currentDate = new Date().toISOString();
    // Realtime Database の messages に新しいメッセージを追加
    push(dbref(realtimeDB, 'messages/' + roomID + '/'), {
        send_user_id: myID.value,
        text: prepareMessageForServer(inputMessage.value),
        time: currentDate,
        status: false,
    })
        .then(() => {
            onSending.value = false;
            inputMessage.value = '';
        })
        .catch((error) => {
            console.error('Error writing new message: ', error);
        });
}

async function toCall() {
    // create - call - room
    // skyway に接続して、通話を開始する
    // 現在の時間を取得して、TimeStampを生成
    const currentDate = new Date().toISOString();
    // Realtime Database の messages に新しいメッセージを追加
    push(dbref(realtimeDB, 'messages/' + roomID + '/'), {
        send_user_id: myID.value,
        text: prepareMessageForServer("通話を開始しました！"),
        time: currentDate,
        status: false,
    })
        .then(() => {
            onSending.value = false;
            inputMessage.value = '';
        })
        .catch((error) => {
            console.error('Error writing new message: ', error);
        });
    //alert('通話を開始します');suru

    router.push('/call/' + roomID);
}

function backToChatList() {
    router.push('/chat-list');
}

function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function prepareMessageForServer(messageText: string): string {
    // メッセージ内の改行を特殊文字に置換する
    return messageText.replace(/\n/g, '\n');
}

function scrollToBottom() {
    scrollbarRef.value?.setScrollTop(innerRef.value?.clientHeight || 0); // innerRefの高さまでスクロールする
}

onMounted(() => {
    loadMessages();
    setTimeout(() => {
        scrollToBottom();
    }, 100); // 1000ミリ秒待ってからスクロール
});
</script>

<style scoped>
.chat-header {
    top: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 8vh;
    width: 100%;
    background-color: #f5f5f5;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 99;
    position: fixed;
}

/* message style */
.chat-view {
    height: 84vh;
    padding-top: 9vh;
    width: 98%;
    margin: 0 1%;
    display: flex;
    align-items: center;
    place-content: end;
    flex-direction: column;
}
.bobMessage {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 96%;
    margin: 1vh 0;
}
.myMessage {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: right;
    width: 96%;
    margin: 1vh 0;
}
.message {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    margin: 0 0 0 10px;
}
.bobIcon {
    width: 5vh;
    height: 5vh;
    border-radius: 50%;
}
.bobSay {
    display: inline-block;
    position: relative;
    margin: 0 0 0 10px;
    padding: 10px;
    max-width: 250px;
    border-radius: 12px;
    background: #edf1ee;
    font-size: 3vh;
    white-space: pre-wrap;
}
.bobSay:after {
    content: '';
    display: inline-block;
    position: absolute;
    top: 3px;
    left: -19px;
    border: 8px solid transparent;
    border-right: 18px solid #edf1ee;
    -webkit-transform: rotate(35deg);
    transform: rotate(35deg);
}
.mySay {
    display: inline-block;
    position: relative;
    margin: 0 10px 0 0;
    padding: 8px;
    max-width: 250px;
    border-radius: 12px;
    background: #30e852;
    font-size: 3vh;
    white-space: pre-wrap;
}
.mySay:after {
    content: '';
    position: absolute;
    top: 3px;
    right: -19px;
    border: 8px solid transparent;
    border-left: 18px solid #30e852;
    -webkit-transform: rotate(-35deg);
    transform: rotate(-35deg);
}
.status {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0;
}
.status-text {
    margin: 0;
    font-size: 1.5vh;
}
.time {
    margin: 0;
    font-size: 1.5vh;
}

.input-view {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    margin-bottom: 1vh;
    bottom: 0;
    position: fixed;
}

@media screen and (min-width: 769px) {
    .chat-header {
        width: 60vw;
    }
}
</style>
