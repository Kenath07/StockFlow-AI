using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ReportsController(ApplicationDbContext db) => _db = db;

    /// <summary>Low-stock report: all products below threshold with urgency scoring.</summary>
    [HttpGet("low-stock")]
    public async Task<IActionResult> LowStockReport(CancellationToken ct)
    {
        var report = await _db.StockLevels
            .Include(s => s.Product).ThenInclude(p => p.Category)
            .Include(s => s.Product).ThenInclude(p => p.LowStockThreshold)
            .Where(s => s.Product.LowStockThreshold != null && s.QuantityOnHand <= s.Product.LowStockThreshold.MinThreshold)
            .OrderBy(s => s.QuantityOnHand)
            .Select(s => new
            {
                s.ProductId,
                s.Product.Name,
                s.Product.Sku,
                Category = s.Product.Category.Name,
                s.QuantityOnHand,
                s.QuantityAvailable,
                MinThreshold = s.Product.LowStockThreshold!.MinThreshold,
                ReorderQuantity = s.Product.LowStockThreshold!.ReorderQuantity,
                UrgencyScore = s.QuantityOnHand == 0 ? 100 : (int)(100.0 - (s.QuantityOnHand * 100.0 / s.Product.LowStockThreshold.MinThreshold))
            })
            .ToListAsync(ct);

        return Ok(new { GeneratedAt = DateTime.UtcNow, Count = report.Count, Items = report });
    }

    /// <summary>Sales velocity report: top products by units sold in the last N days.</summary>
    [HttpGet("sales-velocity")]
    public async Task<IActionResult> SalesVelocity([FromQuery] int days = 30, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddDays(-days);
        var velocity = await _db.OrderLines
            .Include(l => l.Product)
            .Include(l => l.SalesOrder)
            .Where(l => l.SalesOrder.Status != OrderStatus.Cancelled && l.SalesOrder.OrderDate >= since)
            .GroupBy(l => new { l.ProductId, l.Product.Name, l.Product.Sku })
            .Select(g => new
            {
                g.Key.ProductId,
                g.Key.Name,
                g.Key.Sku,
                TotalUnitsSold = g.Sum(l => l.Quantity),
                TotalRevenue = g.Sum(l => l.TotalPrice),
                OrderCount = g.Select(l => l.SalesOrderId).Distinct().Count(),
                AvgDailyDemand = Math.Round(g.Sum(l => l.Quantity) / (double)days, 2)
            })
            .OrderByDescending(r => r.TotalUnitsSold)
            .Take(20)
            .ToListAsync(ct);

        return Ok(new { GeneratedAt = DateTime.UtcNow, PeriodDays = days, Items = velocity });
    }

    /// <summary>Agent performance report: workflow execution summary.</summary>
    [HttpGet("agent-performance")]
    public async Task<IActionResult> AgentPerformance(CancellationToken ct)
    {
        var workflows = await _db.AgentWorkflows
            .Include(w => w.Steps)
            .Include(w => w.ReorderProposals)
            .OrderByDescending(w => w.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

        var summary = new
        {
            TotalWorkflows = workflows.Count,
            Completed = workflows.Count(w => w.Status == WorkflowStatus.Completed),
            PendingApproval = workflows.Count(w => w.Status == WorkflowStatus.PendingManagerApproval),
            Failed = workflows.Count(w => w.Status == WorkflowStatus.Failed),
            Rejected = workflows.Count(w => w.Status == WorkflowStatus.Rejected),
            TotalProposals = workflows.Sum(w => w.ReorderProposals.Count),
            ApprovedProposals = workflows.Sum(w => w.ReorderProposals.Count(p => p.IsApproved)),
            TotalEstimatedRestockValue = workflows.Sum(w => w.ReorderProposals.Where(p => p.IsApproved).Sum(p => p.EstimatedCost)),
            RecentWorkflows = workflows.Take(10).Select(w => new
            {
                w.Id, w.Objective, Status = w.Status.ToString(), w.TriggerSource,
                w.InitiatedBy, w.CreatedAt, w.CompletedAt,
                StepCount = w.Steps.Count,
                ProposalCount = w.ReorderProposals.Count
            })
        };

        return Ok(summary);
    }

    /// <summary>Notification audit log.</summary>
    [HttpGet("notifications")]
    public async Task<IActionResult> NotificationHistory([FromQuery] int take = 50, CancellationToken ct = default)
    {
        var logs = await _db.NotificationLogs
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new { n.Id, Channel = n.Channel.ToString(), Status = n.Status.ToString(), n.Recipient, n.Subject, n.CreatedAt, n.SentAt, n.RetryCount })
            .ToListAsync(ct);

        return Ok(logs);
    }
}
