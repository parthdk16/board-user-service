import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class S2SAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const serviceToken = request.headers['x-service-token'];

    if (!serviceToken || serviceToken !== 'abcde') {
      throw new UnauthorizedException('Invalid or missing service token');
    }

    return true;
  }
}
