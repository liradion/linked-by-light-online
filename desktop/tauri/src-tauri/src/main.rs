#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// M5 architecture comparison ONLY: native host with no plugin commands,
// no payment logic, no bundled server keys, no local authoritative game.
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Tauri M5 preview shell failed");
}
