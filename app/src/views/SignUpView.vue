<template>
    <div v-if="isInitializeSetting">
        <div class="login-title">
            <h1>{{ title }}<br />を入力してください</h1>
        </div>
        <div class="question">
            <ElInput
                v-model="inputInviteCode"
                placeholder="招待コード"
                class="input"
                v-if="inviteCode"
                size="large"
                @change="checkInviteCode"
                autocomplete="off"
            />

            <ElInput
                v-model="inputNickName"
                placeholder="ニックネーム"
                class="input"
                v-if="nickName"
                size="large"
                autocomplete="off"
                @change="checkNickName"
            />

            <div class="birthDay" v-if="date">
                <ElSelect
                    v-model="inputYear"
                    placeholder="年"
                    v-if="date"
                    size="large"
                >
                    <el-option
                        v-for="item in yearOptions"
                        :key="item"
                        :label="item + '年'"
                        :value="item"
                    />
                </ElSelect>
                <ElSelect
                    v-model="inputMonth"
                    placeholder="月"
                    v-if="date"
                    size="large"
                    @change="changeDay"
                >
                    <el-option
                        v-for="item in 12"
                        :key="item"
                        :label="item + '月'"
                        :value="item"
                    />
                </ElSelect>
                <ElSelect
                    v-model="inputDay"
                    placeholder="日"
                    v-if="date"
                    size="large"
                    @change="checkBirthDay"
                >
                    <el-option
                        v-for="item in day"
                        :key="item"
                        :label="item + '日'"
                        :value="item"
                    />
                </ElSelect>
            </div>
            <ElSelect
                v-if="live"
                v-model="inputLive"
                placeholder="都道府県"
                class="input"
                size="large"
                style="width: 60%"
                @change="checkLive"
            >
                <el-option
                    v-for="item in liveOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.label"
                />
            </ElSelect>
            <ElInput
                v-model="inputEmail"
                placeholder="メールアドレス"
                class="input"
                v-if="email"
                size="large"
                autocomplete="off"
                @change="checkEmail"
            />

            <ElInput
                v-model="inputPassword"
                placeholder="パスワード"
                class="input"
                type="password"
                v-if="password"
                size="large"
                autocomplete="off"
            />
            <ElInput
                v-model="reInputPassword"
                placeholder="パスワードを再度入力"
                class="input"
                type="password"
                v-if="password"
                size="large"
                autocomplete="off"
                @change="checkPassword"
            />

            <!-- エラーメッセージ -->
            <el-alert
                title="招待コードを正しく入力してください"
                type="error"
                v-if="0 < inputInviteCode.length && inputInviteCode.length != 8"
                class="alert"
                center
                show-icon
                :closable="false"
            />
            <el-alert
                title="2文字以上のニックネームを入力してください"
                type="error"
                v-if="0 < inputNickName.length && inputNickName.length < 2"
                class="alert"
                center
                show-icon
                :closable="false"
            />
            <el-alert
                title="メールアドレスを正しく入力してください"
                type="error"
                v-if="0 < inputEmail.length && !validateEmail(inputEmail)"
                class="alert"
                center
                show-icon
                :closable="false"
            />
            <el-alert
                title="パスワードは8文字以上で入力してください"
                type="error"
                v-if="0 < inputPassword.length && inputPassword.length < 8"
                class="alert"
                center
                show-icon
                :closable="false"
            />
            <el-alert
                title="パスワードが一致しません"
                type="error"
                v-if="inputPassword !== reInputPassword"
                class="alert"
                center
                show-icon
                :closable="false"
            />
            <ElButton
                @click="changeTitle"
                class="nextButton"
                v-if="isNext"
                round
            >
                次へ
            </ElButton>
        </div>
    </div>

    <div class="comfirm" v-if="isComfirm">
        <div class="comfirm-title">
            <h2>以下に同意してください</h2>
        </div>
        <div class="agreement">
            <ElCheckbox v-model="ageCheck" label="私は65歳以上です" />
            <ElCheckbox v-model="privacyPolicyCheck" v-if="ageCheck">
                プライバシーポリシーに同意する
            </ElCheckbox>
            <privacy-policy v-if="!privacyPolicyCheck && ageCheck" />
            <ElCheckbox
                v-model="ruleCheck"
                v-if="ageCheck && privacyPolicyCheck"
            >
                利用規約 に同意する
            </ElCheckbox>
            <rule v-if="!ruleCheck && privacyPolicyCheck" />
        </div>
        <ElButton
            type="primary"
            @click="finish"
            class="nextButton"
            round
            v-if="ruleCheck && privacyPolicyCheck && ageCheck"
        >
            次へ
        </ElButton>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/plugins/firebase'; // Firestoreのインスタンスをインポート
