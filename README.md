# Jan Awaaz demo

A browser-only citizen reporting demo for public infrastructure issues in Indian cities and villages.

## Run locally

1. Open this folder in VS Code.
2. Install **Live Server** (`ritwickdey.LiveServer`).
3. Right-click `index.html` and choose **Open with Live Server**. Use the localhost URL it opens; camera and precise location permissions require HTTPS or localhost.
4. Allow camera and location access when prompted. The report flow only accepts a live camera capture and a GPS fix.

The demo seeds 15 sample reports and keeps reports, the anonymous handle, and interactions in this browser's `localStorage`. It does not use Firebase or a server, so the data is local to this browser/device.

## Local Gemma via LM Studio

1. Load a Gemma model in LM Studio. Image classification needs a vision-capable model.
2. Start LM Studio's local server on port `1234` and enable CORS in its server settings.
3. The app checks `http://localhost:1234/v1/models`, prefers `google/gemma-4-e2b` when available, and sends chat, vision, moderation, and report-writing requests to the OpenAI-compatible `/v1/chat/completions` endpoint.
4. Click **Test Gemma** on the home page to send a real test prompt and see the model response.

The page calls LM Studio directly from the browser for this local demo. This is suitable only for a browser on the same computer as LM Studio. Do not expose the LM Studio port to the public internet. The demo does not invent a mock AI response when Gemma is unreachable or fails to understand the image; it reports the error instead. The model's visual assessment can still be wrong and should be reviewed by the citizen.

## Demo admin

- Username: `admin`
- Password: `janawaaz2024`

This is a convenience gate only. Because the project has no backend, anyone can inspect or bypass the login in browser tools, and report data can be edited in `localStorage`. Do not use this demo login or data for a real public service. Production needs server-side authentication, authorization, persistence, and a verified authority contact directory.

## Demo scope

This front-end prototype includes a nearby feed and map, radius/search controls, Hindi/English toggle, voice-enabled guided assistant, live-camera reporting flow, GPS/reverse geocoding, nearby-place lookup, duplicate detection/repost, local interactions, and a demo admin dashboard. Admins can only record a claimed fix with a live after photo and a GPS location within 50 m. A fix can be confirmed by nearby users within 500 m during the following seven days (20 confirmations for city authorities, five for village authorities). In this demo, a claimed fix is reopened after five dislikes if dislikes exceed likes.

Firebase persistence/authentication, real authority routing/contact verification, production moderation, and robust abuse/fake-location controls are not implemented in this browser-only demo. Location checks rely on browser GPS and are not resistant to spoofing.
