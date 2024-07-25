import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import SvgIcon from './components/SvgIcon.vue'
import router from '@/router'
import './assets/index.css'
import '@/style/index.scss'

const app = createApp(App)
const pinia = createPinia()
app.component('SvgIcon', SvgIcon)
app.use(router)
app.use(pinia)
app.mount('#app')
