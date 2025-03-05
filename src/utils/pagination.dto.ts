import { Expose } from 'class-transformer';

export class PaginationDTO<T> {
  @Expose()
  items: T[];

  @Expose()
  totalItems: number;

  @Expose()
  totalPages: number;

  @Expose()
  currentPage: number;

  @Expose()
  pageSize: number;

  

  constructor(items: T[], totalItems: number, currentPage: number, pageSize: number) {
    this.items = items;
    this.totalItems = totalItems;
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(totalItems / pageSize);
  }

  static create<T>(items: T[], totalItems: number, currentPage: number, pageSize: number): PaginationDTO<T> {
    return new PaginationDTO<T>(items, totalItems, currentPage, pageSize);
  }
}
