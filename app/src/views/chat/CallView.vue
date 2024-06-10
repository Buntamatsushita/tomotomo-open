<template>
    <div class="voice-call-view">
        <div class="main-text">
            <audio ref="remoteAudio"></audio>

            <div v-if="!isVideo" class="voice-chat">
                <img :src="bobImg" class="bob-img" />
                <h1>{{ bobName }}</h1>
                <p v-if="!isCalling">相手が通話に出るまでお待ちください</p>
                <p v-else>通話中</p>
                <h2 v-if="!isCalling">...</h2>
                <!-- <h2 v-else>00:00:00</h2> -->
                <div class="call-button-area">
                    <el-button
                        type="success"
                        style="height: 10%; font-size: 2rem"
                        @click="onVideo"
                        v-if="isCalling"
                        round
                    >
                        ビデオ通話にする
                    </el-button>
                    <el-button
                        type="danger"
                        style="width: 40%; height: 10%; font-size: 2rem"
                        @click="endCall"
                        round
                    >
                        通話終了
                    </el-button>
                </div>
            </div>
            <div v-else>
                <video
                    ref="remoteVideoArea"
                    autoplay
                    muted
                    playsinline
                    class="remote-video"
                ></video>
                <video
                    ref="localVideo"
                    autoplay
                    muted
                    playsinline
                    class="local-video"
                ></video>
                <div class="end-call-button">
                    <el-button
                        type="danger"
                        style="width: 40%; height: 10%; font-size: 2rem"
                        @click="endCall"
                        round
                    >
                        通話終了
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import {
    LocalStream,
    P2PRoom,
    SkyWayContext,
    SkyWayRoom,
    SkyWayStreamFactory,
} from '@skyway-sdk/room';
import { token } from '@/plugins/skyway';
import { auth, db, realtimeDB } from '@/plugins/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ref as dbref, push } from 'firebase/database';

const router = useRouter();
const roomID = router.currentRoute.value.params.id as string;

const isCalling = ref(false);
const isVideo = ref(false);

const myID = ref('');
const bobID = ref('');
const myName = ref('');
const bobName = ref('');

const myVideo = ref<LocalStream | null>(null);
const myAudio = ref<LocalStream | null>(null);
const remoteAudio = ref<HTMLAudioElement | null>(null);
const localVideo = ref<HTMLVideoElement | null>(null);
const remoteVideoArea = ref<HTMLVideoElement | null>(null);

const bobImg = ref('https://via.placeholder.com/1000');
let context: SkyWayContext | null = null;
let room: P2PRoom | null = null;
let me: any = null;
const meID = ref('');

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

        bobID.value =
            myID.value === talkData.user1_id
                ? talkData.user2_id
                : talkData.user1_id;

        const userDocRef = doc(db, 'users', bobID.value);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data() as {
            displayName: string;
            photoURL: string;
        };
        bobName.value = userData.displayName;
        bobImg.value = userData.photoURL;
    }
});

const join = async () => {
    // 特定のRoomに入室する
    context = await SkyWayContext.Create(token);
    room = await SkyWayRoom.FindOrCreate(context, {
        type: 'p2p',
        name: roomID,
    });
    me = await room.join();
    meID.value = me.id;

    // 自分の音声を公開する
    if (myAudio.value) await me.publish(myAudio.value);

    // ルームが閉じられた時の処理を追加
    room.onClosed.watch(() => {
        router.back();
        return true;
    });

    // 入室した部屋で公開されている映像・音声があった時に実行
    room.publications.forEach(subscribeAndAttach);
    // 別のユーザーが新しく映像・音声を公開した時にも実行
    room.onStreamPublished.add((e: any) => subscribeAndAttach(e.publication));
};

// 他のユーザーがいた・入室してきた時の処理
const subscribeAndAttach = async (publication: any) => {
    if (publication.publisher.id === meID.value) return;

    const stream = await me.subscribe(publication.id);

    switch (stream.stream.track.kind) {
        case 'video':
            stream.stream.attach(remoteVideoArea.value);
            break;
        case 'audio':
            isCalling.value = true;
            stream.stream.attach(remoteAudio.value);
            if (remoteAudio.value) {
                remoteAudio.value.play();
            }
            break;
    }
};
const endCall = () => {
    if (room) {
        room.close();
    }
    router.back();
};

async function onVideo() {
    isVideo.value = true;
    // 自分の音声と映像を取得
    const { audio, video } =
        await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
    myVideo.value = video;
    myAudio.value = audio;

    // 自分の映像を表示
    if (localVideo.value) {
        myVideo.value.attach(localVideo.value);
    }
    if (localVideo.value) {
        await localVideo.value.play();
    }

    if (myAudio.value) await me.publish(myAudio.value);
    if (myVideo.value) await me.publish(myVideo.value);
}

onMounted(async () => {
    // 自分の音声と映像を取得
    const audio = await SkyWayStreamFactory.createMicrophoneAudioStream();
    myAudio.value = audio;
    join();

    // ルームが閉じられたかどうかをチェック
    if (isCalling.value && room?.onClosed) {
        router.back();
    }
});

onBeforeUnmount(() => {
    // 通話を終了する

    if (room) {
        room.close();
    }


    // 現在の時間を取得して、TimeStampを生成
    const currentDate = new Date().toISOString();
    // Realtime Database の messages に新しいメッセージを追加
    push(dbref(realtimeDB, 'messages/' + roomID + '/'), {
        send_user_id: myID.value,
        text: '通話を終了しました！',
        time: currentDate,
        status: false,
    }).catch((error) => {
        console.error('Error writing new message: ', error);
    });
});
</script>

<style scoped>
.main-text {
    width: 100%;
    height: 100%;
}
.bob-img {
    width: 70%;
    height: 35vh;
    display: block;
    object-fit: cover;
    margin: 5vh auto;
    padding: 0;
    border-radius: 20%;
}
.voice-chat {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.call-button-area {
    width: 100%;
    margin-bottom: 10%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2vh;
    bottom: 0;
    position: fixed;
}
.remote-video {
    width: 100%;
    height: 50vh;
    display: block;
    object-fit: cover;
    padding: 0;
}
.local-video {
    width: 100%;
    height: 50vh;
    display: block;
    object-fit: cover;
    padding: 0;
}
.end-call-button {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1vh;
    bottom: 0;
    position: fixed;
}
</style>
