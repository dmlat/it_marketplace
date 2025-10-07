import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AuthModule, CompaniesModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
