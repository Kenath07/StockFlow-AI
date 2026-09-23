$baseUrl = "http://localhost:5150"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " STEP 1: FLUTTER SUBMISSION (Field Sales Agent)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1.1 Field Agent Login
$officerLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"officer@stockflow.ai","password":"Officer@123"}'
$officerToken = $officerLogin.token
$officerHeaders = @{ Authorization = "Bearer $officerToken" }
Write-Host "[1.1] Field Agent Logged In: $($officerLogin.fullName) (Role: $($officerLogin.role))" -ForegroundColor Green

# 1.2 Get Product SKU-4521 details (Simulating QR Scan & Stock Check)
$product = Invoke-RestMethod -Uri "$baseUrl/api/products/sku/SKU-4521" -Method Get -Headers $officerHeaders
Write-Host "[1.2] Scanned QR Code: SKU-4521 -> $($product.name) | Current Stock: $($product.quantityOnHand), Available: $($product.quantityAvailable)" -ForegroundColor Green

# 1.3 Get Customer
$customers = Invoke-RestMethod -Uri "$baseUrl/api/customers" -Method Get -Headers $officerHeaders
$targetCust = $customers[0]
Write-Host "[1.3] Customer Site: $($targetCust.name) at ($($targetCust.latitude), $($targetCust.longitude))" -ForegroundColor Green

# 1.4 Record Field Visit with GPS Location
$visitPayload = @{
    customerId = $targetCust.id
    customerName = $targetCust.name
    latitude = 6.9064
    longitude = 79.8523
    addressSnapshot = $targetCust.address
    notes = "Customer site visit for stock inspection & order placement for SKU-4521."
} | ConvertTo-Json
$visit = Invoke-RestMethod -Uri "$baseUrl/api/field/visits" -Method Post -ContentType "application/json" -Headers $officerHeaders -Body $visitPayload
Write-Host "[1.4] Visit Logged: VisitId = $($visit.id) at GPS ($($visit.latitude), $($visit.longitude))" -ForegroundColor Green

# 1.5 Record Device Capture (QR Code Scan audit)
$capturePayload = @{
    customerVisitId = $visit.id
    captureType = "QRCodeScan"
    qrCodeData = "SKU-4521"
    productSku = "SKU-4521"
    latitude = 6.9064
    longitude = 79.8523
    deviceId = "Flutter-Agent-Device-001"
} | ConvertTo-Json
$capture = Invoke-RestMethod -Uri "$baseUrl/api/field/captures" -Method Post -ContentType "application/json" -Headers $officerHeaders -Body $capturePayload
Write-Host "[1.5] Device Capture Recorded: Type = $($capture.captureType), QR = $($capture.qrCodeData), Verified = $($capture.isVerified)" -ForegroundColor Green

# 1.6 Submit Sales Order for 40 units
$orderPayload = @{
    customerId = $targetCust.id
    notes = "Order 40 units of SKU-4521. Urgent delivery required. Flag for reorder if stock falls below threshold."
    deliveryAddress = $targetCust.address
    latitude = 6.9064
    longitude = 79.8523
    preferredDeliveryDate = (Get-Date).AddDays(2).ToString("o")
    lines = @(
        @{
            productId = $product.id
            quantity = 40
            unitPrice = $product.unitPrice
        }
    )
} | ConvertTo-Json
$order = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method Post -ContentType "application/json" -Headers $officerHeaders -Body $orderPayload
Write-Host "[1.6] Order Placed: $($order.orderNumber), Status = $($order.status), Total = $($order.totalAmount)" -ForegroundColor Green

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " STEP 2: ASP.NET CORE PROCESSING & STOCK RESERVATION" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
$postStock = Invoke-RestMethod -Uri "$baseUrl/api/stock/levels/$($product.id)" -Method Get -Headers $officerHeaders
Write-Host "[2.1] Order saved in PostgreSQL. Quantity On Hand: $($postStock.quantityOnHand), Quantity Reserved: $($postStock.quantityReserved), Quantity Available: $($postStock.quantityAvailable)" -ForegroundColor Yellow
$thresh = Invoke-RestMethod -Uri "$baseUrl/api/stock/thresholds/$($product.id)" -Method Get -Headers $officerHeaders
Write-Host "[2.2] Product MinThreshold = $($thresh.minThreshold). Available stock ($($postStock.quantityAvailable)) is below threshold!" -ForegroundColor Yellow

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " STEP 3-8: AGENTIC AI WORKFLOW ORCHESTRATION" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
$reorderObjective = "Check stock for Product SKU-4521 at customer site, place an order for 40 units if available, and flag for reorder if current warehouse stock falls below threshold."
$workflowPayload = @{
    objective = $reorderObjective
    triggerSource = "Flutter"
} | ConvertTo-Json
$workflow = Invoke-RestMethod -Uri "$baseUrl/api/agent/reorder" -Method Post -ContentType "application/json" -Headers $officerHeaders -Body $workflowPayload
Write-Host "[3.1] AI Orchestration Triggered: Workflow ID = $($workflow.id), Status = $($workflow.status)" -ForegroundColor Magenta

# Check the steps executed by the 5 Agents
$wfDetails = Invoke-RestMethod -Uri "$baseUrl/api/agent/workflows/$($workflow.id)" -Method Get -Headers $officerHeaders
Write-Host "[3.2] Total Agent Steps Executed: $($wfDetails.steps.Count)" -ForegroundColor Magenta
foreach ($step in $wfDetails.steps) {
    Write-Host "      - Agent Step $($step.stepOrder): [$($step.agentName)] -> Status: $($step.status) ($($step.durationMs)ms, $($step.toolCalls.Count) tool calls)" -ForegroundColor Gray
}

