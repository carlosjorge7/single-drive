import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Output() navigate = new EventEmitter<BreadcrumbItem>();
}
