import { IObject } from '@iote/bricks';

/**
 * Result returned after adding a note to a budget.
 */
export interface AddNoteToBudgetResult extends IObject
{
  /** Organization ID */
  orgId: string;
  
  /** Budget ID */
  budgetId: string;
  
  /** Success indicator */
  success: boolean;
  
  /** Message describing the result */
  message?: string;
}

