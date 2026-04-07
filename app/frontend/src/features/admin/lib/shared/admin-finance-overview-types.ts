export type FinanceOverviewPeriod = "7D" | "30D" | "3M" | "12M";

export type AdminFinanceOverview = {
  period: FinanceOverviewPeriod;
  periodLabel: string;
  kpis: {
    totalIncome: { value: number; subtitle: string; delta: number | null };
    totalExpenses: { value: number; subtitle: string; delta: number | null };
    netProfit: { value: number; subtitle: string; delta: number | null };
    unpaidCompletedBookings: { value: number; subtitle: string; delta: number | null };
  };
  trend: {
    bucketType: "day" | "month";
    points: Array<{
      key: string;
      label: string;
      income: number;
      expenses: number;
      net: number;
    }>;
  };
  snapshot: {
    totalIncome: number;
    totalExpenses: number;
    netProfitMargin: number;
    averageIncomePerPaidBooking: number;
  };
  expenseBreakdown: Array<{
    key: string;
    label: string;
    total: number;
    percentage: number;
  }>;
  incomePaymentBreakdown: Array<{
    key: string;
    label: string;
    total: number;
    percentage: number;
  }>;
  bookingRevenueStatus: {
    completedBookings: number;
    paidBookings: number;
    unpaidCompletedBookings: number;
    paidConversionRate: number;
  };
  recentTransactions: Array<{
    id: string;
    date: Date | string;
    type: "INCOME" | "EXPENSE";
    reference: string;
    name: string;
    amount: number;
    meta: string;
  }>;
  recentPaidBookings: Array<{
    id: string;
    bookingCode: string;
    customer: string;
    paidDate: Date | string;
    totalItems: number;
    totalAmount: number;
  }>;
};