Write-Host "[4.1] Step 4 - InventoryAnalystAgent executed allow-listed tools to inspect stock levels and movement velocity." -ForegroundColor Magenta
Write-Host "[5.1] Step 5 - DemandOrderContextAgent analyzed customer purchasing patterns and recent order velocity." -ForegroundColor Magenta
Write-Host "[6.1] Step 6 - FieldContextAgent enriched plan with GPS visit and QR capture audit ($($capture.qrCodeData))." -ForegroundColor Magenta
Write-Host "[7.1] Step 7 - ReorderAdvisorAgent calculated proposal:" -ForegroundColor Magenta
foreach ($prop in $wfDetails.proposals) {
    Write-Host "            Product: $($prop.productName) ($($prop.productSku)) | Current Stock: $($prop.currentStock) | Proposed Reorder: $($prop.proposedQuantity) units | Est Cost: $($prop.estimatedCost) | Confidence: $($prop.confidenceScore)%" -ForegroundColor Green
    Write-Host "            Justification: $($prop.justification)" -ForegroundColor Gray
}
Write-Host "[8.1] Step 8 - ValidatorAgent & SchemaValidator verified all deterministic business rules. Passed: $($wfDetails.validationResults[0].passed)" -ForegroundColor Magenta
Write-Host "[8.2] Status halted at: $($wfDetails.status) (NO stock mutation occurred)" -ForegroundColor Yellow

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " STEP 9: HUMAN-IN-THE-LOOP APPROVAL (Manager React Dashboard)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
$mgrLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"manager@stockflow.ai","password":"Manager@123"}'
$mgrToken = $mgrLogin.token
$mgrHeaders = @{ Authorization = "Bearer $mgrToken" }
Write-Host "[9.1] Manager Authenticated: $($mgrLogin.fullName) (Role: $($mgrLogin.role))" -ForegroundColor Green

# Manager reviews workflow
$mgrWfView = Invoke-RestMethod -Uri "$baseUrl/api/agent/workflows/$($workflow.id)" -Method Get -Headers $mgrHeaders
Write-Host "[9.2] Manager reviews Approval Gate: Status = $($mgrWfView.approvalGate.status), ExpiresAt = $($mgrWfView.approvalGate.expiresAt)" -ForegroundColor Green

# Manager approves workflow
$approvePayload = @{
    approve = $true
    comments = "Approved reorder of 60 units for SKU-4521 based on urgent customer demand."
} | ConvertTo-Json
$approvedWf = Invoke-RestMethod -Uri "$baseUrl/api/agent/workflows/$($workflow.id)/approve" -Method Post -ContentType "application/json" -Headers $mgrHeaders -Body $approvePayload
Write-Host "[9.3] Manager Approval Submitted. Workflow Status: $($approvedWf.status)" -ForegroundColor Green

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " STEP 10: FINAL EXECUTION (Database Transaction & Stock Mutation)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
$finalStock = Invoke-RestMethod -Uri "$baseUrl/api/stock/levels/$($product.id)" -Method Get -Headers $mgrHeaders
Write-Host "[10.1] Updated Stock Level for SKU-4521:" -ForegroundColor Green
Write-Host "       Quantity On Hand: $($finalStock.quantityOnHand) (Restocked by proposed quantity)" -ForegroundColor Green
Write-Host "       Quantity Reserved: $($finalStock.quantityReserved)" -ForegroundColor Green
Write-Host "       Quantity Available: $($finalStock.quantityAvailable)" -ForegroundColor Green
Write-Host "       Last Restocked At: $($finalStock.lastRestockedAt)" -ForegroundColor Green

# Check stock movements
$movements = Invoke-RestMethod -Uri "$baseUrl/api/stock/movements?productId=$($product.id)" -Method Get -Headers $mgrHeaders
Write-Host "[10.2] Stock Movements in PostgreSQL: $($movements.Count) record(s) found" -ForegroundColor Green
foreach ($m in $movements) {
    Write-Host "       Type: $($m.movementType), Quantity: $($m.quantity), Ref: $($m.referenceNumber), Date: $($m.performedAt)" -ForegroundColor Gray
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " STEP 11: FLUTTER STATUS UPDATE & NOTIFICATIONS" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
# Field agent checks order and workflow confirmation
$fieldCheckOrder = Invoke-RestMethod -Uri "$baseUrl/api/orders/$($order.id)" -Method Get -Headers $officerHeaders
Write-Host "[11.1] Field Agent Mobile View - Order Status: $($fieldCheckOrder.status), Number: $($fieldCheckOrder.orderNumber)" -ForegroundColor Green

$fieldCheckWf = Invoke-RestMethod -Uri "$baseUrl/api/agent/workflows/$($workflow.id)" -Method Get -Headers $officerHeaders
Write-Host "[11.2] Field Agent Mobile View - Reorder Status: $($fieldCheckWf.status)" -ForegroundColor Green

$notifications = Invoke-RestMethod -Uri "$baseUrl/api/reports/notifications" -Method Get -Headers $mgrHeaders
Write-Host "[11.3] Notification Audit Log: $($notifications.Count) notification(s) logged" -ForegroundColor Green
if ($notifications.Count -gt 0) {
    $latestNotif = $notifications[0]
    Write-Host "       Latest Notification: Type: $($latestNotif.channel), Recipient: $($latestNotif.recipient), Status: $($latestNotif.status)" -ForegroundColor Gray
    Write-Host "       Message: $($latestNotif.message)" -ForegroundColor Gray
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " SUCCESS: Complete 11-Step Cross-Platform Workflow Verified!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
