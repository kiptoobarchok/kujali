import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SubSink } from 'subsink';

import { cloneDeep as ___cloneDeep, flatMap as __flatMap } from 'lodash';

import { Logger } from '@iote/bricks-angular';

import { Budget, BudgetRecord, BudgetStatus, OrgBudgetsOverview } from '@app/model/finance/planning/budgets';

import { BudgetsStore, OrgBudgetsStore } from '@app/state/finance/budgetting/budgets';

import { CreateBudgetModalComponent } from '../../components/create-budget-modal/create-budget-modal.component';

interface AllBudgetsData {
  overview: BudgetRecord[];
  budgets: any[];
}

@Component({
  selector: 'app-select-budget',
  templateUrl: './select-budget.component.html',
  styleUrls: ['./select-budget.component.scss', 
              '../../components/budget-view-styles.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush, // Zoneless-ready with OnPush
})
/** List of all active budgets on the system. */
export class SelectBudgetPageComponent implements OnInit, OnDestroy
{
  private _sbS = new SubSink();

  // Injected dependencies using inject()
  private _orgBudgets$$ = inject(OrgBudgetsStore);
  private _budgets$$ = inject(BudgetsStore);
  private _dialog = inject(MatDialog);
  private _logger = inject(Logger);
  private _cdr = inject(ChangeDetectorRef);

  // Signal-based state
  showFilter = signal(false);

  // Signals for observable data
  overview = signal<OrgBudgetsOverview | null>(null);
  sharedBudgets = signal<any[]>([]);

  // Computed signal that combines overview and budgets
  allBudgets = computed<AllBudgetsData | null>(() => {
    const overviewValue = this.overview();
    const budgetsValue = this.sharedBudgets();

    if (!overviewValue || !budgetsValue) {
      return null;
    }

    const flatOverview = __flatMap(overviewValue);
    const flatBudgets = __flatMap(budgetsValue);
    
    const transformedBudgets = flatBudgets.map((budget: any) => {
      budget['endYear'] = budget.startYear + budget.duration - 1;
      return budget;
    });

    return {
      overview: flatOverview,
      budgets: transformedBudgets
    };
  });

  ngOnInit(): void {
    // Convert observables to signals using subscriptions
    this._sbS.sink = this._orgBudgets$$.get().subscribe(overview => {
      this.overview.set(overview);
      this._cdr.markForCheck(); // Trigger change detection with OnPush
    });

    this._sbS.sink = this._budgets$$.get().subscribe(budgets => {
      this.sharedBudgets.set(budgets);
      this._cdr.markForCheck(); // Trigger change detection with OnPush
    });
  }

  ngOnDestroy(): void {
    this._sbS.unsubscribe();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  fieldsFilter(value: (any) => boolean) {    
    // this.filter$$.next(value);
  }

  toogleFilter(value: boolean) {
    this.showFilter.set(value);
  }

  openDialog(parent : Budget | false): void 
  {
    const dialog = this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent != null ? parent : false
    });

    dialog.afterClosed().subscribe(() => {
      // Dialog after action
    })
  }

  /** 
   * @TODO - Review and fix
   * Returns true if the budget can be activated */
  canPromote(record: BudgetRecord) {
    // Get's set on Budget Read from user privileges and budget status.
    return (record.budget as any).canBeActivated;
  }

  /** Activate budget -> Promote to be used in  */
  setActive(record: BudgetRecord) 
  {
    const toSave = ___cloneDeep(record.budget);

    // Clean up budget record values.
    delete (toSave as any).canBeActivated;
    delete (toSave as any).access;

    // Set Active
    toSave.status = BudgetStatus.InUse;

    (<any> record).updating = true;
    // Fire update
    this._budgets$$.update(toSave)
      .subscribe(() => {
        (<any> record).updating = false;
        this._logger.log(() => `Updated Budget with id ${toSave.id}. Set as an active budget for this org.`) 
      });
  }
}
