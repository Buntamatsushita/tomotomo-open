<template>
    <div class="profile-view">
        <ElCard
            class="profile-card"
            :body-style="{ height: '70vh' }"
            v-if="isUser"
        >
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
        <ElCard
            class="profile-card"
            :body-style="{ height: '70vh' }"
            v-if="!isUser"
        >
            <div class="use-none">
                <img
                    src="@/assets/home/desert-island.svg"
                    class="desert-icon"
                />
                <h1 class="use-none-text">ユーザーがいません</h1>
            </div>
        </ElCard>

        <div class="select" v-if="isUser">
            <div class="sad" @click="sad">
                <img src="/src/assets/home/sad.svg" class="sad-icon" />
                興味なし
            </div>
            <div class="good" @click="good">
                <img src="/src/assets/home/smile.svg" class="sad-icon" />
                話す
            </div>
        </div>
    </div>
    <menu-bar class="menu-bar" />
</template>

<script setup lang="ts">
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/plugins/firebase';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    setDoc,
    where,
    query,
    getDocs,
    and,
} from 'firebase/firestore';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ErrorResponce from '@/components/error-responce.vue';

const isLogin = ref(false);

const displayName = ref('');
const displayImg = ref('');
const liveIn = ref('');
const comment = ref('');
const tags = ref<Array<string>>();
const status = ref('');

const mental = ref(100);
const mentalState = ref('rgb(0, 0, 0)');
const green = ref(0);
const red = ref(0);

const users = ref<Array<string>>();
const currentUser = ref('');
const isUser = ref(false);

const router = useRouter();

const UserUid = ref('');

// ログイン状態をチェックするカスタム関数
function checkLoginStatus() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                UserUid.value = user.uid;
                // ログイン済みの場合はログインユーザー情報を返す
                const userDocRef = doc(db, 'config', 'users');
                getDoc(userDocRef)
                    .then((docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const data = docSnapshot.data();
                            users.value = data.all.filter(
                                (item: string) => item !== user.uid,
                            );

                            const MyDocRef = doc(db, 'users', user.uid);
                            getDoc(MyDocRef)
                                .then((docSnapshot) => {
                                    if (docSnapshot.exists()) {
                                        const mydata = docSnapshot.data();
                                        //goodPersonsとbadPersonsに含まれている人を削除
                                        //入力はArray<string>なので、Array<string>の中に含まれているかどうかを確認する
                                        users.value = (
                                            users.value ?? []
                                        ).filter(
                                            (item: string) =>
                                                !mydata.goodPersons.includes(
                                                    item,
                                                ) &&
                                                !mydata.badPersons.includes(
                                                    item,
                                                ),
                                        );
                                        if (users.value.length !== 0) {
                                            isUser.value = true;
                                            firstCard();
                                        }
                                    }
                                })
                                .catch((error) => {
                                    ErrorResponce(error);
                                });
                        }
                    })
                    .catch((error) => {
                        ErrorResponce(error);
                    });
            } else {
                // ログインしていない場合はnullを返す
                resolve(null);
                isLogin.value = false;
                router.push({ path: '/' });
            }
        });
    });
}

function changeMentalState() {
    if (mental.value >= 50) {
        green.value = 255;
        red.value = 255 * (1 - (mental.value - 50) / 50);
        mentalState.value = `rgba(${red.value}, ${green.value}, 0)`;
    } else {
        green.value = 255 * (mental.value / 50);
        red.value = 255;
        mentalState.value = `rgba(${red.value}, ${green.value}, 0)`;
    }
}

function firstCard() {
    const user = users.value?.[0] ?? [];
    currentUser.value = user as string;
    if (user === '') {
        isUser.value = false;
        return;
    } else {
        const userDocRef = doc(db, 'users', user.toString());
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
                    changeMentalState();
                }
            })
            .catch((error) => {
                ErrorResponce(error);
            });
    }
}

function changeCard() {
    users.value?.shift();
    const user = users.value?.[0] ?? '';
    currentUser.value = user as string;
    if (user === '') {
        isUser.value = false;
        return;
    } else {
        const userDocRef = doc(db, 'users', user);
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
                    changeMentalState();
                }
            })
            .catch((error) => {
                ErrorResponce(error);
            });
    }
}

function sad() {
    const userDocRef = doc(db, 'users', UserUid.value);
    getDoc(userDocRef)
        .then(async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                userData.badPersons.push(currentUser.value);
                await setDoc(userDocRef, userData);
                changeCard();
            }
        })
        .catch((error) => {
            ErrorResponce(error);
        });
}

function good() {
    const userDocRef = doc(db, 'users', UserUid.value);
    getDoc(userDocRef)
        .then(async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const user1_id = ref('');
                const user2_id = ref('');

                //user1_idとuser2_idを比較する。早いほうがuser1_idになる
                if (UserUid.value < currentUser.value) {
                    user1_id.value = UserUid.value;
                    user2_id.value = currentUser.value;
                } else {
                    user1_id.value = currentUser.value;
                    user2_id.value = UserUid.value;
                }
                userData.goodPersons.push(currentUser.value);

                //queryを使って、talksにすでにデータがあるかどうかを確認する
                //talksにデータがある場合は、そのデータを取得して、chatに遷移する
                //talksにデータがない場合は、新しくデータを作成して、chatに遷移する
                const q = query(
                    collection(db, 'talks'),
                    and(
                        where('user1_id', '==', user1_id.value),
                        where('user2_id', '==', user2_id.value),
                    ),
                );
                const querySnapshot = await getDocs(q);
                if (querySnapshot.size !== 0) {
                    querySnapshot.forEach((eachdoc) => {
                        router.push({ path: '/chat/' + eachdoc.id });
                    });
                } else {
                    setDoc(userDocRef, userData);
                    //UserIDとcurrentUser.valueを比較して、user1_idとuser2_idを決定する
                    const docRef = await addDoc(collection(db, 'talks'), {
                        user1_id: user1_id.value,
                        user2_id: user2_id.value,
                    });
                    router.push({ path: '/chat/' + docRef.id });
                }
            }
        })
        .catch((error) => {
            ErrorResponce(error);
        });
}

checkLoginStatus();
</script>

<style scoped>
.profile-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 90%;
}
.profile-view h2,
h3 {
    margin: 0;
}
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
    width: 90%;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2%;
}

.profile-card {
    --el-box-shadow-light: 0px 0px 16px v-bind(mentalState);
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

.select {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 70%;
    height: 15vh;
}

.sad,
.good {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.sad-icon {
    width: auto;
    height: 8vh;
}
.bad-button {
    background-color: white;
    border-color: #ff4d4f;
    color: #ff4d4f;
    height: 20vh;
    width: 20%;
    margin-right: 5%;
}

.user-none-text {
    text-align: center;
}
.desert-icon {
    width: 80%;
    height: auto;
}

.menu-bar {
    bottom: 0;
    position: fixed;
}
</style>
