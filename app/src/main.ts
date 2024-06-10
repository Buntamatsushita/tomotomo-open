import { createApp } from 'vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/theme-chalk/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/plugins/firebase'; // Firebaseプラグインからdbをインポート
import { required } from '@vuelidate/validators';

let fbAuthUnsubscribe: (() => void) | undefined;

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

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
            }
        });
    });
}
const routes: RouteRecordRaw[] = [
    { path: '/', redirect: { name: 'start' }, meta: { isPublic: true } },
    {
        path: '/start',
        component: () => import('@/views/common/StartView.vue'),
        name: 'start',
        meta: { isPublic: true },
    },
    {
        path: '/help',
        component: () => import('@/views/common/HelpView.vue'),
        name: 'help',
        meta: { isPublic: true },
    },
    {
        path: '/notification',
        component: () => import('@/views/common/NotificationView.vue'),
        name: 'notification',
        meta: { isPublic: false },
    },
    {
        path: '/login-select',
        component: () => import('@/views/LoginSelectView.vue'),
        name: 'login-select',
        meta: { isPublic: false },
    },
    {
        path: '/search',
        component: () => import('@/views/menu/SearchView.vue'),
        name: 'search',
        meta: { isPublic: false },
    },
    {
        path: '/chat-list',
        component: () => import('@/views/menu/ChatListView.vue'),
        name: 'chat-list',
        meta: { isPublic: false },
    },
    {
        path: '/chat/:id',
        component: () => import('@/views/chat/ChatView.vue'),
        name: 'chat',
        meta: { isPublic: false },
    },
    {
        path: '/call/:id',
        component: () => import('@/views/chat/CallView.vue'),
        name: 'call',
        meta: { isPublic: false },
    },
    {
        path: '/profile',
        component: () => import('@/views/menu/ProfileView.vue'),
        name: 'profile',
        meta: { isPublic: false },
    },
    {
        path: '/login',
        component: () => import('@/views/LoginView.vue'),
        name: 'login',
        meta: { isPublic: true },
    },
    {
        path: '/signup',
        component: () => import('@/views/SignUpView.vue'),
        name: 'signup',
        meta: { isPublic: true },
    },
    {
        path: '/404',
        component: () => import('@/views/error/404.vue'),
        name: '404',
        meta: { isPublic: true },
    },
    {
        path: '/500',
        component: () => import('@/views/error/500.vue'),
        name: '500',
        meta: { isPublic: true },
    },
    {
        path: '/email-verification',
        component: () => import('@/views/EmailVerificationView.vue'),
        name: 'email-verification',
        meta: { isPublic: true },
    },
    {
        path: '/set-profile',
        component: () => import('@/views/SetProfileView.vue'),
        name: 'set-profile',
        meta: { isPublic: false },
    },
    {
        path: '/privacy-policy',
        component: () => import('@/views/agreement/PrivacyPolicyView.vue'),
        name: 'privacy-policy',
        meta: { isPublic: true },
    },
    {
        path: '/rule',
        component: () => import('@/views/agreement/RuleView.vue'),
        name: 'rule',
        meta: { isPublic: true },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: { name: '404' },
        meta: { isPublic: true },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta?.isPublic)) {
        next();
    } else {
        if (fbAuthUnsubscribe) fbAuthUnsubscribe();
        fbAuthUnsubscribe = onAuthStateChanged(auth, (user: User | null) => {
            if (user) {
                next();
            } else {
                next({ path: '/login', query: { redirect: to.fullPath } });
            }
        });
    }
});

// FirebaseのauthとrouterをVueアプリに追加
app.use(auth as any);
app.use(router);
app.use(ElementPlus);
app.mount('#app');
