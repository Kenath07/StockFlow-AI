using StockFlow.Agents.State;
using StockFlow.Agents.SpecializedAgents;

namespace StockFlow.Agents.ReorderAdvisor;

/// <summary>
/// Deterministic quantity calculator used by the ReorderAdvisorAgent.
/// Uses velocity, demand signals, and field evidence to compute optimal reorder quantities.
/// This is NOT AI-generated — all calculations are deterministic business rules.
/// </summary>
public static class QuantityCalculator
{
    /// <summary>
    /// Calculate reorder quantity based on:
    /// - Average daily usage (velocity) from stock movements
    /// - Demand signals from order history
    /// - Field evidence (how many times the SKU was scanned in the field)
    /// - Safety stock buffer (1.5x coverage for lead time)
    /// </summary>
    public static (int Quantity, int Confidence, string Justification) Calculate(
        EnrichedStockItem item,
        double avgDailyDemand,
        int fieldScanCount,
        int targetCoverageDays = 60)
    {
        var info = item.DetailedInfo;
        var basic = item.BasicInfo;

        // Base quantity: cover target days at current velocity
        var velocityBased = (int)Math.Ceiling(Math.Max(info.AverageDailyUsage, avgDailyDemand) * targetCoverageDays);

        // Safety stock: 30-day buffer
        var safetyStock = (int)Math.Ceiling(Math.Max(info.AverageDailyUsage, 0.5) * 30);

        // Field demand boost: each scan adds 10% urgency
        var fieldBoost = (int)(velocityBased * (fieldScanCount * 0.1));

        var proposed = Math.Max(
            basic.ReorderQuantity,
            velocityBased + safetyStock + fieldBoost
        );

        // Confidence scoring (0-100)
        var confidence = 50;
        if (info.AverageDailyUsage > 0) confidence += 20;
        if (avgDailyDemand > 0) confidence += 15;
        if (fieldScanCount > 0) confidence += 15;

        var justification = $"Stock {info.QuantityOnHand} units (threshold: {info.MinThreshold}). " +
            $"Velocity: {info.AverageDailyUsage:F2} units/day, ~{info.DaysOfStockRemaining} days remaining. " +
            $"Order demand: {avgDailyDemand:F2} units/day. Field scans: {fieldScanCount}. " +
            $"Proposed: {proposed} units covers ~{targetCoverageDays}d + {safetyStock} safety stock.";

        return (proposed, confidence, justification);
    }
}
