#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # Auto-delegate to local virtual environment if run with global python
    venv_python = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'venv', 'Scripts', 'python.exe')
    if not os.path.exists(venv_python):
        venv_python = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'venv', 'bin', 'python')

    if (sys.prefix == getattr(sys, 'base_prefix', sys.prefix)) and os.path.exists(venv_python) and os.path.abspath(sys.executable).lower() != os.path.abspath(venv_python).lower():
        import subprocess
        sys.exit(subprocess.call([venv_python] + sys.argv))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'merger.settings')
    # Auto-bind to 0.0.0.0:8000 for LAN & mobile access
    if len(sys.argv) == 2 and sys.argv[1] == 'runserver':
        sys.argv.append('0.0.0.0:8000')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
