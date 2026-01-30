import { Controller, Get, Query, Logger } from '@nestjs/common';
import { NodesService } from './nodes.service';
import {
  GetNodeTemplatesQueryDto,
  NodeTemplateDto,
} from './dto/node-template.dto';
import { NodeTemplateService } from './node-template.service';
@Controller('nodes')
export class NodesController {
  private readonly logger = new Logger(NodesController.name);

  constructor(
    private readonly nodeTemplateService: NodeTemplateService,
    private readonly nodesService: NodesService,
  ) {}

  /**
   * Get all available node templates
   * Can be filtered by domain or category
   */
  @Get()
  getNodeTemplates(
    @Query() query: GetNodeTemplatesQueryDto,
  ): NodeTemplateDto[] | Record<string, NodeTemplateDto[]> {
    this.logger.log(
      `Getting node templates with filters: ${JSON.stringify(query)}`,
    );

    if (query.domain) {
      return this.nodeTemplateService.getTemplatesByDomain(query.domain);
    }

    if (query.kind) {
      return this.nodeTemplateService.getTemplatesByKind(query.kind);
    }

    // Return all templates grouped by domain for easy consumption
    return this.nodeTemplateService.getTemplatesGroupedByDomain();
  }

  /**
   * Get all templates as flat array
   */
  @Get('all')
  getAllTemplates(): NodeTemplateDto[] {
    return this.nodeTemplateService.getAllTemplates();
  }
}
