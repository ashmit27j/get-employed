# Mock interviews

Goal: 15-minute voice interviews for about 100 users at close to zero running cost. The formats are live voice, typed and MCQ (see `prototype/Interview.dc.html`). This doc covers the voice mode. Typed and MCQ use the same `/api/interview/turn` without audio.

## Speech-to-text (browser)

The order of engines:

1. **Web Speech API** (`SpeechRecognition`, or `webkitSpeechRecognition`) on Chrome, Edge and Safari.
2. **Whisper in the browser** through transformers.js, used when (1) is missing **or fails at runtime**. Brave and Firefox often expose the API and then raise a `network` error, so checking that the API exists isn't enough. Any `error` event of type `network`, `service-not-allowed` or `audio-capture`, or no result within a timeout, switches the session to Whisper for the rest of the session.
3. **Typed answer**, always available as the last resort.

Whisper details:

- Runs in a **Web Worker** so the UI never freezes.
- **Lazy-loaded** only when the fallback is needed. Uses `Xenova/whisper-tiny.en` by default (`NEXT_PUBLIC_WHISPER_MODEL`).
- Shows a download progress bar while the model loads and a "Transcribing…" indicator while it works.
- Transcribes the recorded answer in short chunks.
- The model is released and the worker terminated when the session ends.

Capture:

- **Click to start / click to stop** speaking. The mic is never always-on, which avoids the interviewer's voice being picked up.
- `MediaRecorder` picks the mime type at runtime: `audio/webm;codecs=opus`, falling back to `audio/mp4` (Safari).
- The session starts from a user tap, which iOS requires for both the mic and audio playback.
- `session.stt_engine` records which engine was used.

## LLM (server)

- Route: `POST /api/interview/turn` in `apps/app`. The body holds the session id, the transcript so far and the latest answer. Replies are streamed.
- Gemini Flash through the AI SDK. The key stays on the server.
- The interviewer prompt asks for **short replies** (one or two sentences, one question at a time). This keeps the pace natural and saves TTS characters.
- Questions are generated from the job (title, skills, JD) and the user's profile.
- At the end, `interview.grade` scores the four-part rubric (Communication, Technical accuracy, Structure, Confidence) and writes the feedback report.

## Text-to-speech (server)

- Route: `POST /api/tts` returns audio for the interviewer's line.
- Google Cloud Text-to-Speech, called from the server.
- Tier logic uses `tts_usage` (month, tier, characters), which is global because the free tier belongs to the Google Cloud project, not to each user:
  1. **WaveNet** voice while this month's WaveNet total is below `TTS_WAVENET_MONTHLY_LIMIT × TTS_SAFETY_RATIO` (limit defaults to 1,000,000, ratio to 0.9).
  2. Otherwise a **Standard** voice while the Standard total is below `TTS_STANDARD_MONTHLY_LIMIT × ratio` (defaults to 4,000,000).
  3. Otherwise the response says `{fallback: "browser"}`, and the client speaks with `speechSynthesis`.
- Characters are counted before the request, in a transaction, so parallel sessions can't overshoot the limit.
- **Cache:** fixed phrases (greeting, closing, "take your time") are stored in `interview_audio_cache` / storage, keyed by a hash of voice + text. A cache hit costs no characters.

## Caps and budget

- `INTERVIEW_MONTHLY_SESSION_CAP` sets the sessions per user per month. It applies the same way in cloud and local deployments; leave it empty for no cap. This is a cost guard, not billing.
- Sizing: an interviewer speaks roughly 2–3k characters in 15 minutes, so the WaveNet free tier covers about 350–500 sessions a month, with Standard as a larger buffer.
- **Google Cloud budget alert** (documented in the README): Billing → Budgets & alerts → create a budget for the project (for example ₹100 a month) with alerts at 50/90/100%. The character counter is the first line of defence; the budget alert catches anything it misses.

## Requirements

- HTTPS is needed for the microphone. Vercel provides it in the cloud, and `http://localhost` also counts as a secure context for local use.
- The Assistant dock is disabled during a live session, as in the prototype.

## Env

`GOOGLE_GENERATIVE_AI_API_KEY`, `INTERVIEW_MODEL`, `GOOGLE_TTS_CREDENTIALS` (service-account JSON or path), `TTS_WAVENET_VOICE`, `TTS_STANDARD_VOICE`, `TTS_WAVENET_MONTHLY_LIMIT`, `TTS_STANDARD_MONTHLY_LIMIT`, `TTS_SAFETY_RATIO`, `INTERVIEW_MONTHLY_SESSION_CAP`, `WHISPER_MODEL`.
