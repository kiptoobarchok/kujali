import { HandlerTools } from '@iote/cqrs';
import { FunctionContext, FunctionHandler } from '@ngfi/functions';

import { Notes } from '@app/model/finance/notes';

import { AddNoteToBudgetCommand } from './add-note.command';
import { AddNoteToBudgetResult } from './add-note-result.interface';

/**
 * Generic command handler interface.
 */
export interface ICommandHandler<TCommand>
{
  execute(command: TCommand): Promise<void>;
}

/**
 * Repository path for budget notes.
 */
const BUDGET_NOTES_REPO = (orgId: string, budgetId: string) => `orgs/${orgId}/budgets/${budgetId}/config`;

/**
 * Handler for adding a note to a budget.
 * 
 * Implements the CQRS command pattern for adding notes to budgets.
 */
export class AddNoteToBudgetHandler extends FunctionHandler<AddNoteToBudgetCommand, AddNoteToBudgetResult>
{
  /**
   * Executes the command to add a note to a budget.
   * 
   * @param command - The command containing orgId, budgetId, and noteContent
   * @param context - The function context
   * @param tools - Handler tools including logger and repository access
   * @returns Promise resolving to the result of the operation
   */
  public async execute(
    command: AddNoteToBudgetCommand,
    context: FunctionContext,
    tools: HandlerTools
  ): Promise<AddNoteToBudgetResult>
  {
    tools.Logger.log(() => `[AddNoteToBudgetHandler].execute: Adding note to budget ${command.budgetId} for org ${command.orgId}`);

    // Validate command data
    if (!command.noteContent || command.noteContent.trim().length === 0)
    {
      const errorMessage = 'Note content cannot be empty';
      tools.Logger.error(() => `[AddNoteToBudgetHandler].execute: ${errorMessage}`);
      
      return {
        id: '',
        orgId: command.orgId,
        budgetId: command.budgetId,
        success: false,
        message: errorMessage
      };
    }

    if (!command.orgId || command.orgId.trim().length === 0)
    {
      const errorMessage = 'Organization ID cannot be empty';
      tools.Logger.error(() => `[AddNoteToBudgetHandler].execute: ${errorMessage}`);
      
      return {
        id: '',
        orgId: command.orgId || '',
        budgetId: command.budgetId || '',
        success: false,
        message: errorMessage
      };
    }

    if (!command.budgetId || command.budgetId.trim().length === 0)
    {
      const errorMessage = 'Budget ID cannot be empty';
      tools.Logger.error(() => `[AddNoteToBudgetHandler].execute: ${errorMessage}`);
      
      return {
        id: '',
        orgId: command.orgId,
        budgetId: command.budgetId || '',
        success: false,
        message: errorMessage
      };
    }

    try
    {
      // Get the repository for budget notes
      const notesRepo = tools.getRepository<Notes>(BUDGET_NOTES_REPO(command.orgId, command.budgetId));

      // Get existing notes or create new
      let existingNotes: Notes | null = null;
      
      try
      {
        existingNotes = await notesRepo.getDocumentById('notes');
      }
      catch (error)
      {
        tools.Logger.log(() => `[AddNoteToBudgetHandler].execute: No existing notes found, creating new`);
        // Notes document doesn't exist yet, will create new one
      }

      // Prepare the notes object
      const notesToSave: Notes = existingNotes
        ? {
            ...existingNotes,
            note: existingNotes.note 
              ? `${existingNotes.note}\n\n${command.noteContent.trim()}`
              : command.noteContent.trim()
          }
        : {
            id: 'notes',
            note: command.noteContent.trim()
          };

      // Save the notes
      await notesRepo.write(notesToSave, 'notes');

      tools.Logger.log(() => `[AddNoteToBudgetHandler].execute: Successfully added note to budget ${command.budgetId}`);

      return {
        id: 'notes',
        orgId: command.orgId,
        budgetId: command.budgetId,
        success: true,
        message: 'Note added successfully'
      };
    }
    catch (error)
    {
      const errorMessage = `Failed to add note: ${error instanceof Error ? error.message : 'Unknown error'}`;
      tools.Logger.error(() => `[AddNoteToBudgetHandler].execute: ${errorMessage}`);
      
      return {
        id: '',
        orgId: command.orgId,
        budgetId: command.budgetId,
        success: false,
        message: errorMessage
      };
    }
  }
}

