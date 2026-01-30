import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Prisma } from '@prisma/client';
import type { WorkflowDefinition } from './dto/create-workflow.dto';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  create(@Body() data: Prisma.WorkflowCreateInput) {
    return this.workflowService.create(data);
  }

  @Get()
  findAll() {
    return this.workflowService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.WorkflowUpdateInput) {
    return this.workflowService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }
  @Post('save')
  save(@Body() data: WorkflowDefinition) {
    return this.workflowService.saveWorkflow(data);
  }

  @Post('execute')
  execute(@Body() data: WorkflowDefinition) {
    console.log(data, data.nodes, 'in workflow controller');

    return this.workflowService.executeWorkflow(data);
  }
}
