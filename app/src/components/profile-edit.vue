<template>
    <el-form
        :model="ruleForm"
        :rules="rules"
        ref="ruleFormRef"
        label-width="120px"
        class="rule-form"
    >
        <el-form-item label="プロフィール画像" prop="profileImg">
            <div class="edit-img">
                <div>
                    <img
                        v-if="ruleForm.profileImg"
                        :src="ruleForm.profileImg"
                        class="avatar"
                    />
                    <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    class="avatar-uploader"
                    @change="handleFileUpload"
                />
            </div>
        </el-form-item>
        <el-form-item label="名前" prop="name">
            <el-input
                v-model="ruleForm.name"
                placeholder="名前を入力してください"
            ></el-input>
        </el-form-item>
        <el-form-item label="コメント" prop="comment">
            <el-input
                type="textarea"
                v-model="ruleForm.comment"
                placeholder="コメントを入力してください"
            ></el-input>
        </el-form-item>
        <el-form-item label="タグ" prop="tags">
            <el-tag
                v-for="tag in ruleForm.tags"
                :key="tag"
                type="info"
                closable
                @close="handleClose(tag)"
            >
                {{ tag }}
            </el-tag>
            <el-input
                v-if="inputVisible"
                ref="InputRef"
                v-model="inputValue"
                size="small"
                @keyup.enter="handleInputConfirm"
                @blur="handleInputConfirm"
            />
            <el-button
                v-else
                class="button-new-tag"
                size="small"
                @click="showInput"
            >
                + タグを追加
            </el-button>
        </el-form-item>
        <el-form-item label="ステータス" prop="status">
            <el-radio-group v-model="ruleForm.status">
                <el-radio value="0">表示しない</el-radio>
                <el-radio value="1">今すぐ話したい</el-radio>
            </el-radio-group>
        </el-form-item>
    </el-form>

    <el-button @click="resetForm">リセット</el-button>
    <el-button type="primary" @click="submitForm">更新</el-button>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, unref } from 'vue';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/plugins/firebase';
import { ElInput } from 'element-plus';
import {
    getDownloadURL,
    getStorage,
    ref as stref,
    uploadBytes,
} from 'firebase/storage';
import { useRouter } from 'vue-router';
import ErrorResponce from './error-responce.vue';

const router = useRouter();

interface RuleForm {
    profileImg: string;
    name: string;
    comment: string;
    tags: Array<string>;
    status: string;
}

const ruleFormRef = ref<FormInstance>();

const ruleForm = ref<RuleForm>({
    profileImg: '',
    name: '',
    comment: '',
    tags: [],
    status: '',
});

const rules = ref<FormRules<RuleForm>>({
    profileImg: [
        {
            required: true,
            message: '画像をアップロードしてください',
            trigger: 'change',
        },
    ],
    name: [
        {
            required: true,
            message: '名前を入力してください',
            trigger: 'blur',
        },
    ],
    comment: [
        {
            required: true,
            message: 'コメントを入力してください',
            trigger: 'blur',
        },
    ],
    tags: [
        {
            required: true,
            message: 'タグを選択してください',
            trigger: 'change',
        },
    ],
    status: [
        {
            required: true,
            message: 'ステータスを選択してください',
            trigger: 'change',
        },
    ],
});

const inputVisible = ref(false);
const inputValue = ref('');
const InputRef = ref<InstanceType<typeof ElInput>>();

const isFirstLogin = ref(false);

const showInput = () => {
    inputVisible.value = true;
    nextTick(() => {
        InputRef.value!.input!.focus();
    });
};

const handleInputConfirm = () => {
    if (inputValue.value) {
        ruleForm.value.tags.push(inputValue.value);
    }
    inputVisible.value = false;
    inputValue.value = '';
};

const handleClose = (tag: string) => {
    const index = ruleForm.value.tags.indexOf(tag);
    if (index > -1) {
        ruleForm.value.tags.splice(index, 1);
    }
};

// ログイン状態をチェックするカスタム関数
onAuthStateChanged(auth, (user) => {
    if (user) {
        // ログイン済みの場合はログインユーザー情報を返す
        const UserUid = user.uid;
        const userDocRef = doc(db, 'users', UserUid);
        getDoc(userDocRef)
            .then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    ruleForm.value.name = userData.displayName;
                    ruleForm.value.profileImg = userData.photoURL;
                    ruleForm.value.comment = userData.comment;
                    ruleForm.value.tags = userData.tags || [];
                    ruleForm.value.status = userData.status;
                    isFirstLogin.value = userData.isFirstLogin;
                }
            })
            .catch((error) => {
                console.error('データの取得エラー:', error);
            });
    }
});

const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const storage = getStorage();
    const storageRef = stref(
        storage,
        `users/${auth.currentUser?.uid}/profile.jpg`,
    );

    uploadBytes(storageRef, file)
        .then((snapshot) => {
            return getDownloadURL(storageRef); // ダウンロードURLを取得するPromiseを返す
        })
        .then((downloadURL) => {
            ruleForm.value.profileImg = downloadURL;
        })
        .catch((error) => {
            ErrorResponce(error);
        });
};

const resetForm = () => {
    ruleFormRef.value?.resetFields();
};

const submitForm = async () => {
    await ruleFormRef.value?.validate((valid) => {
        if (valid) {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    const data = {
                        displayName: ruleForm.value.name,
                        comment: ruleForm.value.comment,
                        tags: ruleForm.value.tags,
                        status: ruleForm.value.status,
                        photoURL: ruleForm.value.profileImg,
                        isFirstLogin: true,
                    };
                    const UserUid = user.uid;
                    const userDocRef = doc(db, 'users', UserUid);
                    setDoc(userDocRef, data, { merge: true });
                    if (!isFirstLogin.value) {
                        // config/users/all の配列に自分のuidを追加
                        const allUsersRef = doc(db, 'config', 'users');
                        getDoc(allUsersRef)
                            .then((docSnapshot) => {
                                if (docSnapshot.exists()) {
                                    const allUsers = docSnapshot.data();
                                    allUsers?.all.push(UserUid);
                                    setDoc(allUsersRef, allUsers);
                                }
                            })
                            .catch((error) => {
                                console.error('データの取得エラー:', error);
                            });
                    }
                    ElMessage({
                        message: 'プロフィールを更新しました',
                        type: 'success',
                    });
                    router.push({ path: '/profile' });
                }
            });
        } else {
            console.log('error submit!');
        }
    });
};

onMounted(() => {
    onAuthStateChanged;
});
</script>

<style scoped>
.edit-img {
    display: flex;
    flex-direction: column;
    align-items: start;
    margin-bottom: 1vh;
}
.avatar {
    width: 30vw;
    margin-bottom: 5%;
    height: auto;
    display: block;
}
</style>
