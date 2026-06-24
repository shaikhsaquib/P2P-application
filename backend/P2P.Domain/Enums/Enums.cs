namespace P2P.Domain.Enums;

public enum RequisitionStatus { Draft, Submitted, UnderReview, Approved, Rejected, Converted }
public enum POStatus { Draft, PendingApproval, Approved, SentToSupplier, Acknowledged, PartiallyReceived, FullyReceived, Closed, Cancelled }
public enum GRStatus { Draft, Submitted, Verified, Rejected }
public enum InvoiceStatus { Draft, Submitted, UnderReview, Matched, Disputed, Approved, PaymentScheduled, Paid, Rejected }
public enum MatchStatus { Pending, Matched, PriceMismatch, QtyMismatch, MultiMismatch }
public enum RFQStatus { Draft, Sent, QuotesReceived, Evaluated, Closed, Cancelled }
public enum QuoteStatus { Submitted, UnderEvaluation, Accepted, Rejected, Revised }
public enum ASNStatus { Created, InTransit, Delivered, Cancelled }
public enum DisputeStatus { Open, UnderReview, Resolved, Closed }
public enum NotificationType
{
    POReceived, RFQReceived, InvoiceStatusChanged, PaymentProcessed,
    DocumentExpiry, QuoteResult, GRVerified, RequisitionApproved,
    RequisitionRejected, POAcknowledged, DisputeRaised, DisputeResolved, ASNCreated
}
public enum UserRole { Admin, Approver, Requester, Finance, SupplierAdmin, SupplierUser }
