import SwiftUI
import WebKit

// M7 native integration experiment only. The authoritative game remains on HTTPS/WSS.
// No JavaScript bridge, entitlement flag, Steam/App Store key, or in-app purchase.
private enum PreviewOrigin {
    static let host = "linked-by-light-eu.onrender.com"
    static let page = URL(string: "https://linked-by-light-eu.onrender.com/")!
    static func permitted(_ url: URL) -> Bool {
        guard url.scheme?.lowercased() == "https" else { return url.scheme == "about" }
        return url.host?.lowercased() == host
    }
}

struct GameWebView: View {
    @State private var offline = false
    @State private var reloadSignal = 0

    var body: some View {
        ZStack {
            GameSurface(offline: $offline, reloadSignal: reloadSignal)
                .ignoresSafeArea()
            if offline {
                VStack(spacing: 12) {
                    Text("Connection interrupted").font(.headline)
                    Text("Two-player gameplay requires an internet connection.")
                        .multilineTextAlignment(.center)
                    Button("Retry connection") {
                        offline = false
                        reloadSignal += 1
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(22)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18))
                .padding()
                .accessibilityElement(children: .contain)
            }
        }
    }
}

private struct GameSurface: UIViewRepresentable {
    @Binding var offline: Bool
    let reloadSignal: Int

    func makeCoordinator() -> Coordinator { Coordinator(offline: $offline) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.scrollView.bounces = false
        view.allowsBackForwardNavigationGestures = false
        view.load(URLRequest(url: PreviewOrigin.page, cachePolicy: .reloadIgnoringLocalCacheData))
        return view
    }

    func updateUIView(_ view: WKWebView, context: Context) {
        if context.coordinator.reloadSignal != reloadSignal {
            context.coordinator.reloadSignal = reloadSignal
            view.load(URLRequest(url: PreviewOrigin.page, cachePolicy: .reloadIgnoringLocalCacheData))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        @Binding var offline: Bool
        var reloadSignal = 0
        init(offline: Binding<Bool>) { _offline = offline }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else {
                decisionHandler(.cancel)
                return
            }
            if PreviewOrigin.permitted(url) {
                decisionHandler(.allow)
            } else {
                // Keep navigation and authentication outside the privileged wrapper.
                if action.navigationType == .linkActivated, url.scheme == "https" {
                    UIApplication.shared.open(url)
                }
                decisionHandler(.cancel)
            }
        }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            offline = false
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!,
                     withError error: Error) { offline = true }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                     withError error: Error) { offline = true }
    }
}
