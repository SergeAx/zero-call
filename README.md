# Zero Call

A serverless, peer-to-peer WebRTC audio and video calling application.

This project provides a simple and secure way to establish a direct video call
with another person without any intermediary servers for the call itself. It
uses a manual signaling process where an invitation link is generated and
shared, and a response code is pasted back to finalize the connection.

## Tech Stack

-   **Framework**: [Astro](https://astro.build/)
-   **Runtime/Bundler**: [Bun](https://bun.sh/)
-   **Language**: 100% TypeScript

## How It Works

1.  **Create Invitation**: Open the site and click "Create Invitation." An
    invitation link is copied to your clipboard.
2.  **Share Link**: Send this link to the person you want to call.
3.  **Accept Invitation**: The other person opens the link and clicks "Accept."
    A response code is copied to their clipboard.
4.  **Connect**: They send the response code back to you. Paste it into the
    input field and click "Connect" to start the call.

## Develop and run locally

1. Install [Bun runtime](https://bun.sh/).
2. Install dependencies with `bun install`.
3. Run dev server with `bun dev`.

## Deploy to production

1. Build the bundle with `bun run build` (love the alliterations!).
2. Upload the `/dist/index.html` file anywhere.
3. You are breathtaking!

## Roadmap

* I10n
* Dynamic STUN servers list from https://github.com/pradt2/always-online-stun
* Use [Short SDP](https://github.com/ntsd/sdp-compact)
* QR codes for invitation and response
* Change/blur background using https://ai.google.dev/edge/mediapipe/
* Add chat
* Add file exchange
* Add E2E encryption

## Kudos

The core idea is inspired by [Zero share](https://github.com/ntsd/zero-share).

## License

This is free (as in "freedom") [MIT licensed](./LICENSE) open-source software.
