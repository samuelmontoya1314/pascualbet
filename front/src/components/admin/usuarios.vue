<template>
    <div class="usuarios-panel">
      <div class="panel-header">
        <h1>Panel de Administración de Usuarios</h1>
        <a href="/" class="btn btn-info">Volver al Inicio</a>
      </div>
  
      <!-- Barra de Controles: Búsqueda y Añadir Usuario -->
      <div class="controls">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Buscar por nombre, email o rol..."
          class="search-input"
        />
        <button @click="addNewUser" class="btn btn-primary">Añadir Usuario</button>
      </div>
  
      <!-- Tabla de Usuarios -->
      <div class="table-responsive">
        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Mensaje cuando no hay resultados -->
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="no-results">No se encontraron usuarios.</td>
            </tr>
            <!-- Itera sobre los usuarios filtrados -->
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>
                <span :class="['status', user.active ? 'status-active' : 'status-inactive']">
                  {{ user.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="actions">
                <button @click="editUser(user)" class="btn btn-secondary">Editar</button>
                <button @click="toggleUserStatus(user)" class="btn btn-warning">
                  {{ user.active ? 'Desactivar' : 'Activar' }}
                </button>
                <button @click="deleteUser(user)" class="btn btn-danger">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Usuarios',
    data() {
      return {
        searchQuery: '',
        // En una aplicación real, estos datos vendrían de una API.
        users: [
          { id: 1, name: 'Ana García', email: 'ana.garcia@example.com', role: 'Admin', active: true },
          { id: 2, name: 'Carlos Rodríguez', email: 'carlos.r@example.com', role: 'Editor', active: true },
          { id: 3, name: 'Beatriz López', email: 'beatriz.lopez@example.com', role: 'Visitante', active: false },
          { id: 4, name: 'David Martínez', email: 'david.m@example.com', role: 'Editor', active: true },
          { id: 5, name: 'Elena Pérez', email: 'elena.perez@example.com', role: 'Visitante', active: true },
        ],
      };
    },
    computed: {
      /**
       * Filtra los usuarios basándose en el texto de búsqueda.
       * La búsqueda no distingue mayúsculas de minúsculas.
       */
      filteredUsers() {
        if (!this.searchQuery) {
          return this.users;
        }
        const lowerCaseQuery = this.searchQuery.toLowerCase();
        return this.users.filter(user =>
          user.name.toLowerCase().includes(lowerCaseQuery) ||
          user.email.toLowerCase().includes(lowerCaseQuery) ||
          user.role.toLowerCase().includes(lowerCaseQuery)
        );
      },
    },
    methods: {
      /**
       * Simula la edición de un usuario.
       * En una app real, abriría un modal o navegaría a una página de edición.
       */
      editUser(user) {
        alert(`Editando usuario: ${user.name} (ID: ${user.id})`);
        // Aquí iría la lógica para mostrar un formulario de edición.
      },
      /**
       * Cambia el estado 'active' de un usuario.
       */
      toggleUserStatus(user) {
        // Encontramos el usuario en el array original y cambiamos su estado
        const userToUpdate = this.users.find(u => u.id === user.id);
        if (userToUpdate) {
          userToUpdate.active = !userToUpdate.active;
          // En una app real, aquí harías una llamada a la API para actualizar el estado.
        }
      },
      /**
       * Simula la eliminación de un usuario.
       */
      deleteUser(user) {
        if (confirm(`¿Estás seguro de que quieres eliminar a ${user.name}?`)) {
          // Filtramos el array para "eliminar" al usuario de la vista.
          this.users = this.users.filter(u => u.id !== user.id);
          // En una app real, aquí harías una llamada a la API (DELETE /api/users/{id}).
          alert(`Usuario ${user.name} eliminado.`);
        }
      },
      /**
       * Simula la adición de un nuevo usuario.
       */
      addNewUser() {
          alert("Abriendo formulario para añadir un nuevo usuario...");
          // Aquí podrías abrir un modal o navegar a una ruta '/users/new'
          // Para demostración, añadimos un usuario de ejemplo:
          const newUser = {
              id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
              name: 'Nuevo Usuario',
              email: 'nuevo@example.com',
              role: 'Visitante',
              active: true,
          };
          this.users.unshift(newUser); // Añade el nuevo usuario al principio de la lista
      }
    },
  };
  </script>
  
  <style scoped>
  .usuarios-panel {
    margin: 20px;
    padding: 20px;
    background-color: #2d3748; /* Fondo oscuro */
    color: #e2e8f0; /* Color de texto claro */
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #4a5568;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }

  h1 {
    color: #e2e8f0;
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .search-input {
    padding: 10px;
    border: 1px solid #4a5568;
    background-color: #1a202c;
    color: #e2e8f0;
    border-radius: 4px;
    font-size: 16px;
    width: 300px;
  }
  
  .search-input::placeholder {
    color: #a0aec0;
  }
  
  .table-responsive {
    overflow-x: auto;
  }
  
  .user-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #4a5568;
  }
  
  .user-table th,
  .user-table td {
    border: 1px solid #2d3748;
    padding: 12px;
    text-align: left;
  }
  
  .user-table td {
    color: #cbd5e0;
  }

  .user-table th {
    background-color: #2d3748;
    font-weight: bold;
    color: #a0aec0;
  }
  
  .user-table tr:nth-child(even) {
    background-color: #4a5568;
  }
  
  .user-table tr {
    background-color: #354152;
  }

  .user-table tr:hover {
    background-color: #5a677d;
  }
  
  .status {
    padding: 5px 10px;
    border-radius: 12px;
    color: #fff;
    font-size: 12px;
    font-weight: bold;
  }
  
  .status-active {
    background-color: #28a745; /* Verde */
  }
  
  .status-inactive {
    background-color: #c53030; /* Rojo oscuro */
  }
  
  .actions {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  
  .no-results {
    text-align: center;
    color: #a0aec0;
    font-style: italic;
    padding: 20px;
  }
  
  /* Estilos de botones genéricos */
  .btn {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: white;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  .btn-primary { background-color: #2b6cb0; }
  .btn-primary:hover { background-color: #2c5282; }
  
  .btn-secondary { background-color: #4a5568; }
  .btn-secondary:hover { background-color: #2d3748; }

  .btn-info { background-color: #3182ce; }
  .btn-info:hover { background-color: #2b6cb0; }
  
  .btn-warning { background-color: #dd6b20; color: #fff; }
  .btn-warning:hover { background-color: #c05621; }
  
  .btn-danger { background-color: #c53030; }    
  .btn-danger:hover { background-color: #9b2c2c; }

  .button-group {
    display: flex;
    gap: 10px;
  }
  </style>
