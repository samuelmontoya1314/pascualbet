import { createRouter, createWebHistory } from 'vue-router';
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

const routes = [
  {
    path: '/',
    component: login,
    beforeEnter: (to, from, next) => {
      const session = localStorage.getItem('pb:session');
      if (session) {
        next('/menu'); // Si hay sesión activa, redirige al menú
      } else {
        next(); // Permite el acceso al login
      }
    }
  },
  {
    path: '/menu',
    component: index,
    beforeEnter: (to, from, next) => {
      const session = localStorage.getItem('pb:session');
      if (!session) {
        next('/'); // Si no hay sesión, redirige al login
      } else {
        next(); // Permite el acceso al menú
      }
    }
  },
  { path: '/slot', component: SlotM },
  { path: '/rulete', component: Rulet },
  { path: '/BJ', component: Blackjack },
  { path: '/plinko', component: Plinko },
  { path: '/mines', component: Mines },
  { path: '/rocket', component: Rocket },
  { path: '/admin/usuarios', component: Usuarios },
  { path: '/admin/juegos', component: Juegos },
  { path: '/admin/transaciones', component: Transaciones }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
