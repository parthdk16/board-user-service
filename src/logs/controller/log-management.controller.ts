// log-management.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MongoDBLoggerService } from '../service/mongodb-logger.service';

@ApiTags('Log Management')
@Controller('logs')
// @UseGuards(AdminGuard)
export class LogManagementController {
  constructor(private readonly mongoLogger: MongoDBLoggerService) {}

  @Get()
  @ApiOperation({ summary: 'Get logs with filtering options' })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'ipAddress', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'correlationId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'skip', required: false })
  async getLogs(
    @Query('level') level?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('userId') userId?: string,
    @Query('correlationId') correlationId?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const filters = {
      level,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      ipAddress,
      userId,
      correlationId,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    };

    return this.mongoLogger.findLogs(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get log statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getLogStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.mongoLogger.getLogStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
