import { createApp } from 'vue'
import '../css/globals.css'
import '../css/login.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
