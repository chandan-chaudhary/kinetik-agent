import { PrismaService } from '@/database/prisma.service';
import { WorkflowDefinition } from '@/workflow/types/workflow.types';
import { Injectable } from '@nestjs/common';
import { NodeType, Prisma } from '@prisma/client';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.WorkflowCreateInput) {
    try {
      console.log('Creating workflow:', data);
      const nodes = {
        type: NodeType.INITIAL,
        position: { x: 0, y: 0 },
        data: {},
      };
      const result = await this.prisma.workflow.create({
        data: {
          ...data,
          nodes: { create: nodes },
        },
      });
      return result;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.workflow.findMany({});
    } catch (error) {
      console.error('Error finding all workflows:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.workflow.findUnique({
        where: { id },
        include: { nodes: true, connections: true },
      });
    } catch (error) {
      console.error(`Error finding workflow with id ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, data: Prisma.WorkflowUpdateInput) {
    try {
      return await this.prisma.workflow.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(`Error updating workflow with id ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.workflow.delete({ where: { id } });
    } catch (error) {
      console.error(`Error removing workflow with id ${id}:`, error);
      throw error;
    }
  }

  saveWorkflow(data: any) {
    console.log('Saving workflow:', data);
    // TODO: Implement actual save logic
    return { message: 'Workflow saved successfully' };
  }

  executeWorkflow(data: WorkflowDefinition) {
    console.log('Executing workflow:', data);
    // TODO: Implement actual execution logic
    return { message: 'Workflow executed successfully' };
  }
}
