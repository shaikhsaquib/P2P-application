using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.Dashboard.Queries;

public record GetBuyerDashboardQuery() : IRequest<BaseResponse<BuyerDashboardDto>>;
public record GetSupplierDashboardQuery(string? SupplierId = null) : IRequest<BaseResponse<SupplierDashboardDto>>;

public class BuyerDashboardDto
{
    public int TotalRequisitions { get; set; }
    public int PendingApprovals { get; set; }
    public int ActivePOs { get; set; }
    public int PendingGRs { get; set; }
    public int PendingInvoices { get; set; }
    public int PendingSupplierApprovals { get; set; }
    public decimal TotalSpendThisMonth { get; set; }
    public decimal TotalSpendThisYear { get; set; }
    public List<SpendByDepartmentDto> SpendByDepartment { get; set; } = [];
    public List<SpendByMonthDto> SpendByMonth { get; set; } = [];
    public List<RecentActivityDto> RecentActivities { get; set; } = [];
    public List<PendingApprovalDto> PendingApprovalItems { get; set; } = [];
}

public class SupplierDashboardDto
{
    public int ActivePOs { get; set; }
    public int PendingInvoices { get; set; }
    public int OpenRFQs { get; set; }
    public int OpenDisputes { get; set; }
    public decimal TotalBilledThisMonth { get; set; }
    public decimal TotalPaidThisYear { get; set; }
    public decimal OverdueAmount { get; set; }
    public int OnTimeDeliveryPercent { get; set; }
    public List<InvoiceAgingDto> InvoiceAging { get; set; } = [];
    public List<RecentActivityDto> RecentActivities { get; set; } = [];
}

public class SpendByDepartmentDto { public string Department { get; set; } = ""; public decimal Amount { get; set; } }
public class SpendByMonthDto { public string Month { get; set; } = ""; public decimal Amount { get; set; } }
public class InvoiceAgingDto { public string Bucket { get; set; } = ""; public decimal Amount { get; set; } public int Count { get; set; } }
public class RecentActivityDto { public string Type { get; set; } = ""; public string Description { get; set; } = ""; public DateTime Timestamp { get; set; } public string EntityId { get; set; } = ""; }
public class PendingApprovalDto { public string Type { get; set; } = ""; public string Number { get; set; } = ""; public string Title { get; set; } = ""; public decimal Amount { get; set; } public string RequestedBy { get; set; } = ""; public DateTime CreatedAt { get; set; } public string EntityId { get; set; } = ""; }
