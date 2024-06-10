<template>
    <div class="view">
        <img src="../assets/start/logo.svg" alt="logo" class="logo" />
        <el-form
            :model="ruleForm"
            :rule="rules"
            ref="ruleFormRef"
            class="form"
            label-width="auto"
        >
            <el-form-item label="メールアドレス" prop="email">
                <el-input
                    v-model="ruleForm.email"
                    placeholder="メールアドレス"
                />
            </el-form-item>
            <el-form-item label="パスワード" prop="password">
                <el-input
                    type="password"
                    v-model="ruleForm.password"
                    placeholder="パスワード"
                />
            </el-form-item>
        </el-form>
        <ElButton type="primary" @click="login" class="login" round
            >ログイン</ElButton
        >
        <router-link to="signup" class="signup">新規登録はこちら</router-link>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { db, auth } from '@/plugins/firebase'; // Firestoreのインスタンスをインポート
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const router = useRouter();

interface RuleForm {
    email: string;
    password: string;
}

const ruleFormRef = ref<FormInstance>();

const ruleForm = ref<RuleForm>({
    email: '',
    password: '',
});

const rules = reactive<FormRules<RuleForm>>({
    email: [
        {
            required: true,
            message: 'メールアドレスを入力してください',
            trigger: 'blur',
        },
        {
            type: 'email',
            message: '正しいメールアドレスを入力してください',
            trigger: 'change',
        },
    ],
    password: [
        {
            required: true,
            message: 'パスワードを入力してください',
            trigger: 'blur',
        },
        {
            min: 6,
            message: 'パスワードは6文字以上で入力してください',
            trigger: 'change',
        },
    ],
});

const isLogin = ref(true);
const isEmailVerified = ref(true);

// ログイン状態をチェックするカスタム関数
function checkLoginStatus() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // ログイン済みの場合はログインユーザー情報を返す
                resolve(user);
            } else {
                // ログインしていない場合はnullを返す
                resolve(null);
                isLogin.value = false;
            }
        });
    });
}

checkLoginStatus();

// ログインボタンを押したときの処理
function login() {
    signInWithEmailAndPassword(
        auth,
        ruleForm.value.email,
        ruleForm.value.password,
    )
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            if (user.emailVerified) {
                getDoc(doc(db, 'users', user.uid))
                    .then((doc) => {
                        if (doc.exists()) {
                            if (doc.data().isFirstLogin) {
                                router.push({ path: '/search' });
                            } else {
                                router.push({ path: '/set-profile' });
                            }
                        } else {
                            router.push({ path: '/set-profile' });
                            console.log('ユーザー情報が存在しません。');
                        }
                    })
                    .catch((error) => {
                        console.error('データの取得エラー:', error);
                    });
            } else {
                console.log('ユーザーはメール認証がまだ完了していません。');
                alert('メール認証が完了していません。');
                isEmailVerified.value = false;
                signOut(auth)
                    .then(() => {
                        // Sign-out successful.
                        console.log('ログアウトしました。');
                    })
                    .catch((error) => {
                        // An error happened.
                        console.log('ログアウトエラー:', error);
                    });
            }
        })
        .catch((error) => {
            ElMessage({
                message: 'ログインに失敗しました。',
                type: 'error',
            });
        });
}
</script>

<style>
.view {
    justify-content: center;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
}

.form {
    height: auto;
    margin: 0 0 0 0;
    display: flex;
    flex-direction: column;
}

.logo {
    width: 80%;
    height: auto;
    margin: 0 0 10vh 0;
    text-align: center;
}
.login {
    margin-top: 5vh;
    font-size: 4vh;
    width: 70%;
    height: 5vh;
    color: black;
    background-color: whitesmoke;
    border: none;
}
.login:hover {
    color: white;
    background-color: white;
}
.login:active {
    color: white;
    background-color: white;
}
.signup {
    margin-top: 2vh;
    font-size: 2.5vh;
    width: 70%;
    height: 5vh;
}
</style>
