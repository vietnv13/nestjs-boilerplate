import { ApiProperty } from "@nestjs/swagger";

/**
 * Todo Response DTO
 */
export class TodoResponseDto {
  @ApiProperty({ description: "Todo ID", example: "clx1234567890" })
  id: string;

  @ApiProperty({ description: "Todo title", example: "Complete project documentation" })
  title: string;

  @ApiProperty({
    description: "Todo description",
    example: "Write API docs and architecture guide",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: "Completion status", example: false })
  isCompleted: boolean;

  @ApiProperty({ description: "Creation timestamp", example: "2026-02-13T15:30:00.000Z" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp", example: "2026-02-13T15:30:00.000Z" })
  updatedAt: Date;
}
