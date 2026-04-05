import { PrismaService } from '@/database/prisma.service';
import { Injectable, HttpStatus } from '@nestjs/common';
import { NodeType, Prisma } from '@prisma/client';
import { createError, customError } from '@/common/customError';
import { CacheHelperService } from '@/redis/cache-helper.service';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private readonly cacheHelper: CacheHelperService,
  ) {}
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

      await this.cacheHelper.invalidateEntityCache({
        entity: 'workflow',
        scope: [userId],
      });

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
      const cacheKey = this.cacheHelper.buildEntityListKey('workflow', [
        userId,
      ]);
      const cached = await this.cacheHelper.get(cacheKey);
      if (cached) {
        return cached;
      }

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

      await this.cacheHelper.set(cacheKey, workflows, 300);

      return workflows;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to fetch workflows',
      });
    }
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<
    Prisma.WorkflowGetPayload<{ include: { nodes: true; connections: true } }>
  > {
    try {
      if (!id || id.trim() === '') {
        throw createError('Workflow ID is required', {
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }

      const cacheKey = this.cacheHelper.buildEntityItemKey('workflow', id, [
        userId,
      ]);
      const cached = await this.cacheHelper.get(cacheKey);
      if (cached) {
        return cached as Prisma.WorkflowGetPayload<{
          include: { nodes: true; connections: true };
        }>;
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

      await this.cacheHelper.set(cacheKey, workflow, 300);

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

      const updatedWorkflow = await this.prisma.$transaction(async (tx) => {
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

      await this.cacheHelper.invalidateEntityCache({
        entity: 'workflow',
        scope: [userId],
        id,
      });

      return updatedWorkflow;
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
      const deleted = await this.prisma.workflow.delete({ where: { id } });

      await this.cacheHelper.invalidateEntityCache({
        entity: 'workflow',
        scope: [userId],
        id,
      });

      return deleted;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to delete workflow',
      });
    }
  }
}