import { ElMessage } from 'element-plus';

const router = useRouter();

const isInitializeSetting = ref(true);

const titles = [
    '招待コード',
    'ニックネーム',
    '生年月日',
    '居住地',
    'メールアドレス',
    'パスワード',
];
const times = ref(0);
const title = ref(titles[times.value]);
const inviteCode = ref(true);
const nickName = ref(false);
const date = ref(false);
const live = ref(false);
const email = ref(false);
const password = ref(false);

const inputInviteCode = ref('');
const inputNickName = ref('');
const inputYear = ref<number>();
const inputMonth = ref<number>();
const inputDay = ref<number>();
const inputLive = ref('');
const inputEmail = ref('');
const inputPassword = ref('');
const reInputPassword = ref('');

const isNext = ref(false);

const yearOptions = ref<number[]>([]);
const currentYear = Number(new Date().getFullYear()) - 100;
const day = ref(31);
const liveOptions = [
    { label: '北海道', value: 1 },
    { label: '青森県', value: 2 },
    { label: '岩手県', value: 3 },
    { label: '宮城県', value: 4 },
    { label: '秋田県', value: 5 },
    { label: '山形県', value: 6 },
    { label: '福島県', value: 7 },
    { label: '茨城県', value: 8 },
    { label: '栃木県', value: 9 },
    { label: '群馬県', value: 10 },
    { label: '埼玉県', value: 11 },
    { label: '千葉県', value: 12 },
    { label: '東京都', value: 13 },
    { label: '神奈川県', value: 14 },
    { label: '新潟県', value: 15 },
    { label: '富山県', value: 16 },
    { label: '石川県', value: 17 },
    { label: '福井県', value: 18 },
    { label: '山梨県', value: 19 },
    { label: '長野県', value: 20 },
    { label: '岐阜県', value: 21 },
    { label: '静岡県', value: 22 },
    { label: '愛知県', value: 23 },
    { label: '三重県', value: 24 },
    { label: '滋賀県', value: 25 },
    { label: '京都府', value: 26 },
    { label: '大阪府', value: 27 },
    { label: '兵庫県', value: 28 },
    { label: '奈良県', value: 29 },
    { label: '和歌山県', value: 30 },
    { label: '鳥取県', value: 31 },
    { label: '島根県', value: 32 },
    { label: '岡山県', value: 33 },
    { label: '広島県', value: 34 },
    { label: '山口県', value: 35 },
    { label: '徳島県', value: 36 },
    { label: '香川県', value: 37 },
    { label: '愛媛県', value: 38 },
    { label: '高知県', value: 39 },
    { label: '福岡県', value: 40 },
    { label: '佐賀県', value: 41 },
    { label: '長崎県', value: 42 },
    { label: '熊本県', value: 43 },
    { label: '大分県', value: 44 },
    { label: '宮崎県', value: 45 },
    { label: '鹿児島県', value: 46 },
    { label: '沖縄県', value: 47 },
];

// comfirm
const ageCheck = ref(false);
const privacyPolicyCheck = ref(false);
const ruleCheck = ref(false);
const isComfirm = ref(false);

// function
const changeTitle = () => {
    times.value++;
    isNext.value = false;
    title.value = titles[times.value];
    inviteCode.value = false;
    nickName.value = false;
    date.value = false;
    live.value = false;
    email.value = false;
    password.value = false;

    if (times.value === 1) {
        nickName.value = true;
    } else if (times.value === 2) {
        date.value = true;
    } else if (times.value === 3) {
        live.value = true;
    } else if (times.value === 4) {
        email.value = true;
    } else if (times.value === 5) {
        password.value = true;
    } else if (times.value === 6) {
        isInitializeSetting.value = false;
        isComfirm.value = true;
    }
};

