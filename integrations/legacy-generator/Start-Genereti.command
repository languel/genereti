#!/bin/zsh
cd "${0:A:h}"
if ! curl --silent --fail http://127.0.0.1:8765/api/status >/dev/null; then
  open http://127.0.0.1:8765
  ./run.sh
else
  open http://127.0.0.1:8765
fi
