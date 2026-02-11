import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchCandidatesDto } from './dto/search-candidates.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('candidates')
  async searchCandidates(
    @CurrentUser() user: CurrentUserPayload,
    @Query() dto: SearchCandidatesDto,
  ) {
    return this.searchService.searchCandidates(
      user.tenantId,
      dto.q,
      { status: dto.status, source: dto.source },
      dto.page,
      dto.limit,
    );
  }

  @Post('reindex')
  @HttpCode(HttpStatus.OK)
  async reindex(@CurrentUser() user: CurrentUserPayload) {
    this.searchService.reindexAll(user.tenantId, this.prisma);
    return { message: 'Reindex started' };
  }
}
