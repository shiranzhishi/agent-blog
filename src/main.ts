import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import 'md-editor-v3/lib/style.css'
import './styles/responsive.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)

// 初始化认证状态
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
