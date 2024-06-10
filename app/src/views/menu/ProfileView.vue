<template>
    <header class="myprofile-header">
        <el-icon class="icon" size="50" color="black" @click="toHelp">
            <QuestionFilled />
        </el-icon>
        <h1 class="profile-h1">プロフィール</h1>
        <el-icon class="icon" size="50" color="black" @click="toSetting">
            <MoreFilled />
        </el-icon>
    </header>
    <div class="main-content">
        <div class="edit">
            <el-link type="info" @click="editVisible = true" class="edit-link"
                >プロフィールを編集</el-link
            >
        </div>
        <el-dialog
            title="プロフィール編集"
            v-model="editVisible"
            width="90%"
            :before-close="handleClose"
        >
            <ProfileEdit />
        </el-dialog>
        <div class="avator">
            <el-avatar shape="circle" :size="180" :src="profileImg" />
        </div>
        <el-card header="ユーザー情報" shadow="always">
            <div class="card-item">
                <p class="item">ニックネーム：{{ displayName }}</p>
                <p class="item">メールアドレス：{{ email }}</p>
                <p class="item">一言メッセージ：{{ comment }}</p>
                <p class="item">タグ：</p>
                <div class="tags">
                    <el-tag
                        v-for="tag in tags"
                        :key="tag"
                        type="info"
                        round
                        class="tag"
                    >
                        {{ tag }}
                    </el-tag>
                </div>
                <el-tag type="success" v-if="status !== ''">
                    {{ status }}
                </el-tag>
            </div>
        </el-card>
        <div class="logout">
            <el-button type="danger" @click="Logout">ログアウト</el-button>
        </div>
    </div>
    <menu-bar class="menu-bar" />
</template>

<script setup lang="ts">
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/plugins/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const isLogin = ref(true);
const profileImg = ref('');
const displayName = ref('');
const email = ref('');
const comment = ref('');
const tags = ref<Array<string>>();
const status = ref('');

const editVisible = ref(false);

const router = useRouter();

const toHelp = () => {
    router.push('/help');
};

const toSetting = () => {
    router.push('/setting');
};

function checkAuth() {
    // ログイン状態をチェックするカスタム関数
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // ログイン済みの場合はログインユーザー情報を返す
            email.value = user.email ? user.email.toString() : '';

            const UserUid = user.uid;
            const userDocRef = doc(db, 'users', UserUid);
            getDoc(userDocRef)
                .then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data();
                        displayName.value = userData.displayName;
                        profileImg.value = userData.photoURL;
                        comment.value = userData.comment;
                        tags.value = userData.tags;
                        status.value = userData.status;
                        if (userData.status === '1') {
                            status.value = '今すぐ話したい';
                        } else {
                            status.value = '';
                        }
                    }
                })
                .catch((error) => {
                    console.error('データの取得エラー:', error);
                });
        }
    });
}

const handleClose = () => {
    editVisible.value = false;
    checkAuth();
};

const Logout = () => {
    signOut(auth);
    router.push('/login');
};

onMounted(() => {
    checkAuth();
});
</script>

<style scoped>
.myprofile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #b9fc97;
    height: 7vh;
    width: 100%;
}
.icon {
    margin: 0 2%;
}
.profile-h1 {
    padding: 0;
    font-size: 3vh;
    color: black;
}
.main-content {
    height: 70vh;
    margin: 2% 15%;
}
.edit {
    display: flex;
    justify-content: flex-end;
}
.edit-link {
    font-size: 1.5em;
    color: orange
}
.avator {
    display: flex;
    justify-content: center;
    margin-bottom: 1vh;
}
.item {
    font-size: 2vh;
    margin: 0 0 1vh 0;
}
.tags {
    width: 90%;
    margin: 0;
}
.tag {
    font-size: 2vh;
    margin: 0 1% 1% 0;
}
.logout {
    display: flex;
    justify-content: end;
    margin-top: 2vh;
}
.menu-bar {
    position: fixed;
    bottom: 0;
}
</style>
