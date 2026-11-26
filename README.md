# SW HD

Keep WhatsApp Status videos sharp. SW HD splits and re-encodes your video right in the browser, so nothing is uploaded anywhere.

**Try it:** https://kyoharu411.github.io/HD-uploader/

The interface is in Indonesian.

## How it works

WhatsApp squashes videos that are too big or too long. SW HD prepares the video first: it cuts it into parts that fit the Status length limit and encodes each part to a target file size, keeping the resolution (up to 1080p) and frame rate.

1. Pick a video.
2. Open **Setelan** if you want to change anything.
3. Tap **Gas proses** and wait.
4. Save or share each part, then post them in order.

## Settings

| Setting | Options |
| --- | --- |
| Mode | Bagus (slower, sharper) or Cepat (faster) |
| Target size | 7, 10 or 15 MB per part |
| Frame rate | 30 or 60 fps |
| Part length | 30, 60 or 90 seconds |
| Manual bitrate | Optional, in kbps. Overrides target size |

If the phone runs out of memory, it steps down automatically (1080p, then 720p, then 540p).

## Install

Open the site in Chrome, then menu, **Install app**.

## Run locally

```
sh setup.sh
python3 -m http.server 8080
```

Open http://localhost:8080. `setup.sh` downloads the ffmpeg files into `lib/` (needs npm).

## Good to know

- Encoding happens on your device, so long or heavy videos can be slow.
- Results depend on your WhatsApp version. Posting through Forward from a chat sometimes looks better than posting straight from the gallery.
- If something fails, the app has a button to copy an error report.

## Built with

[ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)

By [@Kyoharu411](https://github.com/Kyoharu411)
