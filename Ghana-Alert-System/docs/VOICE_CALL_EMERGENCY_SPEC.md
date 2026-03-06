# Voice-Call Emergency Feature — Design & Implementation Spec (Ghana)

**Target:** Mobile app one-tap emergency voice call for Ghana.  
**Audience:** Developers, QA, product.  
**Stack alignment:** React Native/Expo (primary); Android Kotlin & Flutter snippets for reference.

---

## 1. Functional spec (short)

### 1.1 One-tap emergency call

- **Primary:** Dial **112** (National Emergency Hotline / NECC).
- **Fallback sequence** (if 112 fails or no connection within 15s): **191** (Police) → **193** (Ambulance) → **192** (Fire).
- **Definition of “fail”:** No connection established, call dropped within 15s, or user-reported failure.

### 1.2 UI requirements

| Element | Requirement |
|--------|-------------|
| **SOS button** | Large, high-contrast, one-tap to start emergency call flow. |
| **Live GPS** | Show latitude, longitude, and **accuracy (m)**; update when accuracy improves. |
| **Human-readable address** | Reverse-geocode and show; show “Resolving…” / “Unavailable” when appropriate. |
| **Incident type selector** | Options: Police / Fire / Medical / Other (align with existing `IncidentType`). |
| **Silent call toggle** | When ON: no ringer/vibration on device; call still placed. |
| **Auto-play message toggle** | When ON: play prerecorded/TTS message after call connects (or when user is incapacitated). |
| **Call & send location button** | Starts call flow and sends location (and optional payload) to backend/SMS as per fallback logic. |

### 1.3 Data flow

- On “Call & send location”: acquire location → attempt voice call (112 → 191 → 193 → 192) → on 3 failed attempts, SMS fallback → then USSD if available → else queue locally and auto-sync.

---

## 2. UI text and “Read to operator” script

### 2.1 Screen title

- **EN:** `Emergency Call`
- **Twi:** (add per translations)
- **Ga / Ewe:** (add per translations)

### 2.2 Static labels (EN)

| Key | Text |
|-----|------|
| `sosButton` | SOS |
| `yourLocation` | Your location |
| `gpsAccuracy` | Accuracy: {accuracy}m |
| `address` | Address |
| `incidentType` | Incident type |
| `silentCall` | Silent call |
| `autoPlayMessage` | Auto-play message to operator |
| `callAndSendLocation` | Call & send location |
| `readToOperator` | Read to operator |
| `locationUnavailable` | Location unavailable |
| `resolvingAddress` | Resolving address… |

### 2.3 Script for user to read (and TTS “Read to operator”)

**Short script (user or TTS):**

```
Emergency. I need help. My location is [HUMAN_ADDRESS]. Coordinates: [LAT], [LNG]. 
Incident type: [INCIDENT_TYPE]. Please send [POLICE/AMBULANCE/FIRE] as appropriate. 
My callback number is [USER_NUMBER]. Thank you.
```

**TTS snippet (tappable “Read to operator”):**  
Use the same text; substitute `[HUMAN_ADDRESS]`, `[LAT]`, `[LNG]`, `[INCIDENT_TYPE]`, `[USER_NUMBER]` at runtime. Use system TTS (e.g. `expo-speech`) with clear, slow pace for operator comprehension.

---

## 3. Auto-play prerecorded message (sample text)

When “Auto-play message” is ON or user is incapacitated, play the following (TTS or prerecorded):

```
Automated emergency report. Location: [LAT],[LNG] — [Human address]. 
Incident: [INCIDENT_TYPE]. Number of people affected: [COUNT]. 
Callback: [USER_NUMBER].
```

- **Placeholders:**  
  `[LAT]`, `[LNG]` = decimal degrees, e.g. `5.6037, -0.1870`  
  `[Human address]` = reverse-geocoded address or “Coordinates only”  
  `[INCIDENT_TYPE]` = Police | Fire | Medical | Other  
  `[COUNT]` = user-entered or default “1”  
  `[USER_NUMBER]` = device phone number or registered callback

---

## 4. Fallback & delivery logic (pseudocode)

