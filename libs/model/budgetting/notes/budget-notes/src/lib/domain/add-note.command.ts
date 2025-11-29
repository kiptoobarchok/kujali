/**
 * Command to add a note to a budget.
 * 
 * Encapsulates the data needed to add a note to a budget.
 */
export interface AddNoteToBudgetCommand
{
  /** Organization ID */
  orgId: string;
  
  /** Budget ID */
  budgetId: string;
  
  /** Note content */
  noteContent: string;
}

