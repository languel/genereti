"""Docked assistant and local workspace bridge; no generator dependency."""
import folder_paths
from server import PromptServer
from .backend import register
register(PromptServer.instance.routes, folder_paths.base_path)
WEB_DIRECTORY = './web'
NODE_CLASS_MAPPINGS = {}
