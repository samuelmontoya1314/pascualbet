import { createRouter, createWebHashHistory } from 'vue-router';
import { isSessionValid, getSessionInfo } from '../utils/api.js';
import index from '../components/index.vue';
import login from '../components/login.vue';
import SlotM from '../components/games/slotM.vue';
import Rulet from '../components/games/rulet.vue';
import Blackjack from '../components/games/Blackjack.vue';
import Usuarios from '../components/admin/usuarios.vue';
import Plinko from '../components/games/plinko.vue';
import Mines from '../components/games/mines.vue';
import Rocket from '../components/games/rocket.vue';
import Transaciones from '../components/admin/transaciones.vue';
import Juegos from '../components/admin/juegos.vue';

// Guard para rutas que requieren autenticación
const requireAuth = (to, from, next) => {
  if (!isSessionValid()) {
    next('/');
  } else {
    next();
  }
};

// Guard para rutas que requieren rol de administrador
const requireAdmin = (to, from, next) => {
  if (!isSessionValid()) {
    next('/');
    return;
  }
  
  const session = getSessionInfo();
  if (!session || session.rol !== 'Administrador') {
    next('/menu');
  } else {
    next();
  }
};

const routes = [
  {
    path: '/',
    component: login,
    beforeEnter: (to, from, next) => {
      if (isSessionValid()) {
        next('/menu');
      } else {
        next();
      }
    }
  },
  {
    path: '/menu',
    component: index,
    beforeEnter: requireAuth
  },
  { path: '/slot', component: SlotM, beforeEnter: requireAuth },
  { path: '/rulete', component: Rulet, beforeEnter: requireAuth },
  { path: '/BJ', component: Blackjack, beforeEnter: requireAuth },
  { path: '/plinko', component: Plinko, beforeEnter: requireAuth },
  { path: '/mines', component: Mines, beforeEnter: requireAuth },
  { path: '/rocket', component: Rocket, beforeEnter: requireAuth },
  { path: '/admin/usuarios', component: Usuarios, beforeEnter: requireAdmin },
  { path: '/admin/juegos', component: Juegos, beforeEnter: requireAdmin },
  { path: '/admin/transaciones', component: Transaciones, beforeEnter: requireAdmin }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
