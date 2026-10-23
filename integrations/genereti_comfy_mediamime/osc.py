"""A small OSC 1.0 encoder (no dependency) and the rules for where it may send."""
import ipaddress
import re
import socket
import struct

ADDRESS = re.compile(r'^/[\w./:\-]{0,200}$')
MAX_MESSAGES = 128


def _string(value: str) -> bytes:
    data = value.encode('utf-8') + b'\0'
    return data + b'\0' * (-len(data) % 4)


def encode(address: str, args) -> bytes:
    """One OSC message: floats as float32, integers as int32, bools as T/F, strings as strings."""
    if not ADDRESS.match(address):
        raise ValueError('Invalid OSC address')
    tags, body = ',', b''
    for arg in args:
        if isinstance(arg, bool):
            tags += 'T' if arg else 'F'
        elif isinstance(arg, int) and -2**31 <= arg < 2**31:
            tags += 'i'; body += struct.pack('>i', arg)
        elif isinstance(arg, (int, float)):
            tags += 'f'; body += struct.pack('>f', float(arg))
        elif isinstance(arg, str) and len(arg) <= 256:
            tags += 's'; body += _string(arg)
        else:
            raise ValueError('Unsupported OSC argument')
    return _string(address) + _string(tags) + body


def allowed_host(host: str) -> bool:
    """Loopback and private networks only: this never sends to the public internet."""
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(host))
    except (OSError, ValueError):
        return False
    return ip.is_loopback or ip.is_private or ip.is_link_local


def send(sock, host: str, port: int, address: str, args) -> None:
    if not (1 <= int(port) <= 65535) or not allowed_host(host):
        raise ValueError('OSC goes to loopback or private-network hosts only')
    sock.sendto(encode(address, args), (host, int(port)))
