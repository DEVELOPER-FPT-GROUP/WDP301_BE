import { Expose } from 'class-transformer';

export class PaginationDTO<T> {
  @Expose()
  content: T[];

  @Expose()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(content: T[], total: number, page: number, limit: number) {
    this.content = content;
    this.pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static create<T>(content: T[], total: number, page: number, limit: number): PaginationDTO<T> {
    return new PaginationDTO<T>(content, total, page, limit);
  }
}
