import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Prisma } from '@prisma/client';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  async create(@Body() data: Prisma.WorkflowCreateInput) {
    try {
      const result = await this.workflowService.create(data);
      return result;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw new HttpException(
        'Failed to create workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      const result = await this.workflowService.findAll();
      return result;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw new HttpException(
        'Failed to fetch workflows',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.workflowService.findOne(id);
      return result;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw new HttpException(
        'Failed to fetch workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.WorkflowUpdateInput,
  ) {
    try {
      const result = await this.workflowService.update(id, data);
      console.log(result);
      return result;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw new HttpException(
        'Failed to update workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.workflowService.remove(id);
      return result;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw new HttpException(
        'Failed to delete workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
