{
  description = "AlbertPlus Flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
            bun
            doppler
            turbo
            nodePackages.vercel

            git
            gh
            gum
          ];

          shellHook = ''
            gum spin --title "Installing dependencies..." -- bun install

            # Check and configure Doppler
            if [ -z "$(doppler configure get token --plain 2>/dev/null)" ]; then
              gum style --foreground "#f9e2af" "Doppler not configured yet"
              
              DOPPLER_TOKEN=$(gum input --password --placeholder "Enter your Doppler service token")
              
              if [ -n "$DOPPLER_TOKEN" ]; then
                echo "$DOPPLER_TOKEN" | doppler configure set token --scope /
                gum style --foreground "#a6e3a1" "✅ Doppler configured successfully"
                clear
              else
                gum style --foreground "#f38ba8" "⚠️ No token provided"
                gum style --foreground "#f38ba8" --italic "Configure later with: echo 'your-token' | doppler configure set token --scope /"
              fi
            fi

            gum style --foreground "#a6e3a1" \
              --align center --width 60 --padding "1 2" \
              "🚀 Development Environment Ready!"

            gum style --foreground "#cba6f7" --bold \
              --align center --width 60 --padding "0 2" \
              "📦 Node.js: $(node --version)
            🥖 Bun: $(bun --version)
            "

            gum style --bold "Available Commands:"

            gum style --margin "0 2" \
              "$(gum style --bold --foreground "#89b4fa" 'bun dev')         - Start development servers" \
              "$(gum style --bold --foreground "#89b4fa" 'bun dashboard')   - Open Convex dashboard" \
              "$(gum style --bold --foreground "#89b4fa" 'bun check')       - Check code with Biome" \
              "$(gum style --bold --foreground "#89b4fa" 'bun check:types') - Run TypeScript type checking"
            echo ""
          '';
        };
      }
    );
}
