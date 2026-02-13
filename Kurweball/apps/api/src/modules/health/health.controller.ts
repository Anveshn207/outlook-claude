import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
