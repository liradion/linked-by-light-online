# Windows 10/11 on-device/internal release evidence ONLY. Does not sign binaries.
param(
  [Parameter(Mandatory=$true)][string]$Installer,
  [Parameter(Mandatory=$true)][string]$ExpectedSha256,
  [Parameter(Mandatory=$true)][string]$ExpectedPublisher
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Installer -PathType Leaf)) { throw 'Installer does not exist' }
if ($Installer -notmatch '\.exe$') { throw 'Expected Windows .exe installer' }
if ($ExpectedSha256 -notmatch '^[a-fA-F0-9]{64}$') { throw 'Expected a full SHA256 digest' }
if ([string]::IsNullOrWhiteSpace($ExpectedPublisher) -or $ExpectedPublisher.Length -lt 3) {
  throw 'Expected publisher subject fragment'
}
$hash = (Get-FileHash -LiteralPath $Installer -Algorithm SHA256).Hash
if ($hash.ToUpperInvariant() -ne $ExpectedSha256.ToUpperInvariant()) { throw 'SHA256 mismatch' }
$signature = Get-AuthenticodeSignature -LiteralPath $Installer
if ($signature.Status -ne 'Valid') {
  throw ("Authenticode verification failed: " + $signature.Status)
}
if (-not $signature.SignerCertificate) { throw 'Signing certificate missing' }
$subject = [string]$signature.SignerCertificate.Subject
if ($subject.IndexOf($ExpectedPublisher, [StringComparison]::OrdinalIgnoreCase) -lt 0) {
  throw 'Certificate publisher mismatch'
}
if ($signature.SignerCertificate.NotAfter -lt [DateTime]::UtcNow) {
  throw 'Signing certificate expired'
}
@{
  status='SIGNATURE_TECHNICALLY_VERIFIED'
  sha256=$hash
  signerSubject=$subject
  statusCode=[string]$signature.Status
  checkedAt=[DateTime]::UtcNow.ToString('o')
  commercialReleaseApproved=$false
  notes='Independent Windows install, Steamworks and rights/privacy signoff still required'
} | ConvertTo-Json -Depth 4