```text
FALLBACK_SEQUENCE = ["112", "191", "193", "192"]
CALL_TIMEOUT_SEC = 15
MAX_CALL_ATTEMPTS = 3

function attemptEmergencyCall(incidentType, location, options):
  options = options || {}
  silentCall = options.silentCall || false
  autoPlayMessage = options.autoPlayMessage || false
  attempts = 0
  lastError = null

  for number in FALLBACK_SEQUENCE:
    if attempts >= MAX_CALL_ATTEMPTS: break
    attempts += 1
    if silentCall: setDeviceSilent()
    placeCall(number)
    connected = waitForCallConnected(CALL_TIMEOUT_SEC)
    if connected:
      if autoPlayMessage: playAutoMessage(incidentType, location)
      logSuccess(number, duration)
      return { success: true, number }
    else:
      endCall()
      lastError = "timeout_or_failed"
      logAttempt(number, lastError)

  // After 3 failed call attempts → SMS fallback
  smsPayload = buildSmsPayload(incidentType, location)  // see §4.1
  smsSent = sendSms(smsPayload)
  if smsSent: return { success: true, mode: "sms" }

  // USSD if available
  if canUseUssd(): tryUssdFallback(); return { success: true, mode: "ussd" }

  // Else queue locally (encrypted), auto-sync when online
  saveToLocalQueue(incidentType, location, payload)
  return { success: false, mode: "queued", localId }
```

### 4.1 SMS fallback payload (encoded)

After 3 failed call attempts, send SMS with body:

```text
SOS|TYPE:[INCIDENT]|LAT:[lat]|LNG:[lng]|TIME:[ISO]|ID:[device_token]
```

- **Example:**  
  `SOS|TYPE:medical|LAT:5.6037|LNG:-0.1870|TIME:2026-03-01T12:00:00Z|ID:abc123`
- **Gateway:** Send to agreed dispatch SMS gateway number; server may parse and forward to NECC/agency systems.

---

## 5. Privacy & consent

### 5.1 Runtime permissions (request before first use)

| Permission | Purpose |
|------------|---------|
| `CALL_PHONE` (Android) / Phone (iOS) | Place emergency call. |
| `RECORD_AUDIO` | Optional: auto-play message, “Read to operator” TTS; only if user enables. |
| `ACCESS_FINE_LOCATION` | GPS for live location and address. |

### 5.2 Explicit consent

- **Background mic streaming:** If implemented, show a clear consent screen: “Allow background audio for emergency auto-message?” Yes / No.
- **Auto-play recording:** “Play automated message to operator when call connects?” Yes / No. Default Off.

### 5.3 Logging

- **Do log (metadata only):** timestamp, lat, lng, accuracy, call duration, which number reached, fallback used (call / SMS / USSD / queued).
- **Do not attach raw audio** unless user explicitly opts in (e.g. “Send recording to dispatch for quality improvement”).

---

## 6. Security & legal notes

### 6.1 Consent screen (before first use)

- One-time screen: “This feature will call 112 (Ghana National Emergency) and may share your location and incident type. By continuing you agree to use this only for real emergencies.” [ I agree ] [ Cancel ].

### 6.2 Log integrity

- Make logs **tamper-evident**: e.g. HMAC(log_line, server_salt) or hash with server-provided salt before upload.
- Store salt per-user or per-session; do not log raw audio unless user opted in.

### 6.3 Ghana emergency routing (integration notes)

- **112** — National Emergency Coordination Centre (NECC); primary unified number.
- **191** — Ghana Police Service.
- **192** — Ghana National Fire Service.
- **193** — National Ambulance Service.

Coordinate with official services to:

- Confirm current 112/191/192/193 routing and any network-specific behaviour (e.g. 18555).
- Agree SMS gateway format and destination for `SOS|TYPE:...` payloads.
- Agree callback verification procedure (e.g. dispatch may call back the number in the payload).

---

## 7. Developer snippets (ready-to-run)

### 7.1 Android (Kotlin) — ACTION_CALL and permissions

```kotlin
// AndroidManifest.xml
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

// Activity/Fragment
private fun checkAndCall(number: String) {
    when {
        ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED ->
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CALL_PHONE), REQ_CALL)
        else -> placeCall(number)
    }
}

private fun placeCall(number: String) {
    val intent = Intent(Intent.ACTION_CALL).apply {
        data = Uri.parse("tel:${number.trim()}")
    }
    startActivity(intent)
}

override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
    if (requestCode == REQ_CALL && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED)
        placeCall(pendingEmergencyNumber)
}
```

### 7.2 React Native (Expo) — tel and permission checks

```ts
import { Linking, Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';

const GHANA_EMERGENCY_SEQUENCE = ['112', '191', '193', '192'];

async function requestCallPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
    { title: 'Emergency call', message: 'Allow placing emergency calls.', buttonPositive: 'OK' }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

async function placeEmergencyCall(number: string): Promise<void> {
  const url = `tel:${number.replace(/\s/g, '')}`;
  const can = await Linking.canOpenURL(url);
  if (!can) throw new Error('Cannot place call');
  await Linking.openURL(url);
}

// Usage: after permission, call first number in sequence; implement timeout/fallback in app logic
const hasPermission = await requestCallPermission();
if (hasPermission) await placeEmergencyCall(GHANA_EMERGENCY_SEQUENCE[0]);
```

