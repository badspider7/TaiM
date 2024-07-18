import { createApp } from 'vue'
import App from './App.vue'
import SvgIcon from './components/SvgIcon.vue'
import router from '@/router'
import './assets/index.css'
import '@/style/index.scss'

const app = createApp(App)
app.component('SvgIcon', SvgIcon)
app.use(router)
app.mount('#app')
