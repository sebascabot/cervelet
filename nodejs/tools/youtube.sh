#!/usr/bin/env bash

YOUTUBE_VIDEO_URL="https://www.youtube.com/watch?v=HCjNJDNzw8Y"

youtube-dl --audio-format mp3 -x "${YOUTUBE_VIDEO_URL}"