const changeDay = () => {
    if (inputMonth.value === 2) {
        if (
            ((inputYear.value ?? 0) % 4 === 0 &&
                (inputYear.value ?? 0) % 100 !== 0) ||
            (inputYear.value ?? 0) % 400 === 0
        ) {
            day.value = 29;
        } else {
            day.value = 28;
        }
    } else if (
        inputMonth.value === 4 ||
        inputMonth.value === 6 ||
        inputMonth.value === 9 ||
        inputMonth.value === 11
    ) {
        day.value = 30;
    } else {
        day.value = 31;
    }
};

const checkInviteCode = () => {
    if (inputInviteCode.value === '20240516') {
        isNext.value = true;
    } else {
        isNext.value = false;
    }
};

const checkNickName = () => {
    if (inputNickName.value.length >= 1) {
        isNext.value = true;
    } else {
        isNext.value = false;
    }
};

const checkBirthDay = () => {
    if (inputYear.value && inputMonth.value && inputDay.value) {
        isNext.value = true;
    } else {
        isNext.value = false;
    }
};

const checkLive = () => {
    if (inputLive.value) {
        isNext.value = true;
    } else {
        isNext.value = false;
    }
};

const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
};

const checkEmail = () => {
    if (validateEmail(inputEmail.value)) {
        isNext.value = true;
    } else {
        isNext.value = false;
    }
};

const checkPassword = () => {
    if (
        inputPassword.value.length >= 8 &&
        inputPassword.value === reInputPassword.value
    ) {
        isNext.value = true;
    } else {
        isNext.value = false;
    }
};

const finish = () => {
    if (ageCheck.value && privacyPolicyCheck.value && ruleCheck.value) {
        // server にアップロード
        onResister();
        router.push({ path: '/email-verification' });
    }
};

const onResister = () => {
    // アカウントを作成後、ログイン画面に遷移
    createUserWithEmailAndPassword(auth, inputEmail.value, inputPassword.value)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log(user);
            sendEmailVerification(user)
                .then(() => {
                    console.log('send email verification');
                    setDoc(doc(db, 'users', user.uid), {
                        displayName: inputNickName.value,
                        birthDay: `${inputYear.value}/${inputMonth.value}/${inputDay.value}`,
                        liveIn: inputLive.value,
                        isFirstLogin: false,
                        mental: 100,
                        inviteCode: inputInviteCode.value,
                        goodPersons: [''],
                        badPersons: [''],
                        Timestamp: Timestamp.now(),
                    });
                    signOut(auth)
                        .then(() => {
                            console.log('sign out');
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                })
                .catch((error) => {
                    console.log(error);
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
        });
};

const initialize: () => void = () => {
    for (let i = 0; i < 50; i++) {
        yearOptions.value.push(currentYear + i);
    }
};

initialize();
</script>

<style scoped>
.login-title {
    height: 30vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.login-title h1 {
    text-align: center;
    /* font-size: 10%; */
    font-weight: bold;
}

.question {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.birthDay {
    display: flex;
    justify-content: space-between;
    gap: 3%;
    width: 90%;
    height: 5vh;
    margin: 5vh 0;
}

.input {
    width: 90%;
    height: 15vh;
    padding: 20px 20px;
    font-size: 3vh;
}

.el-alert {
    width: 70%;
}
.nextButton {
    margin-bottom: 10vh;
    font-size: 4vh;
    width: 60%;
    height: 10vh;
    color: rgb(0, 0, 0);
    background-color: #a1ff71;
    border: none;

}
.nextButton:hover {
    color: rgb(0, 0, 0);
    background-color: #a1ff71;
}
.nextButton:active {
    color: rgb(0, 0, 0);
    background-color: #a1ff71;
}

.birthDay > .el-input__suffix-inner {
    height: 5vh;
}

.comfirm {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
}

.comfirm-title {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 20vh;
}
.agreement {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: left;
    margin-left: 5%;
    gap: 4vh;
}

.el-checkbox__label {
    font-size: 2.5vh;
}
.el-scrollbar {
    height: 40vh;
    width: 80%;
    margin: 0 auto;
    padding: 0;
    background-color: whitesmoke;
}

@media screen and (min-width: 768px) {
    .nextButton {
        width: 30%;
    }
}
@media screen and (min-width: 1200px) {
    .nextButton {
        width: 20%;
    }
}
</style>
