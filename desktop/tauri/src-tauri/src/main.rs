#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// M5 technical prototype. The authoritative game remains on the remote host.
// No privileged Tauri commands/capabilities may be exposed to remote content.
const HOST: &str = "linked-by-light-eu.onrender.com";
const GAME_URL: &str = "https://linked-by-light-eu.onrender.com/";

fn trusted_navigation(url: &tauri::Url) -> bool {
    url.scheme() == "https"
        && url.host_str() == Some(HOST)
        && url.port().is_none()
        && url.username().is_empty()
        && url.password().is_none()
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let start_url = tauri::Url::parse(GAME_URL)?;
            let _window = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::External(start_url),
            )
            .title("Linked by Light · M5 Tauri Internal Preview")
            .inner_size(1260.0, 810.0)
            .min_inner_size(860.0, 580.0)
            .on_navigation(trusted_navigation)
            .on_new_window(|_url, _features| tauri::webview::NewWindowResponse::Deny)
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Tauri M5 preview shell failed");
}

#[cfg(test)]
mod tests {
    use super::trusted_navigation;
    #[test]
    fn only_exact_https_game_origin_is_navigable() {
        for url in [
            "https://linked-by-light-eu.onrender.com/",
            "https://linked-by-light-eu.onrender.com/?room=ABCDEF",
            "https://linked-by-light-eu.onrender.com/terms-en.html",
        ] {
            assert!(trusted_navigation(&tauri::Url::parse(url).unwrap()));
        }
        for url in [
            "http://linked-by-light-eu.onrender.com/",
            "https://linked-by-light-eu.onrender.com.evil.test/",
            "https://evil.test/",
            "file:///C:/secret",
            "https://user:pass@linked-by-light-eu.onrender.com/",
            "https://linked-by-light-eu.onrender.com:444/",
        ] {
            assert!(!trusted_navigation(&tauri::Url::parse(url).unwrap()));
        }
    }
}
