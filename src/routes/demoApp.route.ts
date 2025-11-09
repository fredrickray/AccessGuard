import { Router, Request, Response } from "express";

const demoAppRouter = Router();

demoAppRouter.get("/banking/dashboard", (req: Request, res: Response) => {
  res.json({
    app: "Banking Dashboard",
    user: req.user?.username,
    riskScore: req.accessDecision?.riskScore,
    data: {
      accountBalance: 1250000.5,
      recentTransactions: [
        {
          id: 1,
          amount: -5000,
          description: "Wire Transfer",
          date: "2025-01-15",
        },
        { id: 2, amount: 250000, description: "Deposit", date: "2025-01-14" },
      ],
      totalBalance: 1500000,
      accountType: "Checking",
      currency: "USD",
      accountNumber: "**** **** **** 1234",
      monthlyTransactions: 45,
      pendingApprovals: 3,
    },
    timestamp: new Date().toISOString(),
  });
});

demoAppRouter.get("/banking/transactions", (req: Request, res: Response) => {
  res.json({
    app: "Banking Transactions",
    user: req.user?.username,
    transactions: [
      {
        id: 1,
        from: "ACC-001",
        to: "ACC-002",
        amount: 50000,
        status: "completed",
      },
      {
        id: 2,
        from: "ACC-003",
        to: "ACC-001",
        amount: 125000,
        status: "pending",
      },
      {
        id: 3,
        from: "ACC-001",
        to: "ACC-004",
        amount: 75000,
        status: "completed",
      },
    ],
    totalTransactions: 150,
    totalIncome: 2000000,
    totalOutgoings: 1750000,
    netFlow: 250000,
  });
});

demoAppRouter.post("/banking/transfer", (req: Request, res: Response) => {
  const { from, to, amount } = req.body;

  res.json({
    success: true,
    message: "Transfer initiated",
    transferId: `TXN-${Date.now()}`,
    from,
    to,
    amount,
    riskScore: req.accessDecision?.riskScore,
  });
});

// ============================================
// 👥 DEMO: HR System
// ============================================
demoAppRouter.get("/hr/employees", (req: Request, res: Response) => {
  res.json({
    app: "HR Employee Directory",
    user: req.user?.username,
    employees: [
      {
        id: 1,
        name: "John Doe",
        position: "Senior Engineer",
        department: "IT",
      },
      {
        id: 2,
        name: "Jane Smith",
        position: "Product Manager",
        department: "Product",
      },
      {
        id: 3,
        name: "Mike Johnson",
        position: "Data Analyst",
        department: "Analytics",
      },
    ],
  });
});

demoAppRouter.get("/hr/payroll", (req: Request, res: Response) => {
  res.json({
    app: "HR Payroll System",
    user: req.user?.username,
    notice: "🔒 This is sensitive data protected by Zero-Trust",
    payrollData: [
      { employee: "John Doe", salary: 150000, status: "processed" },
      { employee: "Jane Smith", salary: 180000, status: "processed" },
    ],
  });
});

// ============================================
// 📊 DEMO: Admin Panel
// ============================================
demoAppRouter.get("/admin/users", (req: Request, res: Response) => {
  res.json({
    app: "Admin User Management",
    user: req.user?.username,
    users: [
      { id: 1, username: "admin", roles: ["admin"], status: "active" },
      { id: 2, username: "banker1", roles: ["banker"], status: "active" },
      { id: 3, username: "hr_manager", roles: ["hr"], status: "active" },
    ],
  });
});

demoAppRouter.get("/admin/system", (req: Request, res: Response) => {
  res.json({
    app: "System Configuration",
    user: req.user?.username,
    systemInfo: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
    },
  });
});

// ============================================
// 📈 DEMO: Reports & Analytics
// ============================================
demoAppRouter.get("/reports/financial", (req: Request, res: Response) => {
  res.json({
    app: "Financial Reports",
    user: req.user?.username,
    report: {
      quarter: "Q1 2025",
      revenue: 5000000,
      expenses: 3200000,
      profit: 1800000,
      growth: "+15%",
    },
  });
});

export default demoAppRouter;
