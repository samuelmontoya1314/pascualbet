import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { supabase } from '../db/supa.client';

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const sessionToken = request.headers['x-session-token'];

    if (!userId || !sessionToken) {
      throw new UnauthorizedException('Sesión no válida');
    }

    // Verificar que el usuario existe y la sesión es válida
    try {
      const { data, error } = await supabase
        .rpc('usp_cuentausuario_obtenerinfo', { p_id_usuario: userId });
      
      if (error || !data || data.length === 0) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Adjuntar datos del usuario a la request
      request.user = Array.isArray(data) ? data[0] : data;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Error al validar sesión');
    }
  }
}
