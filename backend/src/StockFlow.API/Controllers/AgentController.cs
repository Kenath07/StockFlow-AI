using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockFlow.Application.DTOs.Agent;
using StockFlow.Application.Interfaces;
using System.Security.Claims;

namespace StockFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgentController : ControllerBase
{
    private readonly IAgentWorkflowService _workflows;

    public AgentController(IAgentWorkflowService workflows) => _workflows = workflows;

    /// <summary>Start a new AI reorder workflow. Manager, Admin, or FieldSales.</summary>
    [HttpPost("reorder")]
    [Authorize(Roles = "Admin,Manager,FieldSales")]
    public async Task<IActionResult> StartReorder([FromBody] StartReorderRequestDto dto, CancellationToken ct)
    {
        var initiatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var workflow = await _workflows.StartReorderWorkflowAsync(dto, initiatedBy, ct);
        return AcceptedAtAction(nameof(GetWorkflow), new { id = workflow.Id }, workflow);
    }

    /// <summary>Get all workflows with optional status filter.</summary>
    [HttpGet("workflows")]
    [Authorize(Roles = "Admin,Manager,FieldSales")]
    public async Task<IActionResult> GetWorkflows([FromQuery] string? status, CancellationToken ct)
        => Ok(await _workflows.GetAllWorkflowsAsync(status, ct));

    /// <summary>Get a specific workflow by ID including proposals and approval gate.</summary>
    [HttpGet("workflows/{id:guid}")]
    [Authorize(Roles = "Admin,Manager,FieldSales")]
    public async Task<IActionResult> GetWorkflow(Guid id, CancellationToken ct)
    {
        var workflow = await _workflows.GetWorkflowAsync(id, ct);
        return workflow is null ? NotFound() : Ok(workflow);
    }

    /// <summary>Approve a reorder proposal. This is the Human-in-the-Loop gate. Manager or Admin.</summary>
    [HttpPost("workflows/{id:guid}/approve")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRejectDto dto, CancellationToken ct)
    {
        try
        {
            var reviewedBy = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Ok(await _workflows.ApproveWorkflowAsync(id, dto, reviewedBy, ct));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>Reject a reorder proposal. Manager or Admin.</summary>
    [HttpPost("workflows/{id:guid}/reject")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] ApproveRejectDto dto, CancellationToken ct)
    {
        try
        {
            var reviewedBy = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Ok(await _workflows.RejectWorkflowAsync(id, dto, reviewedBy, ct));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
