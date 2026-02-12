import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SavedViewsService } from './saved-views.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';
import { UpdateSavedViewDto } from './dto/update-saved-view.dto';
import { QuerySavedViewsDto } from './dto/query-saved-views.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('saved-views')
@UseGuards(JwtAuthGuard)
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Get()
  @RequirePermissions('saved-views:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QuerySavedViewsDto,
  ) {
    return this.savedViewsService.findAll(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('saved-views:create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSavedViewDto,
  ) {
    return this.savedViewsService.create(user.tenantId, user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions('saved-views:update')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSavedViewDto,
  ) {
    return this.savedViewsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('saved-views:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.savedViewsService.remove(user.tenantId, id);
  }
}
