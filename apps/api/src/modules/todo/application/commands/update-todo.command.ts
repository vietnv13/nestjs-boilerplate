export class UpdateTodoCommand {
  constructor(
    public readonly id: string,
    public readonly data: {
      title?: string
      description?: string
      isCompleted?: boolean
    },
  ) {}
}
