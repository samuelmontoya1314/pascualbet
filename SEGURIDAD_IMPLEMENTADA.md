# 🔒 Implementación de Seguridad con Tokens de Sesión

## 📋 Resumen

Hemos implementado un sistema de autenticación basado en **tokens de sesión** sin necesidad de JWT ni recursos adicionales. Este sistema:

✅ **No requiere bibliotecas externas** (usa módulo `crypto` nativo de Node.js)
✅ **Valida sesiones en el backend** 
✅ **Protege rutas y endpoints**
✅ **Implementa control de roles** (Usuario/Administrador)
✅ **Maneja expiración de sesiones** (24 horas)

---

## 🎯 ¿Cómo Funciona?

### 1. **Login**
```
Usuario → Login → Backend valida credenciales → Genera token único → Devuelve token + datos
```

### 2. **Peticiones Protegidas**
```
Cliente → Envía headers (x-user-id, x-session-token) → Backend valida → Procesa petición
```

### 3. **Expiración**
```
Token expira en 24h → Cliente detecta expiración → Redirige a login
```

---

## 📁 Archivos Creados/Modificados

### Backend (NestJS)
- ✅ `server/src/auth/session.guard.ts` - Guard de validación de sesión
- ✅ `server/src/auth/admin.guard.ts` - Guard de validación de administrador
- ✅ `server/src/users/users.service.ts` - Generación de tokens
- ✅ `server/src/users/users.controller.ts` - Protección con guards
- ✅ `server/src/apuestas/apuestas.controller.ts` - Protección con guards

### Frontend (Vue)
- ✅ `front/src/utils/api.js` - Utilidades para peticiones autenticadas
- ✅ `front/src/utils/betApi.js` - Actualizado con autenticación
- ✅ `front/src/store/balance.js` - Sincronización con autenticación
- ✅ `front/src/components/login.vue` - Manejo de token en login
- ✅ `front/src/router/index.js` - Guards de navegación mejorados

---

## 🔑 Headers de Autenticación

Todas las peticiones autenticadas ahora envían:

```javascript
{
  'x-user-id': 'ID_DEL_USUARIO',
  'x-session-token': 'TOKEN_GENERADO_EN_LOGIN'
}
```

---

## 🛡️ Endpoints Protegidos

### Requieren Sesión Válida:
- `GET /api/users/find/:id`
- `POST /api/apuestas/new`
- `POST /api/apuestas/new/bet`
- Todas las rutas de juegos en el frontend
- `/menu`

### Requieren Rol Administrador:
- `GET /api/users/f` (lista todos los usuarios)
- `/admin/usuarios`
- `/admin/juegos`
- `/admin/transaciones`

---

## 🚀 Cómo Usar

### En el Frontend

#### Petición Autenticada Normal:
```javascript
import { authenticatedFetch } from '@/utils/api.js';

const response = await authenticatedFetch('https://api.com/endpoint', {
  method: 'POST',
  body: JSON.stringify({ data: 'value' })
});
```

#### Verificar Sesión:
```javascript
import { isSessionValid } from '@/utils/api.js';

if (isSessionValid()) {
  // Sesión válida
}
```

#### Obtener Info de Sesión:
```javascript
import { getSessionInfo } from '@/utils/api.js';

const session = getSessionInfo();
console.log(session.rol); // 'Usuario' o 'Administrador'
```

---

## 🔒 Formato de Sesión en localStorage

```javascript
{
  uid: "usuario123",
  nombre: "Juan Pérez",
  rol: "Usuario", // o "Administrador"
  saldo: 1000,
  dob: "1990-01-01",
  foto: "url_foto",
  sessionToken: "abc123...", // Token generado por el servidor
  expiresAt: 1234567890000, // Timestamp de expiración
  ts: 1234567890000 // Timestamp de creación
}
```

---

## ⚠️ Comportamiento en Caso de Error

### Sesión Expirada:
1. Cliente detecta expiración local → Redirige a login
2. Backend rechaza con 401 → Cliente redirige a login

### Sesión Inválida:
1. Backend valida token
2. Si no es válido → 401 Unauthorized
3. Cliente limpia localStorage y redirige a login

### Sin Permisos:
1. Usuario normal intenta acceder a ruta admin
2. Backend rechaza con 403 Forbidden
3. Cliente redirige a `/menu`

---

## 🎨 Ventajas de Este Sistema

### ✅ Pros:
- **Sin dependencias extra** - Usa módulos nativos
- **Simple de entender** - No requiere conocimiento de JWT
- **Fácil de mantener** - Menos complejidad
- **Rápido de implementar** - Ya está listo
- **Suficiente para MVP** - Cubre necesidades básicas

### ⚠️ Contras:
- **No distribuido** - Cada validación consulta la DB
- **No revocable** - Token válido hasta expiración
- **No escalable** - Para millones de usuarios, usar JWT

---

## 🔄 Próximos Pasos (Opcional)

Si necesitas más seguridad en el futuro:

### Nivel 2: Tokens en Base de Datos
- Guardar tokens en Supabase
- Poder revocar tokens específicos
- Historial de sesiones activas

### Nivel 3: JWT Completo
- Instalar `@nestjs/jwt`
- Tokens firmados criptográficamente
- Refresh tokens

### Nivel 4: OAuth/SSO
- Integración con Google/Facebook
- Auth0 o similar

---

## 🧪 Probar la Implementación

### 1. Instalar dependencias (si es necesario):
```bash
cd server
npm install

cd ../front
npm install
```

### 2. Ejecutar backend:
```bash
cd server
npm run start:dev
```

### 3. Ejecutar frontend:
```bash
cd front
npm run dev
```

### 4. Probar flujo completo:
1. Login → Debería recibir sessionToken
2. Navegar a juegos → Debería funcionar
3. Intentar acceder a `/admin/usuarios` sin ser admin → Debería redirigir
4. Verificar en Network tab que se envían headers `x-user-id` y `x-session-token`

---

## 📞 Troubleshooting

### "401 Unauthorized" en todas las peticiones:
- Verificar que el token se guarda en login
- Verificar que los headers se envían correctamente
- Ver console.log en `authenticatedFetch`

### Guards no funcionan:
- Verificar que el backend esté usando `@UseGuards(SessionGuard)`
- Revisar que Supabase devuelva datos correctos

### Redirige infinitamente al login:
- Verificar que `expiresAt` se guarda correctamente
- Revisar formato de fecha (debe ser timestamp)

---

## ✨ Conclusión

Has implementado un sistema de autenticación **robusto y funcional** sin necesidad de JWT ni recursos adicionales. Este sistema:

- ✅ Valida sesiones en el servidor
- ✅ Protege endpoints sensibles
- ✅ Controla acceso por roles
- ✅ Maneja expiración automática
- ✅ Es fácil de mantener

**¡Tu aplicación ahora es mucho más segura! 🎉**
