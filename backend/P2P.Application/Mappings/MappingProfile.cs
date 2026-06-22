using AutoMapper;
using P2P.Application.Features.Requisitions.Commands;
using P2P.Application.Features.Requisitions.Queries;
using P2P.Application.Features.PurchaseOrders.Commands;
using P2P.Application.Features.PurchaseOrders.Queries;
using P2P.Application.Features.Suppliers.Commands;
using P2P.Application.Features.Suppliers.Queries;
using P2P.Application.Features.GoodsReceipts.Commands;
using P2P.Application.Features.GoodsReceipts.Queries;
using P2P.Application.Features.Invoices.Commands;
using P2P.Application.Features.Invoices.Queries;
using P2P.Application.Features.RFQ.Commands;
using P2P.Application.Features.RFQ.Queries;
using P2P.Application.Features.SupplierQuotes.Commands;
using P2P.Application.Features.SupplierQuotes.Queries;
using P2P.Application.Features.ASN.Commands;
using P2P.Application.Features.ASN.Queries;
using P2P.Application.Features.Disputes.Commands;
using P2P.Application.Features.Disputes.Queries;
using P2P.Domain.Entities;

namespace P2P.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Supplier
        CreateMap<RegisterSupplierCommand, Supplier>();
        CreateMap<Supplier, SupplierDto>()
            .ForMember(d => d.DocumentCount, o => o.MapFrom(s => s.Documents.Count));
        CreateMap<SupplierDocument, SupplierDocumentDto>();

        // Requisition
        CreateMap<CreateRequisitionCommand, Requisition>();
        CreateMap<CreateRequisitionLineDto, RequisitionLine>();
        CreateMap<Requisition, RequisitionDto>()
            .ForMember(d => d.RequesterName, o => o.MapFrom(s => s.Requester.FullName))
            .ForMember(d => d.ApproverName, o => o.MapFrom(s => s.Approver != null ? s.Approver.FullName : null));
        CreateMap<RequisitionLine, RequisitionLineDto>();

        // RFQ
        CreateMap<CreateRFQCommand, RFQ>();
        CreateMap<CreateRFQLineDto, RFQLine>();
        CreateMap<RFQ, RFQDto>()
            .ForMember(d => d.CreatedByName, o => o.MapFrom(s => s.CreatedBy.FullName))
            .ForMember(d => d.SupplierCount, o => o.MapFrom(s => s.Suppliers.Count))
            .ForMember(d => d.QuoteCount, o => o.MapFrom(s => s.Quotes.Count));
        CreateMap<RFQLine, RFQLineDto>();
        CreateMap<RFQSupplier, RFQSupplierDto>()
            .ForMember(d => d.SupplierName, o => o.MapFrom(s => s.Supplier.CompanyName));

        // Quote
        CreateMap<SubmitQuoteCommand, SupplierQuote>();
        CreateMap<SubmitQuoteLineDto, QuoteLineItem>();
        CreateMap<SupplierQuote, QuoteDto>()
            .ForMember(d => d.SupplierName, o => o.MapFrom(s => s.Supplier.CompanyName));
        CreateMap<QuoteLineItem, QuoteLineDto>();

        // PurchaseOrder
        CreateMap<CreatePOCommand, PurchaseOrder>();
        CreateMap<CreatePOLineDto, POLine>();
        CreateMap<PurchaseOrder, PODto>()
            .ForMember(d => d.SupplierName, o => o.MapFrom(s => s.Supplier.CompanyName))
            .ForMember(d => d.CreatedByName, o => o.MapFrom(s => s.CreatedBy.FullName))
            .ForMember(d => d.ApproverName, o => o.MapFrom(s => s.ApprovedBy != null ? s.ApprovedBy.FullName : null));
        CreateMap<POLine, POLineDto>();

        // ASN
        CreateMap<CreateASNCommand, AdvanceShipmentNotice>();
        CreateMap<CreateASNLineDto, ASNLine>();
        CreateMap<AdvanceShipmentNotice, ASNDto>()
            .ForMember(d => d.SupplierName, o => o.MapFrom(s => s.Supplier.CompanyName))
            .ForMember(d => d.PONumber, o => o.MapFrom(s => s.PurchaseOrder.PONumber));
        CreateMap<ASNLine, ASNLineDto>();
        CreateMap<ASNDocument, ASNDocumentDto>();

        // GoodsReceipt
        CreateMap<CreateGRCommand, GoodsReceipt>();
        CreateMap<CreateGRLineDto, GRLine>();
        CreateMap<GoodsReceipt, GRDto>()
            .ForMember(d => d.PONumber, o => o.MapFrom(s => s.PurchaseOrder.PONumber))
            .ForMember(d => d.ReceivedByName, o => o.MapFrom(s => s.ReceivedBy.FullName));
        CreateMap<GRLine, GRLineDto>();

        // Invoice
        CreateMap<SubmitInvoiceCommand, Invoice>();
        CreateMap<SubmitInvoiceLineDto, InvoiceLine>();
        CreateMap<Invoice, InvoiceDto>()
            .ForMember(d => d.SupplierName, o => o.MapFrom(s => s.Supplier.CompanyName))
            .ForMember(d => d.PONumber, o => o.MapFrom(s => s.PurchaseOrder.PONumber));
        CreateMap<InvoiceLine, InvoiceLineDto>();

        // Dispute
        CreateMap<CreateDisputeCommand, Dispute>();
        CreateMap<Dispute, DisputeDto>()
            .ForMember(d => d.RaisedByName, o => o.MapFrom(s => s.RaisedBy.FullName));
        CreateMap<DisputeMessage, DisputeMessageDto>()
            .ForMember(d => d.SenderName, o => o.MapFrom(s => s.Sender.FullName));

        // Notification
        CreateMap<Notification, NotificationDto>();
    }
}
