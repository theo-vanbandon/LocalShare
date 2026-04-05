import socket
from unittest.mock import MagicMock, patch

import pytest

from utils import format_size, get_local_ip


class TestFormatSize:
    """Tests de la fonction format_size"""

    def test_octets(self):
        assert format_size(512) == "512.0 o"

    def test_kilo_octets(self):
        assert format_size(1024) == "1.0 Ko"

    def test_mega_octets(self):
        assert format_size(1024 ** 2) == "1.0 Mo"

    def test_giga_octets(self):
        assert format_size(1024 ** 3) == "1.0 Go"

    def test_tera_octets(self):
        assert format_size(1024 ** 4) == "1.0 To"

    def test_zero(self):
        assert format_size(0) == "0.0 o"

    def test_valeur_decimale(self):
        assert format_size(1536) == "1.5 Ko"

    def test_juste_sous_1ko(self):
        assert format_size(1023) == "1023.0 o"


class TestGetLocalIp:
    """Tests de la fonction get_local_ip"""

    def test_retourne_une_ip_valide(self):
        ip = get_local_ip()
        parts = ip.split(".")
        assert len(parts) == 4
        assert all(p.isdigit() for p in parts)

    def test_fallback_si_reseau_indisponible(self):
        with patch("socket.socket") as mock_socket:
            mock_socket.return_value.connect.side_effect = OSError
            ip = get_local_ip()
        assert ip == "127.0.0.1"

    def test_format_ipv4(self):
        ip = get_local_ip()
        assert ip.count(".") == 3
