import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private readonly _ids = signal<Set<string>>(new Set());

  readonly ids = this._ids.asReadonly();
  readonly count = computed(() => this._ids().size);
  readonly hasSelection = computed(() => this._ids().size > 0);

  isSelected(id: string): boolean {
    return this._ids().has(id);
  }

  toggle(id: string): void {
    this._ids.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  selectAll(ids: string[]): void {
    this._ids.set(new Set(ids));
  }

  clear(): void {
    this._ids.set(new Set());
  }

  getIds(): string[] {
    return Array.from(this._ids());
  }
}
