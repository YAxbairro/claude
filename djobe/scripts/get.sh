#!/bin/bash
# usage: get.sh id...  -> docs/<id>.pdf (act PDF, or whole bulletin for older acts) + docs/<id>.txt
cd "$(dirname "$0")/.."
for id in "$@"; do
  f=docs/$id.pdf
  if ! file $f 2>/dev/null | grep -q PDF; then
    curl -s -m 120 -L "https://boe.incv.cv/Bulletins/DownloadAct?id=$id" -o $f
    if ! file $f | grep -q PDF; then
      bid=$(curl -s -m 40 "https://boe.incv.cv/Bulletins/View?id=$id" | grep -o -E 'href="/Bulletins/Details/[^"]*/([0-9]+)"' | head -1 | grep -o -E '[0-9]+"$' | tr -d '"')
      [ -n "$bid" ] && curl -s -m 180 -L "https://boe.incv.cv/Bulletins/Download/$bid" -o $f
      echo "   (bulletin $bid)"
    fi
  fi
  if file $f | grep -q PDF; then
    pdftotext $f docs/$id.txt 2>/dev/null
    echo "== $id pages=$(pdfinfo $f | awk '/^Pages/{print $2}') chars=$(wc -c < docs/$id.txt)"
  else echo "== $id FAILED"; fi
done
