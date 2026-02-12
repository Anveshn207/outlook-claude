import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumesService } from './resumes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post('upload/:candidateId')
  @RequirePermissions('candidates:update')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: CurrentUserPayload,
    @Param('candidateId') candidateId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.resumesService.upload(
      user.tenantId,
      user.id,
      candidateId,
      file,
    );
  }

  @Get('candidate/:candidateId')
  @RequirePermissions('candidates:read')
  async findByCandidate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('candidateId') candidateId: string,
  ) {
    return this.resumesService.findByCandidate(user.tenantId, candidateId);
  }

  @Get(':id')
  @RequirePermissions('candidates:read')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.resumesService.findOne(user.tenantId, id);
  }

  @Patch(':id/primary')
  @RequirePermissions('candidates:update')
  async setPrimary(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.resumesService.setPrimary(user.tenantId, id);
  }

  @Delete(':id')
  @RequirePermissions('candidates:update')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.resumesService.remove(user.tenantId, id);
  }
}