### 7.3 Flutter — url_launcher

```dart
import 'package:url_launcher/url_launcher.dart';

final sequence = ['112', '191', '193', '192'];

Future<void> placeEmergencyCall(String number) async {
  final uri = Uri.parse('tel:${number.trim()}');
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

// Usage
await placeEmergencyCall(sequence.first);
```

### 7.4 SMS fallback — server gateway payload (JSON)

If dispatch accepts HTTP instead of (or in addition to) SMS, POST a JSON body:

```json
{
  "version": "1",
  "channel": "voice_fallback",
  "payload": {
    "type": "SOS",
    "incident": "medical",
    "lat": 5.6037,
    "lng": -0.1870,
    "time": "2026-03-01T12:00:00Z",
    "deviceId": "abc123",
    "callback": "+233XXXXXXXXX",
    "address": "Human readable address"
  }
}
```

- Client: on 3 failed call attempts, either send SMS with `SOS|TYPE:...` body or POST this JSON to agreed endpoint (e.g. `https://dispatch.example.com/emergency`).

---

## 8. Edge cases & tests

### 8.1 Edge cases

| Case | Behaviour |
|------|-----------|
| **Airplane mode** | No call/SMS; show “Turn off airplane mode to call” and optionally save to local queue. |
| **SIM-less / no cellular** | Same as airplane; queue locally and auto-sync when connectivity returns. |
| **Dual-SIM** | Use default voice SIM; document that user should set preferred SIM for calls. |
| **Weak signal** | Proceed with call; on timeout (15s) treat as failed and try next number, then SMS. |
| **User cancels mid-flow** | End call; do not continue to next number; log “user_cancelled”. |
| **Permission denied** | Show “Enable phone and location in Settings to use emergency call”; do not place call. |

### 8.2 Test plan

**Manual test matrix**

| # | Scenario | Steps | Expected |
|---|----------|--------|----------|
| 1 | Happy path — 112 answers | Grant permissions, tap Call & send location | Call to 112; location sent. |
| 2 | 112 fails → 191 | Mock 112 busy/fail; wait 15s | Auto-dial 191. |
| 3 | All 3 calls fail → SMS | Mock all numbers fail | SMS sent with SOS\|TYPE:... payload. |
| 4 | SMS fails → queue | No SIM / SMS denied | Incident queued; sync when online. |
| 5 | Silent call ON | Enable silent, place call | Device does not ring loudly. |
| 6 | Auto-play ON | Enable auto-play, place call | Message plays after connect. |
| 7 | Permission denied | Deny CALL_PHONE | No call; in-app message to enable. |
| 8 | Airplane mode | Enable airplane, tap call | Message + optional queue. |
| 9 | User cancels | Start call, hang up within 15s | No next number; log cancel. |

**Automated (unit) tests for fallback logic**

- Given `attempts = 3` and all `waitForCallConnected` return false → next step is SMS.
- Given SMS fails and `canUseUssd() === false` → `saveToLocalQueue` called and returns `mode: "queued"`.
- Given first number connects → return `{ success: true, number: "112" }` and do not try next.

---

## 9. Integration checklist for dispatch

- [ ] Confirm official numbers with NECC/agency: 112, 191, 193, 192 (and 18555 if applicable).
- [ ] Agree SMS gateway: destination number(s), max message length, and format (`SOS|TYPE:...`).
- [ ] Agree HTTP endpoint (if used): URL, auth, JSON schema, rate limits.
- [ ] Define callback verification: how dispatch will call back the number in the payload.
- [ ] Confirm whether USSD fallback is supported and code (e.g. `*112#`).
- [ ] Sign data-sharing / MOU if required by agency for receiving automated payloads.

---

## 10. Quick QA checklist (product manager, pre-release)

1. **Permissions:** On fresh install, consent screen appears once; all three permissions (call, location, optional mic) requestable and denial handled with clear message.
2. **Call order:** 112 → 191 → 193 → 192 with 15s timeout; after 3 failures, SMS sent with correct `SOS|TYPE:...` format.
3. **UI:** SOS button, live GPS + accuracy, address, incident type, Silent call, Auto-play, and “Call & send location” all visible and wired; “Read to operator” plays correct script.
4. **Offline / no SIM:** No crash; incident queued and synced when back online (or clear “Enable network” message).
5. **Privacy:** No raw audio uploaded unless user opted in; metadata log is tamper-evident (HMAC/hash).
6. **Legal:** Consent screen and Ghana numbers (112, 191, 192, 193) match current official routing; integration checklist (§9) completed with dispatch.

---

*End of spec. Prioritise reliability and user safety; iterate with NECC/agency on gateway format and callback procedure.*
