{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Core Tauri dependencies
    webkitgtk_4_1
    libsoup_3
    gtk3
    pkg-config
    
    # OpenSSL development libraries
    openssl
    openssl.dev  # Development headers
    
    # xdg-open fix
    xdg-utils
    
    # Rust
    cargo
    rustc
    
    # Node.js
    nodejs_20
    
    # Additional libraries
    glib
    pango
    atk
    cairo
    gdk-pixbuf
  ];

  PKG_CONFIG_PATH = 
    "${pkgs.webkitgtk_4_1}/lib/pkgconfig" + ":" +
    "${pkgs.libsoup_3}/lib/pkgconfig" + ":" +
    "${pkgs.gtk3}/lib/pkgconfig" + ":" +
    "${pkgs.openssl.dev}/lib/pkgconfig";  # Add OpenSSL pkg-config
  
  # OpenSSL environment variables
  OPENSSL_DIR = "${pkgs.openssl.dev}";
  OPENSSL_INCLUDE_DIR = "${pkgs.openssl.dev}/include";
  OPENSSL_LIB_DIR = "${pkgs.openssl.out}/lib";
  
  RUST_BACKTRACE = "full";
  
  shellHook = ''
    export PATH="${pkgs.xdg-utils}/bin:$PATH"
    
    # Create xdg-open symlink if needed
    if [ ! -e /usr/bin/xdg-open ]; then
      echo "Creating /usr/bin/xdg-open symlink..."
      sudo mkdir -p /usr/bin 2>/dev/null || true
      sudo ln -sf ${pkgs.xdg-utils}/bin/xdg-open /usr/bin/xdg-open 2>/dev/null || true
    fi
    
    echo "OpenSSL development environment set up."
    echo "OPENSSL_DIR: $OPENSSL_DIR"
  '';
}