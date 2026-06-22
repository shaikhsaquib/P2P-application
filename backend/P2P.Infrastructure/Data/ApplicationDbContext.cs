using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using P2P.Application.Interfaces;
using P2P.Domain.Entities;
using System.Text.Json;

namespace P2P.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICurrentUser? currentUser = null)
    : IdentityDbContext<User>(options)
{
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<SupplierDocument> SupplierDocuments => Set<SupplierDocument>();
    public DbSet<Requisition> Requisitions => Set<Requisition>();
    public DbSet<RequisitionLine> RequisitionLines => Set<RequisitionLine>();
    public DbSet<RFQ> RFQs => Set<RFQ>();
    public DbSet<RFQLine> RFQLines => Set<RFQLine>();
    public DbSet<RFQSupplier> RFQSuppliers => Set<RFQSupplier>();
    public DbSet<SupplierQuote> SupplierQuotes => Set<SupplierQuote>();
    public DbSet<QuoteLineItem> QuoteLineItems => Set<QuoteLineItem>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<POLine> POLines => Set<POLine>();
    public DbSet<AdvanceShipmentNotice> AdvanceShipmentNotices => Set<AdvanceShipmentNotice>();
    public DbSet<ASNLine> ASNLines => Set<ASNLine>();
    public DbSet<ASNDocument> ASNDocuments => Set<ASNDocument>();
    public DbSet<GoodsReceipt> GoodsReceipts => Set<GoodsReceipt>();
    public DbSet<GRLine> GRLines => Set<GRLine>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLine> InvoiceLines => Set<InvoiceLine>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<DisputeMessage> DisputeMessages => Set<DisputeMessage>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<User>(e => {
            e.Property(u => u.Role).HasConversion<string>();
        });

        builder.Entity<Supplier>(e => {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.SupplierCode).IsUnique();
            e.HasIndex(s => s.Email).IsUnique();
            e.HasMany(s => s.Users).WithOne(u => u.Supplier).HasForeignKey(u => u.SupplierId).IsRequired(false);
            e.HasOne(s => s.ApprovedBy).WithMany().HasForeignKey(s => s.ApprovedById).IsRequired(false);
        });

        builder.Entity<SupplierDocument>(e => {
            e.HasKey(d => d.Id);
            e.HasOne(d => d.Supplier).WithMany(s => s.Documents).HasForeignKey(d => d.SupplierId);
        });

        builder.Entity<Requisition>(e => {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.PRNumber).IsUnique();
            e.Property(r => r.Status).HasConversion<string>();
            e.Property(r => r.TotalAmount).HasPrecision(18, 2);
            e.HasOne(r => r.Requester).WithMany().HasForeignKey(r => r.RequesterId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.Approver).WithMany().HasForeignKey(r => r.ApprovedById).IsRequired(false).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<RequisitionLine>(e => {
            e.HasKey(l => l.Id);
            e.Property(l => l.Quantity).HasPrecision(18, 4);
            e.Property(l => l.UnitPrice).HasPrecision(18, 2);
            e.Property(l => l.TotalPrice).HasPrecision(18, 2);
            e.HasOne(l => l.Requisition).WithMany(r => r.Lines).HasForeignKey(l => l.RequisitionId);
        });

        builder.Entity<RFQ>(e => {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.RFQNumber).IsUnique();
            e.Property(r => r.Status).HasConversion<string>();
            e.HasOne(r => r.Requisition).WithMany(req => req.RFQs).HasForeignKey(r => r.RequisitionId).IsRequired(false);
            e.HasOne(r => r.CreatedBy).WithMany().HasForeignKey(r => r.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<RFQLine>(e => {
            e.HasKey(l => l.Id);
            e.HasOne(l => l.RFQ).WithMany(r => r.Lines).HasForeignKey(l => l.RFQId);
        });

        builder.Entity<RFQSupplier>(e => {
            e.HasKey(rs => rs.Id);
            e.HasOne(rs => rs.RFQ).WithMany(r => r.Suppliers).HasForeignKey(rs => rs.RFQId);
            e.HasOne(rs => rs.Supplier).WithMany(s => s.RFQSuppliers).HasForeignKey(rs => rs.SupplierId);
        });

        builder.Entity<SupplierQuote>(e => {
            e.HasKey(q => q.Id);
            e.HasIndex(q => q.QuoteNumber).IsUnique();
            e.Property(q => q.Status).HasConversion<string>();
            e.Property(q => q.TotalAmount).HasPrecision(18, 2);
            e.HasOne(q => q.RFQ).WithMany(r => r.Quotes).HasForeignKey(q => q.RFQId);
            e.HasOne(q => q.Supplier).WithMany(s => s.Quotes).HasForeignKey(q => q.SupplierId);
        });

        builder.Entity<QuoteLineItem>(e => {
            e.HasKey(l => l.Id);
            e.Property(l => l.UnitPrice).HasPrecision(18, 2);
            e.Property(l => l.TotalPrice).HasPrecision(18, 2);
            e.HasOne(l => l.Quote).WithMany(q => q.Lines).HasForeignKey(l => l.QuoteId);
            e.HasOne(l => l.RFQLine).WithMany().HasForeignKey(l => l.RFQLineId);
        });

        builder.Entity<PurchaseOrder>(e => {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.PONumber).IsUnique();
            e.Property(p => p.Status).HasConversion<string>();
            e.Property(p => p.TotalAmount).HasPrecision(18, 2);
            e.HasOne(p => p.Requisition).WithMany(r => r.PurchaseOrders).HasForeignKey(p => p.RequisitionId).IsRequired(false);
            e.HasOne(p => p.Supplier).WithMany(s => s.PurchaseOrders).HasForeignKey(p => p.SupplierId);
            e.HasOne(p => p.CreatedBy).WithMany().HasForeignKey(p => p.CreatedById).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.ApprovedBy).WithMany().HasForeignKey(p => p.ApprovedById).IsRequired(false).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<POLine>(e => {
            e.HasKey(l => l.Id);
            e.Property(l => l.Quantity).HasPrecision(18, 4);
            e.Property(l => l.UnitPrice).HasPrecision(18, 2);
            e.Property(l => l.TotalPrice).HasPrecision(18, 2);
            e.Property(l => l.ReceivedQuantity).HasPrecision(18, 4);
            e.HasOne(l => l.PurchaseOrder).WithMany(p => p.Lines).HasForeignKey(l => l.POId);
        });

        builder.Entity<AdvanceShipmentNotice>(e => {
            e.HasKey(a => a.Id);
            e.HasIndex(a => a.ASNNumber).IsUnique();
            e.Property(a => a.Status).HasConversion<string>();
            e.HasOne(a => a.PurchaseOrder).WithMany(p => p.ASNs).HasForeignKey(a => a.POId);
            e.HasOne(a => a.Supplier).WithMany().HasForeignKey(a => a.SupplierId);
        });

        builder.Entity<ASNLine>(e => {
            e.HasKey(l => l.Id);
            e.HasOne(l => l.ASN).WithMany(a => a.Lines).HasForeignKey(l => l.ASNId);
            e.HasOne(l => l.POLine).WithMany().HasForeignKey(l => l.POLineId);
        });

        builder.Entity<ASNDocument>(e => {
            e.HasKey(d => d.Id);
            e.HasOne(d => d.ASN).WithMany(a => a.Documents).HasForeignKey(d => d.ASNId);
        });

        builder.Entity<GoodsReceipt>(e => {
            e.HasKey(g => g.Id);
            e.HasIndex(g => g.GRNumber).IsUnique();
            e.Property(g => g.Status).HasConversion<string>();
            e.HasOne(g => g.PurchaseOrder).WithMany(p => p.GoodsReceipts).HasForeignKey(g => g.POId);
            e.HasOne(g => g.ASN).WithMany().HasForeignKey(g => g.ASNId).IsRequired(false);
            e.HasOne(g => g.ReceivedBy).WithMany().HasForeignKey(g => g.ReceivedById).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(g => g.VerifiedBy).WithMany().HasForeignKey(g => g.VerifiedById).IsRequired(false).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<GRLine>(e => {
            e.HasKey(l => l.Id);
            e.Property(l => l.QuantityReceived).HasPrecision(18, 4);
            e.Property(l => l.QuantityAccepted).HasPrecision(18, 4);
            e.Property(l => l.QuantityRejected).HasPrecision(18, 4);
            e.HasOne(l => l.GoodsReceipt).WithMany(g => g.Lines).HasForeignKey(l => l.GRId);
            e.HasOne(l => l.POLine).WithMany().HasForeignKey(l => l.POLineId);
        });

        builder.Entity<Invoice>(e => {
            e.HasKey(i => i.Id);
            e.HasIndex(i => i.InvoiceNumber).IsUnique();
            e.Property(i => i.Status).HasConversion<string>();
            e.Property(i => i.MatchStatus).HasConversion<string>();
            e.Property(i => i.SubTotal).HasPrecision(18, 2);
            e.Property(i => i.TaxAmount).HasPrecision(18, 2);
            e.Property(i => i.TotalAmount).HasPrecision(18, 2);
            e.HasOne(i => i.PurchaseOrder).WithMany(p => p.Invoices).HasForeignKey(i => i.POId);
            e.HasOne(i => i.Supplier).WithMany(s => s.Invoices).HasForeignKey(i => i.SupplierId);
            e.HasOne(i => i.GoodsReceipt).WithMany().HasForeignKey(i => i.GRId).IsRequired(false);
            e.HasOne(i => i.ReviewedBy).WithMany().HasForeignKey(i => i.ReviewedById).IsRequired(false).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<InvoiceLine>(e => {
            e.HasKey(l => l.Id);
            e.Property(l => l.Quantity).HasPrecision(18, 4);
            e.Property(l => l.UnitPrice).HasPrecision(18, 2);
            e.Property(l => l.TotalPrice).HasPrecision(18, 2);
            e.Property(l => l.TaxRate).HasPrecision(5, 2);
            e.Property(l => l.TaxAmount).HasPrecision(18, 2);
            e.HasOne(l => l.Invoice).WithMany(i => i.Lines).HasForeignKey(l => l.InvoiceId);
            e.HasOne(l => l.POLine).WithMany().HasForeignKey(l => l.POLineId);
        });

        builder.Entity<Dispute>(e => {
            e.HasKey(d => d.Id);
            e.HasIndex(d => d.DisputeNumber).IsUnique();
            e.Property(d => d.Status).HasConversion<string>();
            e.HasOne(d => d.Invoice).WithMany(i => i.Disputes).HasForeignKey(d => d.InvoiceId);
            e.HasOne(d => d.RaisedBy).WithMany().HasForeignKey(d => d.RaisedById).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(d => d.AssignedTo).WithMany().HasForeignKey(d => d.AssignedToId).IsRequired(false).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<DisputeMessage>(e => {
            e.HasKey(m => m.Id);
            e.HasOne(m => m.Dispute).WithMany(d => d.Messages).HasForeignKey(m => m.DisputeId);
            e.HasOne(m => m.Sender).WithMany().HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Notification>(e => {
            e.HasKey(n => n.Id);
            e.Property(n => n.Type).HasConversion<string>();
            e.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AuditLog>(e => {
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.EntityType, a.EntityId });
        });
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var auditEntries = ChangeTracker.Entries()
            .Where(e => e.Entity is not AuditLog && e.Entity is not Notification &&
                        e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .Select(entry => new AuditLog
            {
                EntityType = entry.Entity.GetType().Name,
                EntityId = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? "",
                Action = entry.State.ToString(),
                OldValues = entry.State == EntityState.Modified
                    ? JsonSerializer.Serialize(entry.OriginalValues.Properties.ToDictionary(p => p.Name, p => entry.OriginalValues[p]?.ToString()))
                    : null,
                NewValues = entry.State != EntityState.Deleted
                    ? JsonSerializer.Serialize(entry.CurrentValues.Properties.ToDictionary(p => p.Name, p => entry.CurrentValues[p]?.ToString()))
                    : null,
                UserId = currentUser?.UserId,
                UserName = currentUser?.UserName,
                Timestamp = DateTime.UtcNow,
                IPAddress = currentUser?.IPAddress
            }).ToList();

        var result = await base.SaveChangesAsync(cancellationToken);

        if (auditEntries.Count > 0)
        {
            AuditLogs.AddRange(auditEntries);
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }
}
