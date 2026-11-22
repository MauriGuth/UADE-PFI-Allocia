import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
@Catch()
export class SafeErrors implements ExceptionFilter {
  private readonly logger=new Logger('Http');
  catch(error: unknown, host: ArgumentsHost) {
    const res=host.switchToHttp().getResponse();
    const status=error instanceof HttpException ? error.getStatus() : 500;
    if(status>=500) this.logger.error(JSON.stringify({event:'request_failed',status,requestId:res.getHeader('X-Request-ID')}));
    const response=error instanceof HttpException ? error.getResponse() : null;
    const message=status>=500 ? 'Servicio temporalmente no disponible' : typeof response==='object' ? (response as any).message : response;
    res.status(status).json({statusCode:status,message});
  }
}
