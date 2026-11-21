# iPhone — WKWebView internal preview (NOT App Store build)

* **Browser first:** iPhone Safari/PWA remains the tested delivery method. v37 adds RU/EN install guidance using the existing browser localization.
* **Native scaffold:** this is an unsigned SwiftUI + WebKit host with a fixed HTTPS origin, no JavaScript bridge, no local entitlement or Steam keys. It has a native offline notice, retries, landscape preference and external navigation restrictions.
* **Build:** On a Mac with Xcode and [XcodeGen](https://github.com/yonaskolb/XcodeGen), from `mobile/ios/` run `xcodegen generate` and open the resulting Xcode project. Build an **internal iOS Simulator** target (no signing). It has **not** been compiled or tested on macOS/iPhone in CI.
* **Production gate:** a real iOS release needs genuine physical-device UI/thermal/background checks, VoiceOver, consent/privacy disclosures, account deletion/Apple sign-in if required by policy, native feature depth review, app icons, signing credentials, developer account, TestFlight, StoreKit entitlements/restore/refund verified server-side, crossplay and App Store approval. Thin website wrappers may not meet store quality standards.
* **Do not submit:** the current web game remains free online beta. This preview does not prove paid entitlement, store compliance or production readiness. G4 #26 and G7 #15 remain HOLD.
