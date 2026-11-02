"""Entry point for the packaged app: double-click opens VeloDown in the browser."""
import sys

from velodown.cli import main

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:] or ["serve", "--open"]))
