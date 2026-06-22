using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using P2P.Application.Common;
using P2P.Application.Features.Suppliers.Commands;
using P2P.Application.Features.Suppliers.Queries;
using P2P.Application.Interfaces;
using P2P.Domain.Entities;
using P2P.Domain.Enums;
using P2P.Infrastructure.Data;

namespace P2P.API.Handlers;

public class RegisterSupplierHandler(ApplicationDbContext db, UserManager<User> userManager, INumberGenerator numGen, IMapper mapper)
    : IRequestHandler<RegisterSupplierCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(RegisterSupplierCommand req, CancellationToken ct)
    {
        if (await db.Suppliers.AnyAsync(s => s.Email == req.Email, ct))
            return BaseResponse<string>.Fail("Email already registered");

        var supplier = new Supplier
        {
            SupplierCode = await numGen.GenerateSupplierCodeAsync(ct),
            CompanyName = req.CompanyName, ContactPerson = req.ContactPerson,
            Email = req.Email, Phone = req.Phone, Address = req.Address,
            City = req.City, State = req.State, Country = req.Country, PostalCode = req.PostalCode,
            GSTNumber = req.GSTNumber, PANNumber = req.PANNumber,
            BankAccountNumber = req.BankAccountNumber, BankName = req.BankName,
            IFSCCode = req.IFSCCode, SWIFTCode = req.SWIFTCode
        };
        db.Suppliers.Add(supplier);
        await db.SaveChangesAsync(ct);

        // Create admin user for supplier
        var user = new User
        {
            UserName = req.Email, Email = req.Email,
            FullName = req.ContactPerson, Role = UserRole.SupplierAdmin,
            SupplierId = supplier.Id, EmailConfirmed = true
        };
        var result = await userManager.CreateAsync(user, req.AdminPassword);
        if (!result.Succeeded)
            return BaseResponse<string>.Fail(result.Errors.Select(e => e.Description).ToList());

        await userManager.AddToRoleAsync(user, "SupplierAdmin");
        return BaseResponse<string>.Ok(supplier.Id, "Supplier registered. Awaiting approval.");
    }
}

public class ApproveSupplierHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<ApproveSupplierCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(ApproveSupplierCommand req, CancellationToken ct)
    {
        var supplier = await db.Suppliers.FindAsync([req.SupplierId], ct);
        if (supplier == null) return BaseResponse<bool>.Fail("Supplier not found");
        supplier.IsApproved = true;
        supplier.ApprovedAt = DateTime.UtcNow;
        supplier.ApprovedById = currentUser.UserId;
        supplier.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Supplier approved");
    }
}

public class GetAllSuppliersHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetAllSuppliersQuery, BaseResponse<PagedResult<SupplierDto>>>
{
    public async Task<BaseResponse<PagedResult<SupplierDto>>> Handle(GetAllSuppliersQuery req, CancellationToken ct)
    {
        var query = db.Suppliers.Include(s => s.Documents).AsQueryable();
        if (req.IsApproved.HasValue) query = query.Where(s => s.IsApproved == req.IsApproved.Value);
        if (!string.IsNullOrEmpty(req.Search))
            query = query.Where(s => s.CompanyName.Contains(req.Search) || s.SupplierCode.Contains(req.Search));
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(s => s.CreatedAt).Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);
        return BaseResponse<PagedResult<SupplierDto>>.Ok(new PagedResult<SupplierDto> { Items = mapper.Map<List<SupplierDto>>(items), TotalCount = total, Page = req.Page, PageSize = req.PageSize });
    }
}

public class GetSupplierByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetSupplierByIdQuery, BaseResponse<SupplierDto>>
{
    public async Task<BaseResponse<SupplierDto>> Handle(GetSupplierByIdQuery req, CancellationToken ct)
    {
        var s = await db.Suppliers.Include(s => s.Documents).FirstOrDefaultAsync(s => s.Id == req.Id, ct);
        if (s == null) return BaseResponse<SupplierDto>.Fail("Not found");
        return BaseResponse<SupplierDto>.Ok(mapper.Map<SupplierDto>(s));
    }
}

public class GetPendingSuppliersHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetPendingSuppliersQuery, BaseResponse<List<SupplierDto>>>
{
    public async Task<BaseResponse<List<SupplierDto>>> Handle(GetPendingSuppliersQuery req, CancellationToken ct)
    {
        var items = await db.Suppliers.Include(s => s.Documents).Where(s => !s.IsApproved && s.IsActive).ToListAsync(ct);
        return BaseResponse<List<SupplierDto>>.Ok(mapper.Map<List<SupplierDto>>(items));
    }
}
