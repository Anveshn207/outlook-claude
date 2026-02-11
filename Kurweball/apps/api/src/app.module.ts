import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { InterviewsModule } from './modules/interviews/interviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    CandidatesModule,
    JobsModule,
    ClientsModule,
    PipelineModule,
    SubmissionsModule,
    InterviewsModule,
  ],
})
export class AppModule {}
