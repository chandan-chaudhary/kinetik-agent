import { PrismaService } from '@/database/prisma.service';
import { Injectable, HttpStatus } from '@nestjs/common';
import { NodeType, Prisma } from '@prisma/client';
import { createError, customError } from '@/common/customError';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.WorkflowCreateInput, userId: string) {
    try {
      if (!data.name || data.name.trim() === '') {
        throw createError('Workflow name is required', {
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }

      const nodes = {
        type: NodeType.INITIAL,
        position: { x: 0, y: 0 },
        data: {},
      };

      const workflow = await this.prisma.workflow.create({
        data: {
          ...data,
          nodes: { create: nodes },
          user: { connect: { id: userId } },
        },
        include: {
          nodes: true,
        },
      });
      if (!workflow) {
        throw createError('Failed to create workflow', {
          httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }
      return workflow;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to create workflow',
      });
    }
  }

  async findAll(userId: string) {
    try {
      const workflows = await this.prisma.workflow.findMany({
        where: {
          userId: userId, // Replace with actual user ID from auth context
        },
        include: {
          nodes: true,
          connections: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (!workflows) {
        throw createError('No workflows found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
      return workflows;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to fetch workflows',
      });
    }
  }

  async findOne(id: string, userId: string) {
    try {
      if (!id || id.trim() === '') {
        throw createError('Workflow ID is required', {
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }

      const workflow = await this.prisma.workflow.findUnique({
        where: { id, userId: userId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      if (!workflow) {
        throw createError(`Workflow with id ${id} not found`, {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      return workflow;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to fetch workflow',
      });
    }
  }

  async update(id: string, data: Prisma.WorkflowUpdateInput, userId: string) {
    try {
      if (!id || id.trim() === '') {
        throw createError('Workflow ID is required', {
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }

      return await this.prisma.$transaction(async (tx) => {
        // Check if workflow exists
        const existingWorkflow = await tx.workflow.findUnique({
          where: { id, userId: userId },
          select: { id: true },
        });

        if (!existingWorkflow) {
          throw createError(`Workflow with id ${id} not found`, {
            httpStatus: HttpStatus.NOT_FOUND,
          });
        }

        // Extract nodes and connections from data
        const {
          nodes: newNodes,
          connections: newConnections,
          ...otherData
        } = data;

        // Delete existing nodes and connections in parallel
        await Promise.all([
          tx.node.deleteMany({ where: { workflowId: existingWorkflow.id } }),
          tx.connection.deleteMany({
            where: { workflowId: existingWorkflow.id },
          }),
        ]);

        // Create new nodes using createMany for better performance
        if (newNodes && Array.isArray(newNodes)) {
          const nodeData = (newNodes as Prisma.NodeCreateManyInput[]).map(
            (node) => ({
              ...node,
              workflowId: existingWorkflow.id,
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
            workflowId: existingWorkflow.id,
          }));
          if (connectionData.length > 0) {
            await tx.connection.createMany({ data: connectionData });
          }
        }

        // Update the workflow with any other data and return with relations
        if (Object.keys(otherData).length > 0) {
          await tx.workflow.update({
            where: { id, userId: userId },
            data: otherData,
          });
        }

        // Return the updated workflow with all relations
        return await tx.workflow.findUnique({
          where: { id, userId: userId },
          include: { nodes: true, connections: true },
        });
      });
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to update workflow',
      });
    }
  }

  async remove(id: string, userId: string) {
    try {
      if (!id || id.trim() === '') {
        throw createError('Workflow ID is required', {
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }

      // Check if workflow exists before deleting
      const workflow = await this.prisma.workflow.findUnique({
        where: { id, userId: userId },
        select: { id: true },
      });

      if (!workflow) {
        throw createError(`Workflow with id ${id} not found`, {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      // Prisma handles cascading deletes automatically if configured
      return await this.prisma.workflow.delete({ where: { id } });
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to delete workflow',
      });
    }
  }
}
