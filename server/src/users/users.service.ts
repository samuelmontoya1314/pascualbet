import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { supabase } from '../db/supa.client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  async create(
    p_id_usuario: string,
    p_nombre: string,
    p_contrasena: string,
    p_fecha_nacimiento: string,
    p_rol: string,
  ): Promise<{ data: string }> {
    // Hash the password with salt
    const hashed = await bcrypt.hash(p_contrasena, this.SALT_ROUNDS);

    const { data, error } = await supabase.rpc('usp_cuentausuario_crear', {
      p_id_usuario,
      p_nombre,
      p_contrasena: hashed,
      p_fecha_nacimiento,
      p_rol,
    });
    if (error) throw new Error(`Supabase error: ${error.message}`);

    return { data: data };
  }

  async Login(p_id_usuario: string, p_contrasena: string): Promise<any> {
    // 1. Obtener el hash de la contraseña del usuario
    const storedHash = await this.getHash(p_id_usuario);

    if (!storedHash) {
      // Si no hay hash, el usuario no existe.
      throw new HttpException('Usuario o contraseña incorrectos.', HttpStatus.UNAUTHORIZED);
    }

    // 2. Comparar la contraseña enviada con el hash almacenado
    const passwordsMatch = await this.validatePassword(p_contrasena, storedHash);

    if (!passwordsMatch) {
      // Si las contraseñas no coinciden.
      throw new HttpException('Usuario o contraseña incorrectos.', HttpStatus.UNAUTHORIZED);
    }

    // 3. Si todo es correcto, obtener y devolver la información completa del usuario.
    const { data: userInfoData, error: userInfoError } = await supabase.rpc(
      'usp_cuentausuario_obtenerinfo',
      { p_id_usuario },
    );

    if (userInfoError) {
      throw new HttpException(
        `Error al obtener la información del usuario: ${userInfoError.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const userInfo = Array.isArray(userInfoData) && userInfoData.length > 0 ? userInfoData[0] : userInfoData;

    if (!userInfo) {
        throw new HttpException('No se pudieron encontrar los detalles del usuario después del login.', HttpStatus.NOT_FOUND);
    }

    return userInfo;
  }

  /**
   * Compare a plain password with a stored hash.
   */
  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    if (!plain || !hashed) return false;
    return bcrypt.compare(plain, hashed);
  }

  async findAll(): Promise<{ data: string }> {
    const { data, error } = await supabase.rpc('sp_obtenertodoslosusuarios');
    return { data: data };
  }
  async find(p_id_usuario: string): Promise<{ data: string }> {
    const { data, error } = await supabase.rpc('usp_cuentausuario_obtenerinfo', { p_id_usuario });
    return { data: data };
  }
  async update(
    p_id_usuario: string,
    p_nombre: string,
    p_nueva_contrasena: string,
    p_fecha_nacimiento: Date,
  ): Promise<{ data: string }> {
    const { data, error } = await supabase.rpc(
      'usp_cuentaUsuario_actualizarperfil',
      {
        p_id_usuario,
        p_nombre,
        p_nueva_contrasena,
        p_fecha_nacimiento,
      },
    );
    return { data: data };
  }

  async updateUsuario(
    p_id_usuario_actual: string,
    p_id_usuario_nuevo: string,
  ): Promise<{ data: string }> {
    const { data, error } = await supabase.rpc('usp_cuentausuario_modificarid');

    return { data: data };
  }

  async apuestaUsuario(p_id_usuario: string): Promise<{ data: string }> {
    const { data, error } = await supabase.rpc('sp_obtenerapuestasporusuario');
    return { data: data };
  }

  async getHash(
    p_id_usuario: string,
  ): Promise<string> {
    const { data, error } = await supabase.rpc(
      'usp_cuentausuario_login_gethash',
      { p_id_usuario },
    );

    if (error) {
      // Lanzar error para que el llamador lo detecte (puedes cambiar a null/string vacía si prefieres manejarlo ahí)
      throw new Error(`Supabase error: ${error.message}`);
    }
    // Si no hay data, devolver cadena vacía
    if (data == null) return '';

    // Supabase puede devolver arrays o objetos; normalizamos a string.
    try {
      if (Array.isArray(data)) {
        const first = data.length > 0 ? data[0] : null;
        if (first == null) return '';
        if (typeof first === 'string') return first;
        if (typeof first === 'object') {
          const val = Object.values(first)[0];
          return val == null ? '' : String(val);
        }
        return String(first);
      }

      if (typeof data === 'object') {
        const val = Object.values(data)[0];
        return val == null ? '' : String(val);
      }

      return String(data);
    } catch (e) {
      // En caso de cualquier problema de parseo, devolver cadena vacía
      return '';
    }
  }
}