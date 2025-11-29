import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, EventEmitter, inject, Input, OnChanges, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';

import { Budget, BudgetRecord } from '@app/model/finance/planning/budgets';

import { ShareBudgetModalComponent } from '../share-budget-modal/share-budget-modal.component';
import { CreateBudgetModalComponent } from '../create-budget-modal/create-budget-modal.component';
import { ChildBudgetsModalComponent } from '../../modals/child-budgets-modal/child-budgets-modal.component';

interface BudgetsData {
  overview: BudgetRecord[];
  budgets: any[];
}

@Component({
  selector: 'app-budget-table',
  templateUrl: './budget-table.component.html',
  styleUrls: ['./budget-table.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush, // Zoneless-ready with OnPush
})
export class BudgetTableComponent implements AfterViewInit, OnChanges {
  // Signal-based inputs - using regular @Input() but converting to signals internally
  @Input() budgets: BudgetsData | null = null;
  @Input() canPromote = false;

  @Output() doPromote: EventEmitter<void> = new EventEmitter();

  // Injected dependencies using inject()
  private _router = inject(Router);
  private _dialog = inject(MatDialog);
  private _cdr = inject(ChangeDetectorRef);

  // Signal-based internal state
  private _budgetsSignal = signal<BudgetsData | null>(null);
  private _canPromoteSignal = signal<boolean>(false);

  // Data source as a regular property (not signal) for MatTable compatibility
  dataSource = new MatTableDataSource();

  displayedColumns: string[] = ['name', 'status', 'startYear', 'duration', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort', { static: true }) sort: MatSort;

  // Signal for overview budgets
  overviewBudgets = signal<BudgetRecord[]>([]);

  constructor() {
    // Effect to reactively update data source when budgets signal changes
    effect(() => {
      const budgetsData = this._budgetsSignal();
      if (budgetsData) {
        this.overviewBudgets.set(budgetsData.overview);
        this.dataSource.data = budgetsData.budgets;

        // Update paginator and sort if already initialized
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
        
        // Mark for check in OnPush mode
        this._cdr.markForCheck();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Convert @Input() changes to signals
    if (changes['budgets']) {
      this._budgetsSignal.set(changes['budgets'].currentValue);
    }
    if (changes['canPromote']) {
      this._canPromoteSignal.set(changes['canPromote'].currentValue);
    }
  }

  /** 
   * Checks whether the user has access to a certain feature.
   * 
   * @TODO @IanOdhiambo9 - Please put proper access control architecture in place. 
   */
  access(requested: any) 
  {  
    switch (requested) {
      case 'view':
      case 'clone':
        return true; //budget.access.owner || budget.access.view || budget.access.edit;
      case 'edit':
        return true; // (budget.access.owner || budget.access.edit) && budget.status !== BudgetStatus.InUse && budget.status !== BudgetStatus.InUse;
    }
    return false;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  filterAccountRecords(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  promote() {
    if (this._canPromoteSignal()) {
      this.doPromote.emit();
    }
  }

  /** Open share screen to configure budget access. */
  openShareBudgetDialog(parent: Budget | false): void 
  {
    this._dialog.open(ShareBudgetModalComponent, {
      panelClass: 'no-pad-dialog',
      width: '600px',
      data: parent != null ? parent : false
    });
  }

  /** Open clone screen to clone and reconfigure budget. */
  openCloneBudgetDialog(parent: Budget | false): void {
    this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent != null ? parent : false
    });
  }

  openChildBudgetDialog(parent : Budget): void 
  { 
    const overview = this.overviewBudgets();
    let children: any = overview.find((budget) => budget.budget.id === parent.id)!?.children;
    children = children?.map((child) => child.budget)
    this._dialog.open(ChildBudgetsModalComponent, {
      height: 'fit-content',
      minWidth: '600px',
      data: {parent: parent, budgets: children}
    });
  }

  goToDetail(budgetId: string, action: string) {
    this._router.navigate(['budgets', budgetId, action]).then(() => this._dialog.closeAll());
  }

  deleteBudget(budget: Budget) {
    // Delete functionality
  }

  translateStatus(status: number) {
    switch (status) {
      case 1:
        return 'BUDGET.STATUS.ACTIVE';
      case 0:
        return 'BUDGET.STATUS.DESIGN';
      case 9:
        return 'BUDGET.STATUS.NO-USE';
      case -1:
        return 'BUDGET.STATUS.DELETED';
      default:
        return '';
    }
  }
}
