# setup-folders.ps1
# PASS Platform - Modular Folder Structure Generator
# Run: .\setup-folders.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up PASS Platform folder structure..." -ForegroundColor Cyan

# Base directories
$dirs = @(
    # App Router Groups
    "src/app/(marketing)"
    "src/app/(marketing)/events/[id]"
    "src/app/(auth)/sign-in"
    "src/app/(auth)/sign-up"
    "src/app/(dashboard)/passes"
    "src/app/(dashboard)/profile"
    "src/app/(seller)/seller/passes"
    "src/app/(seller)/seller/events"
    "src/app/api/webhooks"

    # Domain Features
    "src/features/auth"
    "src/features/events"
    "src/features/passes/services"
    "src/features/orders/services"
    "src/features/seller/services"

    # Shared Layer
    "src/shared/ui"
    "src/shared/components/events"
    "src/shared/components/passes"
    "src/shared/components/layout"
    "src/shared/lib"
    "src/shared/db/schema"
    "src/shared/types"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Exists:  $dir" -ForegroundColor Yellow
    }
}

# Create placeholder files so Git tracks empty folders
$placeholders = @{
    "src/features/auth/index.ts"              = "// Auth feature exports"
    "src/features/events/index.ts"            = "// Events feature exports"
    "src/features/passes/services/index.ts"   = "// Pass services exports"
    "src/features/orders/services/index.ts"   = "// Order services exports"
    "src/features/seller/services/index.ts"   = "// Seller services exports"
    "src/shared/lib/utils.ts"                 = "export {} // Shared utilities"
    "src/shared/types/index.ts"               = "// Global type exports"
    "src/shared/db/schema/index.ts"           = "// DB schema barrel export"
    "src/app/(marketing)/page.tsx"             = "export default function HomePage() { return <div>Home</div> }"
    "src/app/(dashboard)/passes/page.tsx"      = "export default function PassesPage() { return <div>My Passes</div> }"
    "src/app/(seller)/seller/passes/page.tsx"  = "export default function SellerPassesPage() { return <div>Seller Passes</div> }"
}

foreach ($file in $placeholders.GetEnumerator()) {
    if (-not (Test-Path $file.Key)) {
        Set-Content -Path $file.Key -Value $file.Value
        Write-Host "  📄 Created: $($file.Key)" -ForegroundColor Magenta
    }
}

Write-Host "`n✅ PASS Platform folder structure ready!" -ForegroundColor Cyan
Write-Host "Next: Configure Clerk, Drizzle, and shadcn/ui" -ForegroundColor White