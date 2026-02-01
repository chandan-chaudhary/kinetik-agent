import { PrismaService } from '@/database/prisma.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { NodeType, Prisma } from '@prisma/client';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.WorkflowCreateInput) {
    try {
      if (!data.name || data.name.trim() === '') {
        throw new BadRequestException('Workflow name is required');
      }

      const nodes = {
        type: NodeType.INITIAL,
        position: { x: 0, y: 0 },
        data: {},
      };

      return await this.prisma.workflow.create({
        data: {
          ...data,
          nodes: { create: nodes },
        },
        include: {
          nodes: true,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating workflow:', error);
      throw new InternalServerErrorException('Failed to create workflow');
    }
  }

  async findAll() {
    try {
      return await this.prisma.workflow.findMany({
        include: {
          nodes: true,
          connections: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error finding all workflows:', error);
      throw new InternalServerErrorException('Failed to fetch workflows');
    }
  }

  async findOne(id: string) {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('Workflow ID is required');
      }

      const workflow = await this.prisma.workflow.findUnique({
        where: { id },
        include: {
          nodes: true,
          connections: true,
        },
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow with id ${id} not found`);
      }

      return workflow;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Error finding workflow with id ${id}:`, error);
      throw new InternalServerErrorException('Failed to fetch workflow');
    }
  }

  async update(id: string, data: Prisma.WorkflowUpdateInput) {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('Workflow ID is required');
      }

      return await this.prisma.$transaction(async (tx) => {
        // Check if workflow exists
        const existingWorkflow = await tx.workflow.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!existingWorkflow) {
          throw new NotFoundException(`Workflow with id ${id} not found`);
        }

        // Extract nodes and connections from data
        const {
          nodes: newNodes,
          connections: newConnections,
          ...otherData
        } = data;

        // Delete existing nodes and connections in parallel
        await Promise.all([
          tx.node.deleteMany({ where: { workflowId: id } }),
          tx.connection.deleteMany({ where: { workflowId: id } }),
        ]);

        // Create new nodes using createMany for better performance
        if (newNodes && Array.isArray(newNodes)) {
          const nodeData = (newNodes as Prisma.NodeCreateManyInput[]).map(
            (node) => ({
              ...node,
              workflowId: id,
            }),
          );
          if (nodeData.length > 0) {
            await tx.node.createMany({ data: nodeData });
          }
        }

        // Create new connections using createMany for better performance
        if (newConnections && Array.isArray(newConnections)) {
          const connectionData = (
            newConnections as Prisma.ConnectionCreateManyInput[]
          ).map((conn) => ({
            ...conn,
            workflowId: id,
          }));
          if (connectionData.length > 0) {
            await tx.connection.createMany({ data: connectionData });
          }
        }

        // Update the workflow with any other data and return with relations
        if (Object.keys(otherData).length > 0) {
          await tx.workflow.update({
            where: { id },
            data: otherData,
          });
        }

        // Return the updated workflow with all relations
        return await tx.workflow.findUnique({
          where: { id },
          include: { nodes: true, connections: true },
        });
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Error updating workflow with id ${id}:`, error);
      throw new InternalServerErrorException('Failed to update workflow');
    }
  }

  async remove(id: string) {
    try {
      if (!id || id.trim() === '') {
        throw new BadRequestException('Workflow ID is required');
      }

      // Check if workflow exists before deleting
      const workflow = await this.prisma.workflow.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow with id ${id} not found`);
      }

      // Prisma handles cascading deletes automatically if configured
      return await this.prisma.workflow.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Error removing workflow with id ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete workflow');
    }
  }
}
