export class TrackingResponse {
    totalViews: number;
    totalRevenue: number;
    revenueHistory: {
      orderId: string;
      amount: number;
      status: string;
      timestamp: Date;
    }[];
  }
  