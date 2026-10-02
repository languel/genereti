#!/usr/bin/env python3
"""Pin official Comfy MCP's CLI calls to the Desktop instance's workspace."""
import os
import sys
binary = os.environ['GENERETI_COMFY_REAL_BIN']
workspace = os.environ['GENERETI_COMFY_WORKSPACE']
os.execv(binary, [binary, '--workspace', workspace, *sys.argv[1:]])
